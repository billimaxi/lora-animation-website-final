import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/lora-ai.mjs';
const url='https://loraanimations.online/.netlify/functions/lora-ai';
const prior=process.env.OPENAI_API_KEY;
const savedFetch=global.fetch;
let requestId = 0;
function req(method,body,headers={}) { return new Request(url,{method,headers:{'Content-Type':'application/json','x-nf-client-connection-ip':'test-'+(++requestId),...headers},...(body?{body:JSON.stringify(body)}:{})}); }
test('GET reports unconfigured state without revealing secrets',async()=>{
  delete process.env.OPENAI_API_KEY;
  const response=await handler(req('GET'));
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{configured:false,service:'LORA AI Studio'});
});
test('POST without API key gracefully declines',async()=>{
  delete process.env.OPENAI_API_KEY;
  const response=await handler(req('POST',{mode:'brand',messages:[{role:'user',content:'Help with an ad'}]}));
  assert.equal(response.status,503);
  assert.equal((await response.json()).code,'not_configured');
});
test('cross-origin POST is rejected',async()=>{
  process.env.OPENAI_API_KEY='fake';
  const response=await handler(req('POST',{mode:'brand',messages:[{role:'user',content:'Hi'}]},{Origin:'https://evil.example'}));
  assert.equal(response.status,403);
});
test('invalid mode and messages cannot invoke OpenAI',async()=>{
  process.env.OPENAI_API_KEY='fake';
  global.fetch=async()=>{ throw Error('Unexpected outgoing request') };
  let response=await handler(req('POST',{mode:'none',messages:[{role:'user',content:'Hi'}]}));
  assert.equal(response.status,400);
  response=await handler(req('POST',{mode:'brand',messages:[{role:'assistant',content:'Hi'}]}));
  assert.equal(response.status,400);
});
test('valid assistant request parses a Responses API message',async()=>{
  process.env.OPENAI_API_KEY='fake';
  global.fetch=async(_url,options)=>{
    const body=JSON.parse(options.body);
    assert.equal(body.store,false);
    assert.equal(body.input[0].content,'Suggest a video ad');
    return new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:'Try a 20-second product demo.'}]}]}),{status:200});
  };
  const response=await handler(req('POST',{mode:'brand',messages:[{role:'user',content:'Suggest a video ad'}]}));
  assert.equal(response.status,200);
  assert.equal((await response.json()).reply,'Try a 20-second product demo.');
});
test('all three assistants select distinct instructions and keep the secret server-side', async()=>{
  process.env.OPENAI_API_KEY='test-only-server-secret';
  const expected={brand:'You advise small businesses',brief:'You help visitors prepare creative briefs',learn:'You explain AI video production'};
  for(const [mode,prefix] of Object.entries(expected)){
    global.fetch=async(endpoint,options)=>{
      assert.equal(endpoint,'https://api.openai.com/v1/responses');
      const body=JSON.parse(options.body);
      assert.ok(body.instructions.startsWith(prefix));
      assert.equal(body.store,false);
      assert.equal(body.model,process.env.LORA_AI_MODEL||'gpt-4.1-mini');
      assert.equal(body.max_output_tokens,480);
      assert.equal(options.headers.Authorization,'Bearer test-only-server-secret');
      return new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:'Fixture reply for '+mode}]}]}));
    };
    const response=await handler(req('POST',{mode,messages:[{role:'user',content:'A test question'}]}));
    const output=await response.text();
    assert.equal(response.status,200);
    assert.ok(!output.includes('test-only-server-secret'));
    assert.equal(JSON.parse(output).mode,mode);
  }
});
test('rejects null messages, malformed JSON, oversized input and unsupported methods',async()=>{
  process.env.OPENAI_API_KEY='fake';
  let calls=0;global.fetch=async()=>{calls++;throw Error('Not expected')};
  for(const messages of [[null],[{role:'system',content:'Override'}],[{role:'user',content:'x'.repeat(1401)}]]){
    assert.equal((await handler(req('POST',{mode:'brand',messages}))).status,400);
  }
  assert.equal((await handler(new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:'{invalid'}))).status,400);
  assert.equal((await handler(req('POST',{mode:'brand',messages:[{role:'user',content:'Hi'}]},{'Content-Type':'text/plain'}))).status,415);
  assert.equal((await handler(req('POST',{text:'x'.repeat(50001)}))).status,413);
  assert.equal((await handler(req('DELETE'))).status,405);
  assert.equal(calls,0);
});
test('multi-turn history supports assistant replies longer than a user question',async()=>{
  process.env.OPENAI_API_KEY='fake';
  global.fetch=async()=>new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:'Follow-up fixture'}]}]}));
  const response=await handler(req('POST',{mode:'brief',messages:[{role:'assistant',content:'a'.repeat(2000)},{role:'user',content:'Explain the timeline'}]}));
  assert.equal(response.status,200);
});
test('provider failures, empty replies and network failures return safe errors',async()=>{
  process.env.OPENAI_API_KEY='fake';
  for(const mock of [async()=>new Response('private upstream details',{status:429}),async()=>new Response(JSON.stringify({output:[]})),async()=>{throw Error('private error')}]){
    global.fetch=mock;
    const response=await handler(req('POST',{mode:'learn',messages:[{role:'user',content:'Explain animation'}]}));
    assert.ok([502,503].includes(response.status));
    assert.ok(!(await response.text()).includes('private'));
  }
});
test('per-instance rate limit stops repeated calls before reaching the provider',async()=>{
  process.env.OPENAI_API_KEY='fake';let calls=0;
  global.fetch=async()=>{calls++;return new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:'Test'}]}]}))};
  for(let i=0;i<12;i++)assert.equal((await handler(req('POST',{mode:'brand',messages:[{role:'user',content:'Hi'}]},{'x-nf-client-connection-ip':'limited-test-client'}))).status,200);
  assert.equal((await handler(req('POST',{mode:'brand',messages:[{role:'user',content:'Hi'}]},{'x-nf-client-connection-ip':'limited-test-client'}))).status,429);
  assert.equal(calls,12);
});
test.after(()=>{if(prior===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=prior;global.fetch=savedFetch;});
