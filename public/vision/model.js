export const doctors=[
  {id:'wickler',name:'Dr. Wickler',initials:'W',field:'Illustrative Auslastung',loads:{morning:6,afternoon:5}},
  {id:'a',name:'Fachärztin A',initials:'A',field:'Fiktives Arztprofil',loads:{morning:3,afternoon:2}},
  {id:'b',name:'Facharzt B',initials:'B',field:'Fiktives Arztprofil',loads:{morning:2,afternoon:3}}
];
export function initialState(){return {request:null,intake:null,reviewed:false,callbackDone:false};}
export function capacity(shift='morning'){return doctors.map(d=>d.loads[shift==='afternoon'?'afternoon':'morning']);}
export function metrics(state,shift='morning'){return {requests:state.request&&!state.callbackDone?1:0,records:state.intake?1:0,reviewed:state.reviewed?1:0,occupied:capacity(shift).reduce((sum,n)=>sum+n,0),total:18};}
