export const times = ['09:00','09:30','10:00','10:30','11:00','11:30'];
export const doctors = [
  {id:'wickler',name:'Dr. Wickler',initials:'W',field:'Wunscharzt · Beispielkalender',needs:['general','followup'],busy:[0,1,2,3,4,5]},
  {id:'a',name:'Fachärztin A',initials:'A',field:'Fiktives Profil · Allgemeine Orthopädie',needs:['general'],busy:[0,2,4]},
  {id:'b',name:'Facharzt B',initials:'B',field:'Fiktives Profil · Allgemeine Orthopädie',needs:['general'],busy:[1,3]}
];
export function initialState(){return {request:null,booking:null,intake:null,reviewed:false,callbackDone:false};}
export function available(state,doctorId,index,need){const d=doctors.find(d=>d.id===doctorId);return !!d && Number.isInteger(index) && index>=0 && index<times.length && d.needs.includes(need) && !d.busy.includes(index) && !(state.booking?.doctor===doctorId && state.booking?.index===index);}
export function reserve(state,{doctor,index,need,consent,review}){if(!state.request || state.request.type!=='appointment'||state.booking||!consent||!review||!available(state,doctor,index,need))return false;state.booking={doctor,index,need};return true;}
export function metrics(state){return {requests:state.request&&!state.booking&&!state.callbackDone?1:0,bookings:state.booking?1:0,records:state.intake?1:0,occupied:11+(state.booking?1:0),total:18};}
