var T0=Object.defineProperty;var E0=(e,t,r)=>t in e?T0(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var Tl=(e,t,r)=>E0(e,typeof t!="symbol"?t+"":t,r);/**
* @vue/shared v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**//*! #__NO_SIDE_EFFECTS__ */function ko(e){const t=Object.create(null);for(const r of e.split(","))t[r]=1;return r=>r in t}const je={},cn=[],Jt=()=>{},I0=()=>!1,as=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&(e.charCodeAt(2)>122||e.charCodeAt(2)<97),To=e=>e.startsWith("onUpdate:"),ct=Object.assign,Eo=(e,t)=>{const r=e.indexOf(t);r>-1&&e.splice(r,1)},C0=Object.prototype.hasOwnProperty,Le=(e,t)=>C0.call(e,t),Ie=Array.isArray,pn=e=>os(e)==="[object Map]",Yf=e=>os(e)==="[object Set]",Ce=e=>typeof e=="function",nt=e=>typeof e=="string",Ar=e=>typeof e=="symbol",Qe=e=>e!==null&&typeof e=="object",Jf=e=>(Qe(e)||Ce(e))&&Ce(e.then)&&Ce(e.catch),eh=Object.prototype.toString,os=e=>eh.call(e),z0=e=>os(e).slice(8,-1),th=e=>os(e)==="[object Object]",Io=e=>nt(e)&&e!=="NaN"&&e[0]!=="-"&&""+parseInt(e,10)===e,Vn=ko(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),us=e=>{const t=Object.create(null);return r=>t[r]||(t[r]=e(r))},O0=/-(\w)/g,zr=us(e=>e.replace(O0,(t,r)=>r?r.toUpperCase():"")),A0=/\B([A-Z])/g,Jr=us(e=>e.replace(A0,"-$1").toLowerCase()),rh=us(e=>e.charAt(0).toUpperCase()+e.slice(1)),Rs=us(e=>e?`on${rh(e)}`:""),Cr=(e,t)=>!Object.is(e,t),Ms=(e,...t)=>{for(let r=0;r<e.length;r++)e[r](...t)},nh=(e,t,r,n=!1)=>{Object.defineProperty(e,t,{configurable:!0,enumerable:!1,writable:n,value:r})},R0=e=>{const t=parseFloat(e);return isNaN(t)?e:t};let El;const ls=()=>El||(El=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function Co(e){if(Ie(e)){const t={};for(let r=0;r<e.length;r++){const n=e[r],s=nt(n)?P0(n):Co(n);if(s)for(const i in s)t[i]=s[i]}return t}else if(nt(e)||Qe(e))return e}const M0=/;(?![^(]*\))/g,B0=/:([^]+)/,N0=/\/\*[^]*?\*\//g;function P0(e){const t={};return e.replace(N0,"").split(M0).forEach(r=>{if(r){const n=r.split(B0);n.length>1&&(t[n[0].trim()]=n[1].trim())}}),t}function zo(e){let t="";if(nt(e))t=e;else if(Ie(e))for(let r=0;r<e.length;r++){const n=zo(e[r]);n&&(t+=n+" ")}else if(Qe(e))for(const r in e)e[r]&&(t+=r+" ");return t.trim()}const D0="itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",U0=ko(D0);function ih(e){return!!e||e===""}const sh=e=>!!(e&&e.__v_isRef===!0),xr=e=>nt(e)?e:e==null?"":Ie(e)||Qe(e)&&(e.toString===eh||!Ce(e.toString))?sh(e)?xr(e.value):JSON.stringify(e,ah,2):String(e),ah=(e,t)=>sh(t)?ah(e,t.value):pn(t)?{[`Map(${t.size})`]:[...t.entries()].reduce((r,[n,s],i)=>(r[Bs(n,i)+" =>"]=s,r),{})}:Yf(t)?{[`Set(${t.size})`]:[...t.values()].map(r=>Bs(r))}:Ar(t)?Bs(t):Qe(t)&&!Ie(t)&&!th(t)?String(t):t,Bs=(e,t="")=>{var r;return Ar(e)?`Symbol(${(r=e.description)!=null?r:t})`:e};/**
* @vue/reactivity v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let St;class W0{constructor(t=!1){this.detached=t,this._active=!0,this.effects=[],this.cleanups=[],this._isPaused=!1,this.parent=St,!t&&St&&(this.index=(St.scopes||(St.scopes=[])).push(this)-1)}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let t,r;if(this.scopes)for(t=0,r=this.scopes.length;t<r;t++)this.scopes[t].pause();for(t=0,r=this.effects.length;t<r;t++)this.effects[t].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let t,r;if(this.scopes)for(t=0,r=this.scopes.length;t<r;t++)this.scopes[t].resume();for(t=0,r=this.effects.length;t<r;t++)this.effects[t].resume()}}run(t){if(this._active){const r=St;try{return St=this,t()}finally{St=r}}}on(){St=this}off(){St=this.parent}stop(t){if(this._active){this._active=!1;let r,n;for(r=0,n=this.effects.length;r<n;r++)this.effects[r].stop();for(this.effects.length=0,r=0,n=this.cleanups.length;r<n;r++)this.cleanups[r]();if(this.cleanups.length=0,this.scopes){for(r=0,n=this.scopes.length;r<n;r++)this.scopes[r].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!t){const s=this.parent.scopes.pop();s&&s!==this&&(this.parent.scopes[this.index]=s,s.index=this.index)}this.parent=void 0}}}function L0(){return St}let Ge;const Ns=new WeakSet;class oh{constructor(t){this.fn=t,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,St&&St.active&&St.effects.push(this)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,Ns.has(this)&&(Ns.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||lh(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,Il(this),dh(this);const t=Ge,r=Ut;Ge=this,Ut=!0;try{return this.fn()}finally{ch(this),Ge=t,Ut=r,this.flags&=-3}}stop(){if(this.flags&1){for(let t=this.deps;t;t=t.nextDep)Ro(t);this.deps=this.depsTail=void 0,Il(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?Ns.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){Ka(this)&&this.run()}get dirty(){return Ka(this)}}let uh=0,Hn,Gn;function lh(e,t=!1){if(e.flags|=8,t){e.next=Gn,Gn=e;return}e.next=Hn,Hn=e}function Oo(){uh++}function Ao(){if(--uh>0)return;if(Gn){let t=Gn;for(Gn=void 0;t;){const r=t.next;t.next=void 0,t.flags&=-9,t=r}}let e;for(;Hn;){let t=Hn;for(Hn=void 0;t;){const r=t.next;if(t.next=void 0,t.flags&=-9,t.flags&1)try{t.trigger()}catch(n){e||(e=n)}t=r}}if(e)throw e}function dh(e){for(let t=e.deps;t;t=t.nextDep)t.version=-1,t.prevActiveLink=t.dep.activeLink,t.dep.activeLink=t}function ch(e){let t,r=e.depsTail,n=r;for(;n;){const s=n.prevDep;n.version===-1?(n===r&&(r=s),Ro(n),q0(n)):t=n,n.dep.activeLink=n.prevActiveLink,n.prevActiveLink=void 0,n=s}e.deps=t,e.depsTail=r}function Ka(e){for(let t=e.deps;t;t=t.nextDep)if(t.dep.version!==t.version||t.dep.computed&&(ph(t.dep.computed)||t.dep.version!==t.version))return!0;return!!e._dirty}function ph(e){if(e.flags&4&&!(e.flags&16)||(e.flags&=-17,e.globalVersion===ti))return;e.globalVersion=ti;const t=e.dep;if(e.flags|=2,t.version>0&&!e.isSSR&&e.deps&&!Ka(e)){e.flags&=-3;return}const r=Ge,n=Ut;Ge=e,Ut=!0;try{dh(e);const s=e.fn(e._value);(t.version===0||Cr(s,e._value))&&(e._value=s,t.version++)}catch(s){throw t.version++,s}finally{Ge=r,Ut=n,ch(e),e.flags&=-3}}function Ro(e,t=!1){const{dep:r,prevSub:n,nextSub:s}=e;if(n&&(n.nextSub=s,e.prevSub=void 0),s&&(s.prevSub=n,e.nextSub=void 0),r.subs===e&&(r.subs=n,!n&&r.computed)){r.computed.flags&=-5;for(let i=r.computed.deps;i;i=i.nextDep)Ro(i,!0)}!t&&!--r.sc&&r.map&&r.map.delete(r.key)}function q0(e){const{prevDep:t,nextDep:r}=e;t&&(t.nextDep=r,e.prevDep=void 0),r&&(r.prevDep=t,e.nextDep=void 0)}let Ut=!0;const fh=[];function Rr(){fh.push(Ut),Ut=!1}function Mr(){const e=fh.pop();Ut=e===void 0?!0:e}function Il(e){const{cleanup:t}=e;if(e.cleanup=void 0,t){const r=Ge;Ge=void 0;try{t()}finally{Ge=r}}}let ti=0;class F0{constructor(t,r){this.sub=t,this.dep=r,this.version=r.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}}class Mo{constructor(t){this.computed=t,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0}track(t){if(!Ge||!Ut||Ge===this.computed)return;let r=this.activeLink;if(r===void 0||r.sub!==Ge)r=this.activeLink=new F0(Ge,this),Ge.deps?(r.prevDep=Ge.depsTail,Ge.depsTail.nextDep=r,Ge.depsTail=r):Ge.deps=Ge.depsTail=r,hh(r);else if(r.version===-1&&(r.version=this.version,r.nextDep)){const n=r.nextDep;n.prevDep=r.prevDep,r.prevDep&&(r.prevDep.nextDep=n),r.prevDep=Ge.depsTail,r.nextDep=void 0,Ge.depsTail.nextDep=r,Ge.depsTail=r,Ge.deps===r&&(Ge.deps=n)}return r}trigger(t){this.version++,ti++,this.notify(t)}notify(t){Oo();try{for(let r=this.subs;r;r=r.prevSub)r.sub.notify()&&r.sub.dep.notify()}finally{Ao()}}}function hh(e){if(e.dep.sc++,e.sub.flags&4){const t=e.dep.computed;if(t&&!e.dep.subs){t.flags|=20;for(let n=t.deps;n;n=n.nextDep)hh(n)}const r=e.dep.subs;r!==e&&(e.prevSub=r,r&&(r.nextSub=e)),e.dep.subs=e}}const Qa=new WeakMap,Gr=Symbol(""),Za=Symbol(""),ri=Symbol("");function lt(e,t,r){if(Ut&&Ge){let n=Qa.get(e);n||Qa.set(e,n=new Map);let s=n.get(r);s||(n.set(r,s=new Mo),s.map=n,s.key=r),s.track()}}function cr(e,t,r,n,s,i){const a=Qa.get(e);if(!a){ti++;return}const o=u=>{u&&u.trigger()};if(Oo(),t==="clear")a.forEach(o);else{const u=Ie(e),l=u&&Io(r);if(u&&r==="length"){const c=Number(n);a.forEach((p,h)=>{(h==="length"||h===ri||!Ar(h)&&h>=c)&&o(p)})}else switch((r!==void 0||a.has(void 0))&&o(a.get(r)),l&&o(a.get(ri)),t){case"add":u?l&&o(a.get("length")):(o(a.get(Gr)),pn(e)&&o(a.get(Za)));break;case"delete":u||(o(a.get(Gr)),pn(e)&&o(a.get(Za)));break;case"set":pn(e)&&o(a.get(Gr));break}}Ao()}function sn(e){const t=We(e);return t===e?t:(lt(t,"iterate",ri),Wt(e)?t:t.map(gt))}function Bo(e){return lt(e=We(e),"iterate",ri),e}const V0={__proto__:null,[Symbol.iterator](){return Ps(this,Symbol.iterator,gt)},concat(...e){return sn(this).concat(...e.map(t=>Ie(t)?sn(t):t))},entries(){return Ps(this,"entries",e=>(e[1]=gt(e[1]),e))},every(e,t){return ir(this,"every",e,t,void 0,arguments)},filter(e,t){return ir(this,"filter",e,t,r=>r.map(gt),arguments)},find(e,t){return ir(this,"find",e,t,gt,arguments)},findIndex(e,t){return ir(this,"findIndex",e,t,void 0,arguments)},findLast(e,t){return ir(this,"findLast",e,t,gt,arguments)},findLastIndex(e,t){return ir(this,"findLastIndex",e,t,void 0,arguments)},forEach(e,t){return ir(this,"forEach",e,t,void 0,arguments)},includes(...e){return Ds(this,"includes",e)},indexOf(...e){return Ds(this,"indexOf",e)},join(e){return sn(this).join(e)},lastIndexOf(...e){return Ds(this,"lastIndexOf",e)},map(e,t){return ir(this,"map",e,t,void 0,arguments)},pop(){return kn(this,"pop")},push(...e){return kn(this,"push",e)},reduce(e,...t){return Cl(this,"reduce",e,t)},reduceRight(e,...t){return Cl(this,"reduceRight",e,t)},shift(){return kn(this,"shift")},some(e,t){return ir(this,"some",e,t,void 0,arguments)},splice(...e){return kn(this,"splice",e)},toReversed(){return sn(this).toReversed()},toSorted(e){return sn(this).toSorted(e)},toSpliced(...e){return sn(this).toSpliced(...e)},unshift(...e){return kn(this,"unshift",e)},values(){return Ps(this,"values",gt)}};function Ps(e,t,r){const n=Bo(e),s=n[t]();return n!==e&&!Wt(e)&&(s._next=s.next,s.next=()=>{const i=s._next();return i.value&&(i.value=r(i.value)),i}),s}const H0=Array.prototype;function ir(e,t,r,n,s,i){const a=Bo(e),o=a!==e&&!Wt(e),u=a[t];if(u!==H0[t]){const p=u.apply(e,i);return o?gt(p):p}let l=r;a!==e&&(o?l=function(p,h){return r.call(this,gt(p),h,e)}:r.length>2&&(l=function(p,h){return r.call(this,p,h,e)}));const c=u.call(a,l,n);return o&&s?s(c):c}function Cl(e,t,r,n){const s=Bo(e);let i=r;return s!==e&&(Wt(e)?r.length>3&&(i=function(a,o,u){return r.call(this,a,o,u,e)}):i=function(a,o,u){return r.call(this,a,gt(o),u,e)}),s[t](i,...n)}function Ds(e,t,r){const n=We(e);lt(n,"iterate",ri);const s=n[t](...r);return(s===-1||s===!1)&&Do(r[0])?(r[0]=We(r[0]),n[t](...r)):s}function kn(e,t,r=[]){Rr(),Oo();const n=We(e)[t].apply(e,r);return Ao(),Mr(),n}const G0=ko("__proto__,__v_isRef,__isVue"),mh=new Set(Object.getOwnPropertyNames(Symbol).filter(e=>e!=="arguments"&&e!=="caller").map(e=>Symbol[e]).filter(Ar));function j0(e){Ar(e)||(e=String(e));const t=We(this);return lt(t,"has",e),t.hasOwnProperty(e)}class gh{constructor(t=!1,r=!1){this._isReadonly=t,this._isShallow=r}get(t,r,n){if(r==="__v_skip")return t.__v_skip;const s=this._isReadonly,i=this._isShallow;if(r==="__v_isReactive")return!s;if(r==="__v_isReadonly")return s;if(r==="__v_isShallow")return i;if(r==="__v_raw")return n===(s?i?nw:wh:i?yh:bh).get(t)||Object.getPrototypeOf(t)===Object.getPrototypeOf(n)?t:void 0;const a=Ie(t);if(!s){let u;if(a&&(u=V0[r]))return u;if(r==="hasOwnProperty")return j0}const o=Reflect.get(t,r,dt(t)?t:n);return(Ar(r)?mh.has(r):G0(r))||(s||lt(t,"get",r),i)?o:dt(o)?a&&Io(r)?o:o.value:Qe(o)?s?$h(o):ds(o):o}}class _h extends gh{constructor(t=!1){super(!1,t)}set(t,r,n,s){let i=t[r];if(!this._isShallow){const u=Kr(i);if(!Wt(n)&&!Kr(n)&&(i=We(i),n=We(n)),!Ie(t)&&dt(i)&&!dt(n))return u?!1:(i.value=n,!0)}const a=Ie(t)&&Io(r)?Number(r)<t.length:Le(t,r),o=Reflect.set(t,r,n,dt(t)?t:s);return t===We(s)&&(a?Cr(n,i)&&cr(t,"set",r,n):cr(t,"add",r,n)),o}deleteProperty(t,r){const n=Le(t,r);t[r];const s=Reflect.deleteProperty(t,r);return s&&n&&cr(t,"delete",r,void 0),s}has(t,r){const n=Reflect.has(t,r);return(!Ar(r)||!mh.has(r))&&lt(t,"has",r),n}ownKeys(t){return lt(t,"iterate",Ie(t)?"length":Gr),Reflect.ownKeys(t)}}class K0 extends gh{constructor(t=!1){super(!0,t)}set(t,r){return!0}deleteProperty(t,r){return!0}}const Q0=new _h,Z0=new K0,X0=new _h(!0);const Xa=e=>e,xi=e=>Reflect.getPrototypeOf(e);function Y0(e,t,r){return function(...n){const s=this.__v_raw,i=We(s),a=pn(i),o=e==="entries"||e===Symbol.iterator&&a,u=e==="keys"&&a,l=s[e](...n),c=r?Xa:t?Ya:gt;return!t&&lt(i,"iterate",u?Za:Gr),{next(){const{value:p,done:h}=l.next();return h?{value:p,done:h}:{value:o?[c(p[0]),c(p[1])]:c(p),done:h}},[Symbol.iterator](){return this}}}}function Si(e){return function(...t){return e==="delete"?!1:e==="clear"?void 0:this}}function J0(e,t){const r={get(s){const i=this.__v_raw,a=We(i),o=We(s);e||(Cr(s,o)&&lt(a,"get",s),lt(a,"get",o));const{has:u}=xi(a),l=t?Xa:e?Ya:gt;if(u.call(a,s))return l(i.get(s));if(u.call(a,o))return l(i.get(o));i!==a&&i.get(s)},get size(){const s=this.__v_raw;return!e&&lt(We(s),"iterate",Gr),Reflect.get(s,"size",s)},has(s){const i=this.__v_raw,a=We(i),o=We(s);return e||(Cr(s,o)&&lt(a,"has",s),lt(a,"has",o)),s===o?i.has(s):i.has(s)||i.has(o)},forEach(s,i){const a=this,o=a.__v_raw,u=We(o),l=t?Xa:e?Ya:gt;return!e&&lt(u,"iterate",Gr),o.forEach((c,p)=>s.call(i,l(c),l(p),a))}};return ct(r,e?{add:Si("add"),set:Si("set"),delete:Si("delete"),clear:Si("clear")}:{add(s){!t&&!Wt(s)&&!Kr(s)&&(s=We(s));const i=We(this);return xi(i).has.call(i,s)||(i.add(s),cr(i,"add",s,s)),this},set(s,i){!t&&!Wt(i)&&!Kr(i)&&(i=We(i));const a=We(this),{has:o,get:u}=xi(a);let l=o.call(a,s);l||(s=We(s),l=o.call(a,s));const c=u.call(a,s);return a.set(s,i),l?Cr(i,c)&&cr(a,"set",s,i):cr(a,"add",s,i),this},delete(s){const i=We(this),{has:a,get:o}=xi(i);let u=a.call(i,s);u||(s=We(s),u=a.call(i,s)),o&&o.call(i,s);const l=i.delete(s);return u&&cr(i,"delete",s,void 0),l},clear(){const s=We(this),i=s.size!==0,a=s.clear();return i&&cr(s,"clear",void 0,void 0),a}}),["keys","values","entries",Symbol.iterator].forEach(s=>{r[s]=Y0(s,e,t)}),r}function No(e,t){const r=J0(e,t);return(n,s,i)=>s==="__v_isReactive"?!e:s==="__v_isReadonly"?e:s==="__v_raw"?n:Reflect.get(Le(r,s)&&s in n?r:n,s,i)}const ew={get:No(!1,!1)},tw={get:No(!1,!0)},rw={get:No(!0,!1)};const bh=new WeakMap,yh=new WeakMap,wh=new WeakMap,nw=new WeakMap;function iw(e){switch(e){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function sw(e){return e.__v_skip||!Object.isExtensible(e)?0:iw(z0(e))}function ds(e){return Kr(e)?e:Po(e,!1,Q0,ew,bh)}function vh(e){return Po(e,!1,X0,tw,yh)}function $h(e){return Po(e,!0,Z0,rw,wh)}function Po(e,t,r,n,s){if(!Qe(e)||e.__v_raw&&!(t&&e.__v_isReactive))return e;const i=s.get(e);if(i)return i;const a=sw(e);if(a===0)return e;const o=new Proxy(e,a===2?n:r);return s.set(e,o),o}function jn(e){return Kr(e)?jn(e.__v_raw):!!(e&&e.__v_isReactive)}function Kr(e){return!!(e&&e.__v_isReadonly)}function Wt(e){return!!(e&&e.__v_isShallow)}function Do(e){return e?!!e.__v_raw:!1}function We(e){const t=e&&e.__v_raw;return t?We(t):e}function aw(e){return!Le(e,"__v_skip")&&Object.isExtensible(e)&&nh(e,"__v_skip",!0),e}const gt=e=>Qe(e)?ds(e):e,Ya=e=>Qe(e)?$h(e):e;function dt(e){return e?e.__v_isRef===!0:!1}function or(e){return xh(e,!1)}function ow(e){return xh(e,!0)}function xh(e,t){return dt(e)?e:new uw(e,t)}class uw{constructor(t,r){this.dep=new Mo,this.__v_isRef=!0,this.__v_isShallow=!1,this._rawValue=r?t:We(t),this._value=r?t:gt(t),this.__v_isShallow=r}get value(){return this.dep.track(),this._value}set value(t){const r=this._rawValue,n=this.__v_isShallow||Wt(t)||Kr(t);t=n?t:We(t),Cr(t,r)&&(this._rawValue=t,this._value=n?t:gt(t),this.dep.trigger())}}function jr(e){return dt(e)?e.value:e}const lw={get:(e,t,r)=>t==="__v_raw"?e:jr(Reflect.get(e,t,r)),set:(e,t,r,n)=>{const s=e[t];return dt(s)&&!dt(r)?(s.value=r,!0):Reflect.set(e,t,r,n)}};function Sh(e){return jn(e)?e:new Proxy(e,lw)}class dw{constructor(t,r,n){this.fn=t,this.setter=r,this._value=void 0,this.dep=new Mo(this),this.__v_isRef=!0,this.deps=void 0,this.depsTail=void 0,this.flags=16,this.globalVersion=ti-1,this.next=void 0,this.effect=this,this.__v_isReadonly=!r,this.isSSR=n}notify(){if(this.flags|=16,!(this.flags&8)&&Ge!==this)return lh(this,!0),!0}get value(){const t=this.dep.track();return ph(this),t&&(t.version=this.dep.version),this._value}set value(t){this.setter&&this.setter(t)}}function cw(e,t,r=!1){let n,s;return Ce(e)?n=e:(n=e.get,s=e.set),new dw(n,s,r)}const ki={},Hi=new WeakMap;let qr;function pw(e,t=!1,r=qr){if(r){let n=Hi.get(r);n||Hi.set(r,n=[]),n.push(e)}}function fw(e,t,r=je){const{immediate:n,deep:s,once:i,scheduler:a,augmentJob:o,call:u}=r,l=S=>s?S:Wt(S)||s===!1||s===0?Ir(S,1):Ir(S);let c,p,h,m,_=!1,b=!1;if(dt(e)?(p=()=>e.value,_=Wt(e)):jn(e)?(p=()=>l(e),_=!0):Ie(e)?(b=!0,_=e.some(S=>jn(S)||Wt(S)),p=()=>e.map(S=>{if(dt(S))return S.value;if(jn(S))return l(S);if(Ce(S))return u?u(S,2):S()})):Ce(e)?t?p=u?()=>u(e,2):e:p=()=>{if(h){Rr();try{h()}finally{Mr()}}const S=qr;qr=c;try{return u?u(e,3,[m]):e(m)}finally{qr=S}}:p=Jt,t&&s){const S=p,I=s===!0?1/0:s;p=()=>Ir(S(),I)}const x=L0(),w=()=>{c.stop(),x&&x.active&&Eo(x.effects,c)};if(i&&t){const S=t;t=(...I)=>{S(...I),w()}}let y=b?new Array(e.length).fill(ki):ki;const k=S=>{if(!(!(c.flags&1)||!c.dirty&&!S))if(t){const I=c.run();if(s||_||(b?I.some((z,O)=>Cr(z,y[O])):Cr(I,y))){h&&h();const z=qr;qr=c;try{const O=[I,y===ki?void 0:b&&y[0]===ki?[]:y,m];u?u(t,3,O):t(...O),y=I}finally{qr=z}}}else c.run()};return o&&o(k),c=new oh(p),c.scheduler=a?()=>a(k,!1):k,m=S=>pw(S,!1,c),h=c.onStop=()=>{const S=Hi.get(c);if(S){if(u)u(S,4);else for(const I of S)I();Hi.delete(c)}},t?n?k(!0):y=c.run():a?a(k.bind(null,!0),!0):c.run(),w.pause=c.pause.bind(c),w.resume=c.resume.bind(c),w.stop=w,w}function Ir(e,t=1/0,r){if(t<=0||!Qe(e)||e.__v_skip||(r=r||new Set,r.has(e)))return e;if(r.add(e),t--,dt(e))Ir(e.value,t,r);else if(Ie(e))for(let n=0;n<e.length;n++)Ir(e[n],t,r);else if(Yf(e)||pn(e))e.forEach(n=>{Ir(n,t,r)});else if(th(e)){for(const n in e)Ir(e[n],t,r);for(const n of Object.getOwnPropertySymbols(e))Object.prototype.propertyIsEnumerable.call(e,n)&&Ir(e[n],t,r)}return e}/**
* @vue/runtime-core v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function di(e,t,r,n){try{return n?e(...n):e()}catch(s){cs(s,t,r)}}function er(e,t,r,n){if(Ce(e)){const s=di(e,t,r,n);return s&&Jf(s)&&s.catch(i=>{cs(i,t,r)}),s}if(Ie(e)){const s=[];for(let i=0;i<e.length;i++)s.push(er(e[i],t,r,n));return s}}function cs(e,t,r,n=!0){const s=t?t.vnode:null,{errorHandler:i,throwUnhandledErrorInProduction:a}=t&&t.appContext.config||je;if(t){let o=t.parent;const u=t.proxy,l=`https://vuejs.org/error-reference/#runtime-${r}`;for(;o;){const c=o.ec;if(c){for(let p=0;p<c.length;p++)if(c[p](e,u,l)===!1)return}o=o.parent}if(i){Rr(),di(i,null,10,[e,u,l]),Mr();return}}hw(e,r,s,n,a)}function hw(e,t,r,n=!0,s=!1){if(s)throw e;console.error(e)}const _t=[];let Qt=-1;const fn=[];let kr=null,on=0;const kh=Promise.resolve();let Gi=null;function Th(e){const t=Gi||kh;return e?t.then(this?e.bind(this):e):t}function mw(e){let t=Qt+1,r=_t.length;for(;t<r;){const n=t+r>>>1,s=_t[n],i=ni(s);i<e||i===e&&s.flags&2?t=n+1:r=n}return t}function Uo(e){if(!(e.flags&1)){const t=ni(e),r=_t[_t.length-1];!r||!(e.flags&2)&&t>=ni(r)?_t.push(e):_t.splice(mw(t),0,e),e.flags|=1,Eh()}}function Eh(){Gi||(Gi=kh.then(Ch))}function gw(e){Ie(e)?fn.push(...e):kr&&e.id===-1?kr.splice(on+1,0,e):e.flags&1||(fn.push(e),e.flags|=1),Eh()}function zl(e,t,r=Qt+1){for(;r<_t.length;r++){const n=_t[r];if(n&&n.flags&2){if(e&&n.id!==e.uid)continue;_t.splice(r,1),r--,n.flags&4&&(n.flags&=-2),n(),n.flags&4||(n.flags&=-2)}}}function Ih(e){if(fn.length){const t=[...new Set(fn)].sort((r,n)=>ni(r)-ni(n));if(fn.length=0,kr){kr.push(...t);return}for(kr=t,on=0;on<kr.length;on++){const r=kr[on];r.flags&4&&(r.flags&=-2),r.flags&8||r(),r.flags&=-2}kr=null,on=0}}const ni=e=>e.id==null?e.flags&2?-1:1/0:e.id;function Ch(e){try{for(Qt=0;Qt<_t.length;Qt++){const t=_t[Qt];t&&!(t.flags&8)&&(t.flags&4&&(t.flags&=-2),di(t,t.i,t.i?15:14),t.flags&4||(t.flags&=-2))}}finally{for(;Qt<_t.length;Qt++){const t=_t[Qt];t&&(t.flags&=-2)}Qt=-1,_t.length=0,Ih(),Gi=null,(_t.length||fn.length)&&Ch()}}let Yt=null,zh=null;function ji(e){const t=Yt;return Yt=e,zh=e&&e.type.__scopeId||null,t}function _w(e,t=Yt,r){if(!t||e._n)return e;const n=(...s)=>{n._d&&Ul(-1);const i=ji(t);let a;try{a=e(...s)}finally{ji(i),n._d&&Ul(1)}return a};return n._n=!0,n._c=!0,n._d=!0,n}function Nr(e,t,r,n){const s=e.dirs,i=t&&t.dirs;for(let a=0;a<s.length;a++){const o=s[a];i&&(o.oldValue=i[a].value);let u=o.dir[n];u&&(Rr(),er(u,r,8,[e.el,o,e,t]),Mr())}}const bw=Symbol("_vte"),yw=e=>e.__isTeleport;function Wo(e,t){e.shapeFlag&6&&e.component?(e.transition=t,Wo(e.component.subTree,t)):e.shapeFlag&128?(e.ssContent.transition=t.clone(e.ssContent),e.ssFallback.transition=t.clone(e.ssFallback)):e.transition=t}/*! #__NO_SIDE_EFFECTS__ */function Oh(e,t){return Ce(e)?ct({name:e.name},t,{setup:e}):e}function Ah(e){e.ids=[e.ids[0]+e.ids[2]+++"-",0,0]}function Ki(e,t,r,n,s=!1){if(Ie(e)){e.forEach((_,b)=>Ki(_,t&&(Ie(t)?t[b]:t),r,n,s));return}if(Kn(n)&&!s){n.shapeFlag&512&&n.type.__asyncResolved&&n.component.subTree.component&&Ki(e,t,r,n.component.subTree);return}const i=n.shapeFlag&4?Fo(n.component):n.el,a=s?null:i,{i:o,r:u}=e,l=t&&t.r,c=o.refs===je?o.refs={}:o.refs,p=o.setupState,h=We(p),m=p===je?()=>!1:_=>Le(h,_);if(l!=null&&l!==u&&(nt(l)?(c[l]=null,m(l)&&(p[l]=null)):dt(l)&&(l.value=null)),Ce(u))di(u,o,12,[a,c]);else{const _=nt(u),b=dt(u);if(_||b){const x=()=>{if(e.f){const w=_?m(u)?p[u]:c[u]:u.value;s?Ie(w)&&Eo(w,i):Ie(w)?w.includes(i)||w.push(i):_?(c[u]=[i],m(u)&&(p[u]=c[u])):(u.value=[i],e.k&&(c[e.k]=u.value))}else _?(c[u]=a,m(u)&&(p[u]=a)):b&&(u.value=a,e.k&&(c[e.k]=a))};a?(x.id=-1,xt(x,r)):x()}}}ls().requestIdleCallback;ls().cancelIdleCallback;const Kn=e=>!!e.type.__asyncLoader,Rh=e=>e.type.__isKeepAlive;function ww(e,t){Mh(e,"a",t)}function vw(e,t){Mh(e,"da",t)}function Mh(e,t,r=bt){const n=e.__wdc||(e.__wdc=()=>{let s=r;for(;s;){if(s.isDeactivated)return;s=s.parent}return e()});if(ps(t,n,r),r){let s=r.parent;for(;s&&s.parent;)Rh(s.parent.vnode)&&$w(n,t,r,s),s=s.parent}}function $w(e,t,r,n){const s=ps(t,e,n,!0);Nh(()=>{Eo(n[t],s)},r)}function ps(e,t,r=bt,n=!1){if(r){const s=r[e]||(r[e]=[]),i=t.__weh||(t.__weh=(...a)=>{Rr();const o=ci(r),u=er(t,r,e,a);return o(),Mr(),u});return n?s.unshift(i):s.push(i),i}}const hr=e=>(t,r=bt)=>{(!si||e==="sp")&&ps(e,(...n)=>t(...n),r)},xw=hr("bm"),Bh=hr("m"),Sw=hr("bu"),kw=hr("u"),Tw=hr("bum"),Nh=hr("um"),Ew=hr("sp"),Iw=hr("rtg"),Cw=hr("rtc");function zw(e,t=bt){ps("ec",e,t)}const Ow=Symbol.for("v-ndc"),Ja=e=>e?sm(e)?Fo(e):Ja(e.parent):null,Qn=ct(Object.create(null),{$:e=>e,$el:e=>e.vnode.el,$data:e=>e.data,$props:e=>e.props,$attrs:e=>e.attrs,$slots:e=>e.slots,$refs:e=>e.refs,$parent:e=>Ja(e.parent),$root:e=>Ja(e.root),$host:e=>e.ce,$emit:e=>e.emit,$options:e=>Dh(e),$forceUpdate:e=>e.f||(e.f=()=>{Uo(e.update)}),$nextTick:e=>e.n||(e.n=Th.bind(e.proxy)),$watch:e=>Yw.bind(e)}),Us=(e,t)=>e!==je&&!e.__isScriptSetup&&Le(e,t),Aw={get({_:e},t){if(t==="__v_skip")return!0;const{ctx:r,setupState:n,data:s,props:i,accessCache:a,type:o,appContext:u}=e;let l;if(t[0]!=="$"){const m=a[t];if(m!==void 0)switch(m){case 1:return n[t];case 2:return s[t];case 4:return r[t];case 3:return i[t]}else{if(Us(n,t))return a[t]=1,n[t];if(s!==je&&Le(s,t))return a[t]=2,s[t];if((l=e.propsOptions[0])&&Le(l,t))return a[t]=3,i[t];if(r!==je&&Le(r,t))return a[t]=4,r[t];eo&&(a[t]=0)}}const c=Qn[t];let p,h;if(c)return t==="$attrs"&&lt(e.attrs,"get",""),c(e);if((p=o.__cssModules)&&(p=p[t]))return p;if(r!==je&&Le(r,t))return a[t]=4,r[t];if(h=u.config.globalProperties,Le(h,t))return h[t]},set({_:e},t,r){const{data:n,setupState:s,ctx:i}=e;return Us(s,t)?(s[t]=r,!0):n!==je&&Le(n,t)?(n[t]=r,!0):Le(e.props,t)||t[0]==="$"&&t.slice(1)in e?!1:(i[t]=r,!0)},has({_:{data:e,setupState:t,accessCache:r,ctx:n,appContext:s,propsOptions:i}},a){let o;return!!r[a]||e!==je&&Le(e,a)||Us(t,a)||(o=i[0])&&Le(o,a)||Le(n,a)||Le(Qn,a)||Le(s.config.globalProperties,a)},defineProperty(e,t,r){return r.get!=null?e._.accessCache[t]=0:Le(r,"value")&&this.set(e,t,r.value,null),Reflect.defineProperty(e,t,r)}};function Ol(e){return Ie(e)?e.reduce((t,r)=>(t[r]=null,t),{}):e}let eo=!0;function Rw(e){const t=Dh(e),r=e.proxy,n=e.ctx;eo=!1,t.beforeCreate&&Al(t.beforeCreate,e,"bc");const{data:s,computed:i,methods:a,watch:o,provide:u,inject:l,created:c,beforeMount:p,mounted:h,beforeUpdate:m,updated:_,activated:b,deactivated:x,beforeDestroy:w,beforeUnmount:y,destroyed:k,unmounted:S,render:I,renderTracked:z,renderTriggered:O,errorCaptured:R,serverPrefetch:B,expose:G,inheritAttrs:le,components:ie,directives:ae,filters:ke}=t;if(l&&Mw(l,n,null),a)for(const se in a){const Q=a[se];Ce(Q)&&(n[se]=Q.bind(r))}if(s){const se=s.call(r,r);Qe(se)&&(e.data=ds(se))}if(eo=!0,i)for(const se in i){const Q=i[se],ce=Ce(Q)?Q.bind(r,r):Ce(Q.get)?Q.get.bind(r,r):Jt,Me=!Ce(Q)&&Ce(Q.set)?Q.set.bind(r):Jt,P=Dt({get:ce,set:Me});Object.defineProperty(n,se,{enumerable:!0,configurable:!0,get:()=>P.value,set:V=>P.value=V})}if(o)for(const se in o)Ph(o[se],n,r,se);if(u){const se=Ce(u)?u.call(r):u;Reflect.ownKeys(se).forEach(Q=>{Ui(Q,se[Q])})}c&&Al(c,e,"c");function X(se,Q){Ie(Q)?Q.forEach(ce=>se(ce.bind(r))):Q&&se(Q.bind(r))}if(X(xw,p),X(Bh,h),X(Sw,m),X(kw,_),X(ww,b),X(vw,x),X(zw,R),X(Cw,z),X(Iw,O),X(Tw,y),X(Nh,S),X(Ew,B),Ie(G))if(G.length){const se=e.exposed||(e.exposed={});G.forEach(Q=>{Object.defineProperty(se,Q,{get:()=>r[Q],set:ce=>r[Q]=ce})})}else e.exposed||(e.exposed={});I&&e.render===Jt&&(e.render=I),le!=null&&(e.inheritAttrs=le),ie&&(e.components=ie),ae&&(e.directives=ae),B&&Ah(e)}function Mw(e,t,r=Jt){Ie(e)&&(e=to(e));for(const n in e){const s=e[n];let i;Qe(s)?"default"in s?i=fr(s.from||n,s.default,!0):i=fr(s.from||n):i=fr(s),dt(i)?Object.defineProperty(t,n,{enumerable:!0,configurable:!0,get:()=>i.value,set:a=>i.value=a}):t[n]=i}}function Al(e,t,r){er(Ie(e)?e.map(n=>n.bind(t.proxy)):e.bind(t.proxy),t,r)}function Ph(e,t,r,n){let s=n.includes(".")?Yh(r,n):()=>r[n];if(nt(e)){const i=t[e];Ce(i)&&Wi(s,i)}else if(Ce(e))Wi(s,e.bind(r));else if(Qe(e))if(Ie(e))e.forEach(i=>Ph(i,t,r,n));else{const i=Ce(e.handler)?e.handler.bind(r):t[e.handler];Ce(i)&&Wi(s,i,e)}}function Dh(e){const t=e.type,{mixins:r,extends:n}=t,{mixins:s,optionsCache:i,config:{optionMergeStrategies:a}}=e.appContext,o=i.get(t);let u;return o?u=o:!s.length&&!r&&!n?u=t:(u={},s.length&&s.forEach(l=>Qi(u,l,a,!0)),Qi(u,t,a)),Qe(t)&&i.set(t,u),u}function Qi(e,t,r,n=!1){const{mixins:s,extends:i}=t;i&&Qi(e,i,r,!0),s&&s.forEach(a=>Qi(e,a,r,!0));for(const a in t)if(!(n&&a==="expose")){const o=Bw[a]||r&&r[a];e[a]=o?o(e[a],t[a]):t[a]}return e}const Bw={data:Rl,props:Ml,emits:Ml,methods:Un,computed:Un,beforeCreate:ht,created:ht,beforeMount:ht,mounted:ht,beforeUpdate:ht,updated:ht,beforeDestroy:ht,beforeUnmount:ht,destroyed:ht,unmounted:ht,activated:ht,deactivated:ht,errorCaptured:ht,serverPrefetch:ht,components:Un,directives:Un,watch:Pw,provide:Rl,inject:Nw};function Rl(e,t){return t?e?function(){return ct(Ce(e)?e.call(this,this):e,Ce(t)?t.call(this,this):t)}:t:e}function Nw(e,t){return Un(to(e),to(t))}function to(e){if(Ie(e)){const t={};for(let r=0;r<e.length;r++)t[e[r]]=e[r];return t}return e}function ht(e,t){return e?[...new Set([].concat(e,t))]:t}function Un(e,t){return e?ct(Object.create(null),e,t):t}function Ml(e,t){return e?Ie(e)&&Ie(t)?[...new Set([...e,...t])]:ct(Object.create(null),Ol(e),Ol(t??{})):t}function Pw(e,t){if(!e)return t;if(!t)return e;const r=ct(Object.create(null),e);for(const n in t)r[n]=ht(e[n],t[n]);return r}function Uh(){return{app:null,config:{isNativeTag:I0,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let Dw=0;function Uw(e,t){return function(n,s=null){Ce(n)||(n=ct({},n)),s!=null&&!Qe(s)&&(s=null);const i=Uh(),a=new WeakSet,o=[];let u=!1;const l=i.app={_uid:Dw++,_component:n,_props:s,_container:null,_context:i,_instance:null,version:bv,get config(){return i.config},set config(c){},use(c,...p){return a.has(c)||(c&&Ce(c.install)?(a.add(c),c.install(l,...p)):Ce(c)&&(a.add(c),c(l,...p))),l},mixin(c){return i.mixins.includes(c)||i.mixins.push(c),l},component(c,p){return p?(i.components[c]=p,l):i.components[c]},directive(c,p){return p?(i.directives[c]=p,l):i.directives[c]},mount(c,p,h){if(!u){const m=l._ceVNode||Et(n,s);return m.appContext=i,h===!0?h="svg":h===!1&&(h=void 0),e(m,c,h),u=!0,l._container=c,c.__vue_app__=l,Fo(m.component)}},onUnmount(c){o.push(c)},unmount(){u&&(er(o,l._instance,16),e(null,l._container),delete l._container.__vue_app__)},provide(c,p){return i.provides[c]=p,l},runWithContext(c){const p=hn;hn=l;try{return c()}finally{hn=p}}};return l}}let hn=null;function Ui(e,t){if(bt){let r=bt.provides;const n=bt.parent&&bt.parent.provides;n===r&&(r=bt.provides=Object.create(n)),r[e]=t}}function fr(e,t,r=!1){const n=bt||Yt;if(n||hn){const s=hn?hn._context.provides:n?n.parent==null?n.vnode.appContext&&n.vnode.appContext.provides:n.parent.provides:void 0;if(s&&e in s)return s[e];if(arguments.length>1)return r&&Ce(t)?t.call(n&&n.proxy):t}}const Wh={},Lh=()=>Object.create(Wh),qh=e=>Object.getPrototypeOf(e)===Wh;function Ww(e,t,r,n=!1){const s={},i=Lh();e.propsDefaults=Object.create(null),Fh(e,t,s,i);for(const a in e.propsOptions[0])a in s||(s[a]=void 0);r?e.props=n?s:vh(s):e.type.props?e.props=s:e.props=i,e.attrs=i}function Lw(e,t,r,n){const{props:s,attrs:i,vnode:{patchFlag:a}}=e,o=We(s),[u]=e.propsOptions;let l=!1;if((n||a>0)&&!(a&16)){if(a&8){const c=e.vnode.dynamicProps;for(let p=0;p<c.length;p++){let h=c[p];if(fs(e.emitsOptions,h))continue;const m=t[h];if(u)if(Le(i,h))m!==i[h]&&(i[h]=m,l=!0);else{const _=zr(h);s[_]=ro(u,o,_,m,e,!1)}else m!==i[h]&&(i[h]=m,l=!0)}}}else{Fh(e,t,s,i)&&(l=!0);let c;for(const p in o)(!t||!Le(t,p)&&((c=Jr(p))===p||!Le(t,c)))&&(u?r&&(r[p]!==void 0||r[c]!==void 0)&&(s[p]=ro(u,o,p,void 0,e,!0)):delete s[p]);if(i!==o)for(const p in i)(!t||!Le(t,p))&&(delete i[p],l=!0)}l&&cr(e.attrs,"set","")}function Fh(e,t,r,n){const[s,i]=e.propsOptions;let a=!1,o;if(t)for(let u in t){if(Vn(u))continue;const l=t[u];let c;s&&Le(s,c=zr(u))?!i||!i.includes(c)?r[c]=l:(o||(o={}))[c]=l:fs(e.emitsOptions,u)||(!(u in n)||l!==n[u])&&(n[u]=l,a=!0)}if(i){const u=We(r),l=o||je;for(let c=0;c<i.length;c++){const p=i[c];r[p]=ro(s,u,p,l[p],e,!Le(l,p))}}return a}function ro(e,t,r,n,s,i){const a=e[r];if(a!=null){const o=Le(a,"default");if(o&&n===void 0){const u=a.default;if(a.type!==Function&&!a.skipFactory&&Ce(u)){const{propsDefaults:l}=s;if(r in l)n=l[r];else{const c=ci(s);n=l[r]=u.call(null,t),c()}}else n=u;s.ce&&s.ce._setProp(r,n)}a[0]&&(i&&!o?n=!1:a[1]&&(n===""||n===Jr(r))&&(n=!0))}return n}const qw=new WeakMap;function Vh(e,t,r=!1){const n=r?qw:t.propsCache,s=n.get(e);if(s)return s;const i=e.props,a={},o=[];let u=!1;if(!Ce(e)){const c=p=>{u=!0;const[h,m]=Vh(p,t,!0);ct(a,h),m&&o.push(...m)};!r&&t.mixins.length&&t.mixins.forEach(c),e.extends&&c(e.extends),e.mixins&&e.mixins.forEach(c)}if(!i&&!u)return Qe(e)&&n.set(e,cn),cn;if(Ie(i))for(let c=0;c<i.length;c++){const p=zr(i[c]);Bl(p)&&(a[p]=je)}else if(i)for(const c in i){const p=zr(c);if(Bl(p)){const h=i[c],m=a[p]=Ie(h)||Ce(h)?{type:h}:ct({},h),_=m.type;let b=!1,x=!0;if(Ie(_))for(let w=0;w<_.length;++w){const y=_[w],k=Ce(y)&&y.name;if(k==="Boolean"){b=!0;break}else k==="String"&&(x=!1)}else b=Ce(_)&&_.name==="Boolean";m[0]=b,m[1]=x,(b||Le(m,"default"))&&o.push(p)}}const l=[a,o];return Qe(e)&&n.set(e,l),l}function Bl(e){return e[0]!=="$"&&!Vn(e)}const Hh=e=>e[0]==="_"||e==="$stable",Lo=e=>Ie(e)?e.map(Zt):[Zt(e)],Fw=(e,t,r)=>{if(t._n)return t;const n=_w((...s)=>Lo(t(...s)),r);return n._c=!1,n},Gh=(e,t,r)=>{const n=e._ctx;for(const s in e){if(Hh(s))continue;const i=e[s];if(Ce(i))t[s]=Fw(s,i,n);else if(i!=null){const a=Lo(i);t[s]=()=>a}}},jh=(e,t)=>{const r=Lo(t);e.slots.default=()=>r},Kh=(e,t,r)=>{for(const n in t)(r||n!=="_")&&(e[n]=t[n])},Vw=(e,t,r)=>{const n=e.slots=Lh();if(e.vnode.shapeFlag&32){const s=t._;s?(Kh(n,t,r),r&&nh(n,"_",s,!0)):Gh(t,n)}else t&&jh(e,t)},Hw=(e,t,r)=>{const{vnode:n,slots:s}=e;let i=!0,a=je;if(n.shapeFlag&32){const o=t._;o?r&&o===1?i=!1:Kh(s,t,r):(i=!t.$stable,Gh(t,s)),a=t}else t&&(jh(e,t),a={default:1});if(i)for(const o in s)!Hh(o)&&a[o]==null&&delete s[o]},xt=sv;function Gw(e){return jw(e)}function jw(e,t){const r=ls();r.__VUE__=!0;const{insert:n,remove:s,patchProp:i,createElement:a,createText:o,createComment:u,setText:l,setElementText:c,parentNode:p,nextSibling:h,setScopeId:m=Jt,insertStaticContent:_}=e,b=(T,E,A,L=null,q=null,F=null,te=void 0,re=null,ee=!!E.dynamicChildren)=>{if(T===E)return;T&&!Tn(T,E)&&(L=N(T),V(T,q,F,!0),T=null),E.patchFlag===-2&&(ee=!1,E.dynamicChildren=null);const{type:Z,ref:$e,shapeFlag:ue}=E;switch(Z){case hs:x(T,E,A,L);break;case Qr:w(T,E,A,L);break;case Ls:T==null&&y(E,A,L,te);break;case dr:ie(T,E,A,L,q,F,te,re,ee);break;default:ue&1?I(T,E,A,L,q,F,te,re,ee):ue&6?ae(T,E,A,L,q,F,te,re,ee):(ue&64||ue&128)&&Z.process(T,E,A,L,q,F,te,re,ee,de)}$e!=null&&q&&Ki($e,T&&T.ref,F,E||T,!E)},x=(T,E,A,L)=>{if(T==null)n(E.el=o(E.children),A,L);else{const q=E.el=T.el;E.children!==T.children&&l(q,E.children)}},w=(T,E,A,L)=>{T==null?n(E.el=u(E.children||""),A,L):E.el=T.el},y=(T,E,A,L)=>{[T.el,T.anchor]=_(T.children,E,A,L,T.el,T.anchor)},k=({el:T,anchor:E},A,L)=>{let q;for(;T&&T!==E;)q=h(T),n(T,A,L),T=q;n(E,A,L)},S=({el:T,anchor:E})=>{let A;for(;T&&T!==E;)A=h(T),s(T),T=A;s(E)},I=(T,E,A,L,q,F,te,re,ee)=>{E.type==="svg"?te="svg":E.type==="math"&&(te="mathml"),T==null?z(E,A,L,q,F,te,re,ee):B(T,E,q,F,te,re,ee)},z=(T,E,A,L,q,F,te,re)=>{let ee,Z;const{props:$e,shapeFlag:ue,transition:ye,dirs:xe}=T;if(ee=T.el=a(T.type,F,$e&&$e.is,$e),ue&8?c(ee,T.children):ue&16&&R(T.children,ee,null,L,q,Ws(T,F),te,re),xe&&Nr(T,null,L,"created"),O(ee,T,T.scopeId,te,L),$e){for(const Re in $e)Re!=="value"&&!Vn(Re)&&i(ee,Re,null,$e[Re],F,L);"value"in $e&&i(ee,"value",null,$e.value,F),(Z=$e.onVnodeBeforeMount)&&jt(Z,L,T)}xe&&Nr(T,null,L,"beforeMount");const Oe=Kw(q,ye);Oe&&ye.beforeEnter(ee),n(ee,E,A),((Z=$e&&$e.onVnodeMounted)||Oe||xe)&&xt(()=>{Z&&jt(Z,L,T),Oe&&ye.enter(ee),xe&&Nr(T,null,L,"mounted")},q)},O=(T,E,A,L,q)=>{if(A&&m(T,A),L)for(let F=0;F<L.length;F++)m(T,L[F]);if(q){let F=q.subTree;if(E===F||em(F.type)&&(F.ssContent===E||F.ssFallback===E)){const te=q.vnode;O(T,te,te.scopeId,te.slotScopeIds,q.parent)}}},R=(T,E,A,L,q,F,te,re,ee=0)=>{for(let Z=ee;Z<T.length;Z++){const $e=T[Z]=re?Tr(T[Z]):Zt(T[Z]);b(null,$e,E,A,L,q,F,te,re)}},B=(T,E,A,L,q,F,te)=>{const re=E.el=T.el;let{patchFlag:ee,dynamicChildren:Z,dirs:$e}=E;ee|=T.patchFlag&16;const ue=T.props||je,ye=E.props||je;let xe;if(A&&Pr(A,!1),(xe=ye.onVnodeBeforeUpdate)&&jt(xe,A,E,T),$e&&Nr(E,T,A,"beforeUpdate"),A&&Pr(A,!0),(ue.innerHTML&&ye.innerHTML==null||ue.textContent&&ye.textContent==null)&&c(re,""),Z?G(T.dynamicChildren,Z,re,A,L,Ws(E,q),F):te||Q(T,E,re,null,A,L,Ws(E,q),F,!1),ee>0){if(ee&16)le(re,ue,ye,A,q);else if(ee&2&&ue.class!==ye.class&&i(re,"class",null,ye.class,q),ee&4&&i(re,"style",ue.style,ye.style,q),ee&8){const Oe=E.dynamicProps;for(let Re=0;Re<Oe.length;Re++){const we=Oe[Re],st=ue[we],at=ye[we];(at!==st||we==="value")&&i(re,we,st,at,q,A)}}ee&1&&T.children!==E.children&&c(re,E.children)}else!te&&Z==null&&le(re,ue,ye,A,q);((xe=ye.onVnodeUpdated)||$e)&&xt(()=>{xe&&jt(xe,A,E,T),$e&&Nr(E,T,A,"updated")},L)},G=(T,E,A,L,q,F,te)=>{for(let re=0;re<E.length;re++){const ee=T[re],Z=E[re],$e=ee.el&&(ee.type===dr||!Tn(ee,Z)||ee.shapeFlag&70)?p(ee.el):A;b(ee,Z,$e,null,L,q,F,te,!0)}},le=(T,E,A,L,q)=>{if(E!==A){if(E!==je)for(const F in E)!Vn(F)&&!(F in A)&&i(T,F,E[F],null,q,L);for(const F in A){if(Vn(F))continue;const te=A[F],re=E[F];te!==re&&F!=="value"&&i(T,F,re,te,q,L)}"value"in A&&i(T,"value",E.value,A.value,q)}},ie=(T,E,A,L,q,F,te,re,ee)=>{const Z=E.el=T?T.el:o(""),$e=E.anchor=T?T.anchor:o("");let{patchFlag:ue,dynamicChildren:ye,slotScopeIds:xe}=E;xe&&(re=re?re.concat(xe):xe),T==null?(n(Z,A,L),n($e,A,L),R(E.children||[],A,$e,q,F,te,re,ee)):ue>0&&ue&64&&ye&&T.dynamicChildren?(G(T.dynamicChildren,ye,A,q,F,te,re),(E.key!=null||q&&E===q.subTree)&&Qh(T,E,!0)):Q(T,E,A,$e,q,F,te,re,ee)},ae=(T,E,A,L,q,F,te,re,ee)=>{E.slotScopeIds=re,T==null?E.shapeFlag&512?q.ctx.activate(E,A,L,te,ee):ke(E,A,L,q,F,te,ee):be(T,E,ee)},ke=(T,E,A,L,q,F,te)=>{const re=T.component=pv(T,L,q);if(Rh(T)&&(re.ctx.renderer=de),fv(re,!1,te),re.asyncDep){if(q&&q.registerDep(re,X,te),!T.el){const ee=re.subTree=Et(Qr);w(null,ee,E,A)}}else X(re,T,E,A,q,F,te)},be=(T,E,A)=>{const L=E.component=T.component;if(nv(T,E,A))if(L.asyncDep&&!L.asyncResolved){se(L,E,A);return}else L.next=E,L.update();else E.el=T.el,L.vnode=E},X=(T,E,A,L,q,F,te)=>{const re=()=>{if(T.isMounted){let{next:ue,bu:ye,u:xe,parent:Oe,vnode:Re}=T;{const tt=Zh(T);if(tt){ue&&(ue.el=Re.el,se(T,ue,te)),tt.asyncDep.then(()=>{T.isUnmounted||re()});return}}let we=ue,st;Pr(T,!1),ue?(ue.el=Re.el,se(T,ue,te)):ue=Re,ye&&Ms(ye),(st=ue.props&&ue.props.onVnodeBeforeUpdate)&&jt(st,Oe,ue,Re),Pr(T,!0);const at=Pl(T),yt=T.subTree;T.subTree=at,b(yt,at,p(yt.el),N(yt),T,q,F),ue.el=at.el,we===null&&iv(T,at.el),xe&&xt(xe,q),(st=ue.props&&ue.props.onVnodeUpdated)&&xt(()=>jt(st,Oe,ue,Re),q)}else{let ue;const{el:ye,props:xe}=E,{bm:Oe,m:Re,parent:we,root:st,type:at}=T,yt=Kn(E);Pr(T,!1),Oe&&Ms(Oe),!yt&&(ue=xe&&xe.onVnodeBeforeMount)&&jt(ue,we,E),Pr(T,!0);{st.ce&&st.ce._injectChildStyle(at);const tt=T.subTree=Pl(T);b(null,tt,A,L,T,q,F),E.el=tt.el}if(Re&&xt(Re,q),!yt&&(ue=xe&&xe.onVnodeMounted)){const tt=E;xt(()=>jt(ue,we,tt),q)}(E.shapeFlag&256||we&&Kn(we.vnode)&&we.vnode.shapeFlag&256)&&T.a&&xt(T.a,q),T.isMounted=!0,E=A=L=null}};T.scope.on();const ee=T.effect=new oh(re);T.scope.off();const Z=T.update=ee.run.bind(ee),$e=T.job=ee.runIfDirty.bind(ee);$e.i=T,$e.id=T.uid,ee.scheduler=()=>Uo($e),Pr(T,!0),Z()},se=(T,E,A)=>{E.component=T;const L=T.vnode.props;T.vnode=E,T.next=null,Lw(T,E.props,L,A),Hw(T,E.children,A),Rr(),zl(T),Mr()},Q=(T,E,A,L,q,F,te,re,ee=!1)=>{const Z=T&&T.children,$e=T?T.shapeFlag:0,ue=E.children,{patchFlag:ye,shapeFlag:xe}=E;if(ye>0){if(ye&128){Me(Z,ue,A,L,q,F,te,re,ee);return}else if(ye&256){ce(Z,ue,A,L,q,F,te,re,ee);return}}xe&8?($e&16&&W(Z,q,F),ue!==Z&&c(A,ue)):$e&16?xe&16?Me(Z,ue,A,L,q,F,te,re,ee):W(Z,q,F,!0):($e&8&&c(A,""),xe&16&&R(ue,A,L,q,F,te,re,ee))},ce=(T,E,A,L,q,F,te,re,ee)=>{T=T||cn,E=E||cn;const Z=T.length,$e=E.length,ue=Math.min(Z,$e);let ye;for(ye=0;ye<ue;ye++){const xe=E[ye]=ee?Tr(E[ye]):Zt(E[ye]);b(T[ye],xe,A,null,q,F,te,re,ee)}Z>$e?W(T,q,F,!0,!1,ue):R(E,A,L,q,F,te,re,ee,ue)},Me=(T,E,A,L,q,F,te,re,ee)=>{let Z=0;const $e=E.length;let ue=T.length-1,ye=$e-1;for(;Z<=ue&&Z<=ye;){const xe=T[Z],Oe=E[Z]=ee?Tr(E[Z]):Zt(E[Z]);if(Tn(xe,Oe))b(xe,Oe,A,null,q,F,te,re,ee);else break;Z++}for(;Z<=ue&&Z<=ye;){const xe=T[ue],Oe=E[ye]=ee?Tr(E[ye]):Zt(E[ye]);if(Tn(xe,Oe))b(xe,Oe,A,null,q,F,te,re,ee);else break;ue--,ye--}if(Z>ue){if(Z<=ye){const xe=ye+1,Oe=xe<$e?E[xe].el:L;for(;Z<=ye;)b(null,E[Z]=ee?Tr(E[Z]):Zt(E[Z]),A,Oe,q,F,te,re,ee),Z++}}else if(Z>ye)for(;Z<=ue;)V(T[Z],q,F,!0),Z++;else{const xe=Z,Oe=Z,Re=new Map;for(Z=Oe;Z<=ye;Z++){const Ye=E[Z]=ee?Tr(E[Z]):Zt(E[Z]);Ye.key!=null&&Re.set(Ye.key,Z)}let we,st=0;const at=ye-Oe+1;let yt=!1,tt=0;const Ot=new Array(at);for(Z=0;Z<at;Z++)Ot[Z]=0;for(Z=xe;Z<=ue;Z++){const Ye=T[Z];if(st>=at){V(Ye,q,F,!0);continue}let vt;if(Ye.key!=null)vt=Re.get(Ye.key);else for(we=Oe;we<=ye;we++)if(Ot[we-Oe]===0&&Tn(Ye,E[we])){vt=we;break}vt===void 0?V(Ye,q,F,!0):(Ot[vt-Oe]=Z+1,vt>=tt?tt=vt:yt=!0,b(Ye,E[vt],A,null,q,F,te,re,ee),st++)}const vn=yt?Qw(Ot):cn;for(we=vn.length-1,Z=at-1;Z>=0;Z--){const Ye=Oe+Z,vt=E[Ye],$n=Ye+1<$e?E[Ye+1].el:L;Ot[Z]===0?b(null,vt,A,$n,q,F,te,re,ee):yt&&(we<0||Z!==vn[we]?P(vt,A,$n,2):we--)}}},P=(T,E,A,L,q=null)=>{const{el:F,type:te,transition:re,children:ee,shapeFlag:Z}=T;if(Z&6){P(T.component.subTree,E,A,L);return}if(Z&128){T.suspense.move(E,A,L);return}if(Z&64){te.move(T,E,A,de);return}if(te===dr){n(F,E,A);for(let ue=0;ue<ee.length;ue++)P(ee[ue],E,A,L);n(T.anchor,E,A);return}if(te===Ls){k(T,E,A);return}if(L!==2&&Z&1&&re)if(L===0)re.beforeEnter(F),n(F,E,A),xt(()=>re.enter(F),q);else{const{leave:ue,delayLeave:ye,afterLeave:xe}=re,Oe=()=>n(F,E,A),Re=()=>{ue(F,()=>{Oe(),xe&&xe()})};ye?ye(F,Oe,Re):Re()}else n(F,E,A)},V=(T,E,A,L=!1,q=!1)=>{const{type:F,props:te,ref:re,children:ee,dynamicChildren:Z,shapeFlag:$e,patchFlag:ue,dirs:ye,cacheIndex:xe}=T;if(ue===-2&&(q=!1),re!=null&&Ki(re,null,A,T,!0),xe!=null&&(E.renderCache[xe]=void 0),$e&256){E.ctx.deactivate(T);return}const Oe=$e&1&&ye,Re=!Kn(T);let we;if(Re&&(we=te&&te.onVnodeBeforeUnmount)&&jt(we,E,T),$e&6)Xe(T.component,A,L);else{if($e&128){T.suspense.unmount(A,L);return}Oe&&Nr(T,null,E,"beforeUnmount"),$e&64?T.type.remove(T,E,A,de,L):Z&&!Z.hasOnce&&(F!==dr||ue>0&&ue&64)?W(Z,E,A,!1,!0):(F===dr&&ue&384||!q&&$e&16)&&W(ee,E,A),L&&J(T)}(Re&&(we=te&&te.onVnodeUnmounted)||Oe)&&xt(()=>{we&&jt(we,E,T),Oe&&Nr(T,null,E,"unmounted")},A)},J=T=>{const{type:E,el:A,anchor:L,transition:q}=T;if(E===dr){_e(A,L);return}if(E===Ls){S(T);return}const F=()=>{s(A),q&&!q.persisted&&q.afterLeave&&q.afterLeave()};if(T.shapeFlag&1&&q&&!q.persisted){const{leave:te,delayLeave:re}=q,ee=()=>te(A,F);re?re(T.el,F,ee):ee()}else F()},_e=(T,E)=>{let A;for(;T!==E;)A=h(T),s(T),T=A;s(E)},Xe=(T,E,A)=>{const{bum:L,scope:q,job:F,subTree:te,um:re,m:ee,a:Z}=T;Nl(ee),Nl(Z),L&&Ms(L),q.stop(),F&&(F.flags|=8,V(te,T,E,A)),re&&xt(re,E),xt(()=>{T.isUnmounted=!0},E),E&&E.pendingBranch&&!E.isUnmounted&&T.asyncDep&&!T.asyncResolved&&T.suspenseId===E.pendingId&&(E.deps--,E.deps===0&&E.resolve())},W=(T,E,A,L=!1,q=!1,F=0)=>{for(let te=F;te<T.length;te++)V(T[te],E,A,L,q)},N=T=>{if(T.shapeFlag&6)return N(T.component.subTree);if(T.shapeFlag&128)return T.suspense.next();const E=h(T.anchor||T.el),A=E&&E[bw];return A?h(A):E};let oe=!1;const Y=(T,E,A)=>{T==null?E._vnode&&V(E._vnode,null,null,!0):b(E._vnode||null,T,E,null,null,null,A),E._vnode=T,oe||(oe=!0,zl(),Ih(),oe=!1)},de={p:b,um:V,m:P,r:J,mt:ke,mc:R,pc:Q,pbc:G,n:N,o:e};return{render:Y,hydrate:void 0,createApp:Uw(Y)}}function Ws({type:e,props:t},r){return r==="svg"&&e==="foreignObject"||r==="mathml"&&e==="annotation-xml"&&t&&t.encoding&&t.encoding.includes("html")?void 0:r}function Pr({effect:e,job:t},r){r?(e.flags|=32,t.flags|=4):(e.flags&=-33,t.flags&=-5)}function Kw(e,t){return(!e||e&&!e.pendingBranch)&&t&&!t.persisted}function Qh(e,t,r=!1){const n=e.children,s=t.children;if(Ie(n)&&Ie(s))for(let i=0;i<n.length;i++){const a=n[i];let o=s[i];o.shapeFlag&1&&!o.dynamicChildren&&((o.patchFlag<=0||o.patchFlag===32)&&(o=s[i]=Tr(s[i]),o.el=a.el),!r&&o.patchFlag!==-2&&Qh(a,o)),o.type===hs&&(o.el=a.el)}}function Qw(e){const t=e.slice(),r=[0];let n,s,i,a,o;const u=e.length;for(n=0;n<u;n++){const l=e[n];if(l!==0){if(s=r[r.length-1],e[s]<l){t[n]=s,r.push(n);continue}for(i=0,a=r.length-1;i<a;)o=i+a>>1,e[r[o]]<l?i=o+1:a=o;l<e[r[i]]&&(i>0&&(t[n]=r[i-1]),r[i]=n)}}for(i=r.length,a=r[i-1];i-- >0;)r[i]=a,a=t[a];return r}function Zh(e){const t=e.subTree.component;if(t)return t.asyncDep&&!t.asyncResolved?t:Zh(t)}function Nl(e){if(e)for(let t=0;t<e.length;t++)e[t].flags|=8}const Zw=Symbol.for("v-scx"),Xw=()=>fr(Zw);function Wi(e,t,r){return Xh(e,t,r)}function Xh(e,t,r=je){const{immediate:n,deep:s,flush:i,once:a}=r,o=ct({},r),u=t&&n||!t&&i!=="post";let l;if(si){if(i==="sync"){const m=Xw();l=m.__watcherHandles||(m.__watcherHandles=[])}else if(!u){const m=()=>{};return m.stop=Jt,m.resume=Jt,m.pause=Jt,m}}const c=bt;o.call=(m,_,b)=>er(m,c,_,b);let p=!1;i==="post"?o.scheduler=m=>{xt(m,c&&c.suspense)}:i!=="sync"&&(p=!0,o.scheduler=(m,_)=>{_?m():Uo(m)}),o.augmentJob=m=>{t&&(m.flags|=4),p&&(m.flags|=2,c&&(m.id=c.uid,m.i=c))};const h=fw(e,t,o);return si&&(l?l.push(h):u&&h()),h}function Yw(e,t,r){const n=this.proxy,s=nt(e)?e.includes(".")?Yh(n,e):()=>n[e]:e.bind(n,n);let i;Ce(t)?i=t:(i=t.handler,r=t);const a=ci(this),o=Xh(s,i.bind(n),r);return a(),o}function Yh(e,t){const r=t.split(".");return()=>{let n=e;for(let s=0;s<r.length&&n;s++)n=n[r[s]];return n}}const Jw=(e,t)=>t==="modelValue"||t==="model-value"?e.modelModifiers:e[`${t}Modifiers`]||e[`${zr(t)}Modifiers`]||e[`${Jr(t)}Modifiers`];function ev(e,t,...r){if(e.isUnmounted)return;const n=e.vnode.props||je;let s=r;const i=t.startsWith("update:"),a=i&&Jw(n,t.slice(7));a&&(a.trim&&(s=r.map(c=>nt(c)?c.trim():c)),a.number&&(s=r.map(R0)));let o,u=n[o=Rs(t)]||n[o=Rs(zr(t))];!u&&i&&(u=n[o=Rs(Jr(t))]),u&&er(u,e,6,s);const l=n[o+"Once"];if(l){if(!e.emitted)e.emitted={};else if(e.emitted[o])return;e.emitted[o]=!0,er(l,e,6,s)}}function Jh(e,t,r=!1){const n=t.emitsCache,s=n.get(e);if(s!==void 0)return s;const i=e.emits;let a={},o=!1;if(!Ce(e)){const u=l=>{const c=Jh(l,t,!0);c&&(o=!0,ct(a,c))};!r&&t.mixins.length&&t.mixins.forEach(u),e.extends&&u(e.extends),e.mixins&&e.mixins.forEach(u)}return!i&&!o?(Qe(e)&&n.set(e,null),null):(Ie(i)?i.forEach(u=>a[u]=null):ct(a,i),Qe(e)&&n.set(e,a),a)}function fs(e,t){return!e||!as(t)?!1:(t=t.slice(2).replace(/Once$/,""),Le(e,t[0].toLowerCase()+t.slice(1))||Le(e,Jr(t))||Le(e,t))}function Pl(e){const{type:t,vnode:r,proxy:n,withProxy:s,propsOptions:[i],slots:a,attrs:o,emit:u,render:l,renderCache:c,props:p,data:h,setupState:m,ctx:_,inheritAttrs:b}=e,x=ji(e);let w,y;try{if(r.shapeFlag&4){const S=s||n,I=S;w=Zt(l.call(I,S,c,p,m,h,_)),y=o}else{const S=t;w=Zt(S.length>1?S(p,{attrs:o,slots:a,emit:u}):S(p,null)),y=t.props?o:tv(o)}}catch(S){Zn.length=0,cs(S,e,1),w=Et(Qr)}let k=w;if(y&&b!==!1){const S=Object.keys(y),{shapeFlag:I}=k;S.length&&I&7&&(i&&S.some(To)&&(y=rv(y,i)),k=mn(k,y,!1,!0))}return r.dirs&&(k=mn(k,null,!1,!0),k.dirs=k.dirs?k.dirs.concat(r.dirs):r.dirs),r.transition&&Wo(k,r.transition),w=k,ji(x),w}const tv=e=>{let t;for(const r in e)(r==="class"||r==="style"||as(r))&&((t||(t={}))[r]=e[r]);return t},rv=(e,t)=>{const r={};for(const n in e)(!To(n)||!(n.slice(9)in t))&&(r[n]=e[n]);return r};function nv(e,t,r){const{props:n,children:s,component:i}=e,{props:a,children:o,patchFlag:u}=t,l=i.emitsOptions;if(t.dirs||t.transition)return!0;if(r&&u>=0){if(u&1024)return!0;if(u&16)return n?Dl(n,a,l):!!a;if(u&8){const c=t.dynamicProps;for(let p=0;p<c.length;p++){const h=c[p];if(a[h]!==n[h]&&!fs(l,h))return!0}}}else return(s||o)&&(!o||!o.$stable)?!0:n===a?!1:n?a?Dl(n,a,l):!0:!!a;return!1}function Dl(e,t,r){const n=Object.keys(t);if(n.length!==Object.keys(e).length)return!0;for(let s=0;s<n.length;s++){const i=n[s];if(t[i]!==e[i]&&!fs(r,i))return!0}return!1}function iv({vnode:e,parent:t},r){for(;t;){const n=t.subTree;if(n.suspense&&n.suspense.activeBranch===e&&(n.el=e.el),n===e)(e=t.vnode).el=r,t=t.parent;else break}}const em=e=>e.__isSuspense;function sv(e,t){t&&t.pendingBranch?Ie(e)?t.effects.push(...e):t.effects.push(e):gw(e)}const dr=Symbol.for("v-fgt"),hs=Symbol.for("v-txt"),Qr=Symbol.for("v-cmt"),Ls=Symbol.for("v-stc"),Zn=[];let Tt=null;function Xn(e=!1){Zn.push(Tt=e?null:[])}function av(){Zn.pop(),Tt=Zn[Zn.length-1]||null}let ii=1;function Ul(e,t=!1){ii+=e,e<0&&Tt&&t&&(Tt.hasOnce=!0)}function tm(e){return e.dynamicChildren=ii>0?Tt||cn:null,av(),ii>0&&Tt&&Tt.push(e),e}function qs(e,t,r,n,s,i){return tm(ur(e,t,r,n,s,i,!0))}function rm(e,t,r,n,s){return tm(Et(e,t,r,n,s,!0))}function Zi(e){return e?e.__v_isVNode===!0:!1}function Tn(e,t){return e.type===t.type&&e.key===t.key}const nm=({key:e})=>e??null,Li=({ref:e,ref_key:t,ref_for:r})=>(typeof e=="number"&&(e=""+e),e!=null?nt(e)||dt(e)||Ce(e)?{i:Yt,r:e,k:t,f:!!r}:e:null);function ur(e,t=null,r=null,n=0,s=null,i=e===dr?0:1,a=!1,o=!1){const u={__v_isVNode:!0,__v_skip:!0,type:e,props:t,key:t&&nm(t),ref:t&&Li(t),scopeId:zh,slotScopeIds:null,children:r,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:i,patchFlag:n,dynamicProps:s,dynamicChildren:null,appContext:null,ctx:Yt};return o?(qo(u,r),i&128&&e.normalize(u)):r&&(u.shapeFlag|=nt(r)?8:16),ii>0&&!a&&Tt&&(u.patchFlag>0||i&6)&&u.patchFlag!==32&&Tt.push(u),u}const Et=ov;function ov(e,t=null,r=null,n=0,s=null,i=!1){if((!e||e===Ow)&&(e=Qr),Zi(e)){const o=mn(e,t,!0);return r&&qo(o,r),ii>0&&!i&&Tt&&(o.shapeFlag&6?Tt[Tt.indexOf(e)]=o:Tt.push(o)),o.patchFlag=-2,o}if(_v(e)&&(e=e.__vccOpts),t){t=uv(t);let{class:o,style:u}=t;o&&!nt(o)&&(t.class=zo(o)),Qe(u)&&(Do(u)&&!Ie(u)&&(u=ct({},u)),t.style=Co(u))}const a=nt(e)?1:em(e)?128:yw(e)?64:Qe(e)?4:Ce(e)?2:0;return ur(e,t,r,n,s,a,i,!0)}function uv(e){return e?Do(e)||qh(e)?ct({},e):e:null}function mn(e,t,r=!1,n=!1){const{props:s,ref:i,patchFlag:a,children:o,transition:u}=e,l=t?lv(s||{},t):s,c={__v_isVNode:!0,__v_skip:!0,type:e.type,props:l,key:l&&nm(l),ref:t&&t.ref?r&&i?Ie(i)?i.concat(Li(t)):[i,Li(t)]:Li(t):i,scopeId:e.scopeId,slotScopeIds:e.slotScopeIds,children:o,target:e.target,targetStart:e.targetStart,targetAnchor:e.targetAnchor,staticCount:e.staticCount,shapeFlag:e.shapeFlag,patchFlag:t&&e.type!==dr?a===-1?16:a|16:a,dynamicProps:e.dynamicProps,dynamicChildren:e.dynamicChildren,appContext:e.appContext,dirs:e.dirs,transition:u,component:e.component,suspense:e.suspense,ssContent:e.ssContent&&mn(e.ssContent),ssFallback:e.ssFallback&&mn(e.ssFallback),el:e.el,anchor:e.anchor,ctx:e.ctx,ce:e.ce};return u&&n&&Wo(c,u.clone(c)),c}function im(e=" ",t=0){return Et(hs,null,e,t)}function Wl(e="",t=!1){return t?(Xn(),rm(Qr,null,e)):Et(Qr,null,e)}function Zt(e){return e==null||typeof e=="boolean"?Et(Qr):Ie(e)?Et(dr,null,e.slice()):Zi(e)?Tr(e):Et(hs,null,String(e))}function Tr(e){return e.el===null&&e.patchFlag!==-1||e.memo?e:mn(e)}function qo(e,t){let r=0;const{shapeFlag:n}=e;if(t==null)t=null;else if(Ie(t))r=16;else if(typeof t=="object")if(n&65){const s=t.default;s&&(s._c&&(s._d=!1),qo(e,s()),s._c&&(s._d=!0));return}else{r=32;const s=t._;!s&&!qh(t)?t._ctx=Yt:s===3&&Yt&&(Yt.slots._===1?t._=1:(t._=2,e.patchFlag|=1024))}else Ce(t)?(t={default:t,_ctx:Yt},r=32):(t=String(t),n&64?(r=16,t=[im(t)]):r=8);e.children=t,e.shapeFlag|=r}function lv(...e){const t={};for(let r=0;r<e.length;r++){const n=e[r];for(const s in n)if(s==="class")t.class!==n.class&&(t.class=zo([t.class,n.class]));else if(s==="style")t.style=Co([t.style,n.style]);else if(as(s)){const i=t[s],a=n[s];a&&i!==a&&!(Ie(i)&&i.includes(a))&&(t[s]=i?[].concat(i,a):a)}else s!==""&&(t[s]=n[s])}return t}function jt(e,t,r,n=null){er(e,t,7,[r,n])}const dv=Uh();let cv=0;function pv(e,t,r){const n=e.type,s=(t?t.appContext:e.appContext)||dv,i={uid:cv++,vnode:e,type:n,parent:t,appContext:s,root:null,next:null,subTree:null,effect:null,update:null,job:null,scope:new W0(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:t?t.provides:Object.create(s.provides),ids:t?t.ids:["",0,0],accessCache:null,renderCache:[],components:null,directives:null,propsOptions:Vh(n,s),emitsOptions:Jh(n,s),emit:null,emitted:null,propsDefaults:je,inheritAttrs:n.inheritAttrs,ctx:je,data:je,props:je,attrs:je,slots:je,refs:je,setupState:je,setupContext:null,suspense:r,suspenseId:r?r.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return i.ctx={_:i},i.root=t?t.root:i,i.emit=ev.bind(null,i),e.ce&&e.ce(i),i}let bt=null,Xi,no;{const e=ls(),t=(r,n)=>{let s;return(s=e[r])||(s=e[r]=[]),s.push(n),i=>{s.length>1?s.forEach(a=>a(i)):s[0](i)}};Xi=t("__VUE_INSTANCE_SETTERS__",r=>bt=r),no=t("__VUE_SSR_SETTERS__",r=>si=r)}const ci=e=>{const t=bt;return Xi(e),e.scope.on(),()=>{e.scope.off(),Xi(t)}},Ll=()=>{bt&&bt.scope.off(),Xi(null)};function sm(e){return e.vnode.shapeFlag&4}let si=!1;function fv(e,t=!1,r=!1){t&&no(t);const{props:n,children:s}=e.vnode,i=sm(e);Ww(e,n,i,t),Vw(e,s,r);const a=i?hv(e,t):void 0;return t&&no(!1),a}function hv(e,t){const r=e.type;e.accessCache=Object.create(null),e.proxy=new Proxy(e.ctx,Aw);const{setup:n}=r;if(n){Rr();const s=e.setupContext=n.length>1?gv(e):null,i=ci(e),a=di(n,e,0,[e.props,s]),o=Jf(a);if(Mr(),i(),(o||e.sp)&&!Kn(e)&&Ah(e),o){if(a.then(Ll,Ll),t)return a.then(u=>{ql(e,u)}).catch(u=>{cs(u,e,0)});e.asyncDep=a}else ql(e,a)}else am(e)}function ql(e,t,r){Ce(t)?e.type.__ssrInlineRender?e.ssrRender=t:e.render=t:Qe(t)&&(e.setupState=Sh(t)),am(e)}function am(e,t,r){const n=e.type;e.render||(e.render=n.render||Jt);{const s=ci(e);Rr();try{Rw(e)}finally{Mr(),s()}}}const mv={get(e,t){return lt(e,"get",""),e[t]}};function gv(e){const t=r=>{e.exposed=r||{}};return{attrs:new Proxy(e.attrs,mv),slots:e.slots,emit:e.emit,expose:t}}function Fo(e){return e.exposed?e.exposeProxy||(e.exposeProxy=new Proxy(Sh(aw(e.exposed)),{get(t,r){if(r in t)return t[r];if(r in Qn)return Qn[r](e)},has(t,r){return r in t||r in Qn}})):e.proxy}function _v(e){return Ce(e)&&"__vccOpts"in e}const Dt=(e,t)=>cw(e,t,si);function om(e,t,r){const n=arguments.length;return n===2?Qe(t)&&!Ie(t)?Zi(t)?Et(e,null,[t]):Et(e,t):Et(e,null,t):(n>3?r=Array.prototype.slice.call(arguments,2):n===3&&Zi(r)&&(r=[r]),Et(e,t,r))}const bv="3.5.13";/**
* @vue/runtime-dom v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let io;const Fl=typeof window<"u"&&window.trustedTypes;if(Fl)try{io=Fl.createPolicy("vue",{createHTML:e=>e})}catch{}const um=io?e=>io.createHTML(e):e=>e,yv="http://www.w3.org/2000/svg",wv="http://www.w3.org/1998/Math/MathML",lr=typeof document<"u"?document:null,Vl=lr&&lr.createElement("template"),vv={insert:(e,t,r)=>{t.insertBefore(e,r||null)},remove:e=>{const t=e.parentNode;t&&t.removeChild(e)},createElement:(e,t,r,n)=>{const s=t==="svg"?lr.createElementNS(yv,e):t==="mathml"?lr.createElementNS(wv,e):r?lr.createElement(e,{is:r}):lr.createElement(e);return e==="select"&&n&&n.multiple!=null&&s.setAttribute("multiple",n.multiple),s},createText:e=>lr.createTextNode(e),createComment:e=>lr.createComment(e),setText:(e,t)=>{e.nodeValue=t},setElementText:(e,t)=>{e.textContent=t},parentNode:e=>e.parentNode,nextSibling:e=>e.nextSibling,querySelector:e=>lr.querySelector(e),setScopeId(e,t){e.setAttribute(t,"")},insertStaticContent(e,t,r,n,s,i){const a=r?r.previousSibling:t.lastChild;if(s&&(s===i||s.nextSibling))for(;t.insertBefore(s.cloneNode(!0),r),!(s===i||!(s=s.nextSibling)););else{Vl.innerHTML=um(n==="svg"?`<svg>${e}</svg>`:n==="mathml"?`<math>${e}</math>`:e);const o=Vl.content;if(n==="svg"||n==="mathml"){const u=o.firstChild;for(;u.firstChild;)o.appendChild(u.firstChild);o.removeChild(u)}t.insertBefore(o,r)}return[a?a.nextSibling:t.firstChild,r?r.previousSibling:t.lastChild]}},$v=Symbol("_vtc");function xv(e,t,r){const n=e[$v];n&&(t=(t?[t,...n]:[...n]).join(" ")),t==null?e.removeAttribute("class"):r?e.setAttribute("class",t):e.className=t}const Hl=Symbol("_vod"),Sv=Symbol("_vsh"),kv=Symbol(""),Tv=/(^|;)\s*display\s*:/;function Ev(e,t,r){const n=e.style,s=nt(r);let i=!1;if(r&&!s){if(t)if(nt(t))for(const a of t.split(";")){const o=a.slice(0,a.indexOf(":")).trim();r[o]==null&&qi(n,o,"")}else for(const a in t)r[a]==null&&qi(n,a,"");for(const a in r)a==="display"&&(i=!0),qi(n,a,r[a])}else if(s){if(t!==r){const a=n[kv];a&&(r+=";"+a),n.cssText=r,i=Tv.test(r)}}else t&&e.removeAttribute("style");Hl in e&&(e[Hl]=i?n.display:"",e[Sv]&&(n.display="none"))}const Gl=/\s*!important$/;function qi(e,t,r){if(Ie(r))r.forEach(n=>qi(e,t,n));else if(r==null&&(r=""),t.startsWith("--"))e.setProperty(t,r);else{const n=Iv(e,t);Gl.test(r)?e.setProperty(Jr(n),r.replace(Gl,""),"important"):e[n]=r}}const jl=["Webkit","Moz","ms"],Fs={};function Iv(e,t){const r=Fs[t];if(r)return r;let n=zr(t);if(n!=="filter"&&n in e)return Fs[t]=n;n=rh(n);for(let s=0;s<jl.length;s++){const i=jl[s]+n;if(i in e)return Fs[t]=i}return t}const Kl="http://www.w3.org/1999/xlink";function Ql(e,t,r,n,s,i=U0(t)){n&&t.startsWith("xlink:")?r==null?e.removeAttributeNS(Kl,t.slice(6,t.length)):e.setAttributeNS(Kl,t,r):r==null||i&&!ih(r)?e.removeAttribute(t):e.setAttribute(t,i?"":Ar(r)?String(r):r)}function Zl(e,t,r,n,s){if(t==="innerHTML"||t==="textContent"){r!=null&&(e[t]=t==="innerHTML"?um(r):r);return}const i=e.tagName;if(t==="value"&&i!=="PROGRESS"&&!i.includes("-")){const o=i==="OPTION"?e.getAttribute("value")||"":e.value,u=r==null?e.type==="checkbox"?"on":"":String(r);(o!==u||!("_value"in e))&&(e.value=u),r==null&&e.removeAttribute(t),e._value=r;return}let a=!1;if(r===""||r==null){const o=typeof e[t];o==="boolean"?r=ih(r):r==null&&o==="string"?(r="",a=!0):o==="number"&&(r=0,a=!0)}try{e[t]=r}catch{}a&&e.removeAttribute(s||t)}function Cv(e,t,r,n){e.addEventListener(t,r,n)}function zv(e,t,r,n){e.removeEventListener(t,r,n)}const Xl=Symbol("_vei");function Ov(e,t,r,n,s=null){const i=e[Xl]||(e[Xl]={}),a=i[t];if(n&&a)a.value=n;else{const[o,u]=Av(t);if(n){const l=i[t]=Bv(n,s);Cv(e,o,l,u)}else a&&(zv(e,o,a,u),i[t]=void 0)}}const Yl=/(?:Once|Passive|Capture)$/;function Av(e){let t;if(Yl.test(e)){t={};let n;for(;n=e.match(Yl);)e=e.slice(0,e.length-n[0].length),t[n[0].toLowerCase()]=!0}return[e[2]===":"?e.slice(3):Jr(e.slice(2)),t]}let Vs=0;const Rv=Promise.resolve(),Mv=()=>Vs||(Rv.then(()=>Vs=0),Vs=Date.now());function Bv(e,t){const r=n=>{if(!n._vts)n._vts=Date.now();else if(n._vts<=r.attached)return;er(Nv(n,r.value),t,5,[n])};return r.value=e,r.attached=Mv(),r}function Nv(e,t){if(Ie(t)){const r=e.stopImmediatePropagation;return e.stopImmediatePropagation=()=>{r.call(e),e._stopped=!0},t.map(n=>s=>!s._stopped&&n&&n(s))}else return t}const Jl=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&e.charCodeAt(2)>96&&e.charCodeAt(2)<123,Pv=(e,t,r,n,s,i)=>{const a=s==="svg";t==="class"?xv(e,n,a):t==="style"?Ev(e,r,n):as(t)?To(t)||Ov(e,t,r,n,i):(t[0]==="."?(t=t.slice(1),!0):t[0]==="^"?(t=t.slice(1),!1):Dv(e,t,n,a))?(Zl(e,t,n),!e.tagName.includes("-")&&(t==="value"||t==="checked"||t==="selected")&&Ql(e,t,n,a,i,t!=="value")):e._isVueCE&&(/[A-Z]/.test(t)||!nt(n))?Zl(e,zr(t),n,i,t):(t==="true-value"?e._trueValue=n:t==="false-value"&&(e._falseValue=n),Ql(e,t,n,a))};function Dv(e,t,r,n){if(n)return!!(t==="innerHTML"||t==="textContent"||t in e&&Jl(t)&&Ce(r));if(t==="spellcheck"||t==="draggable"||t==="translate"||t==="form"||t==="list"&&e.tagName==="INPUT"||t==="type"&&e.tagName==="TEXTAREA")return!1;if(t==="width"||t==="height"){const s=e.tagName;if(s==="IMG"||s==="VIDEO"||s==="CANVAS"||s==="SOURCE")return!1}return Jl(t)&&nt(r)?!1:t in e}const Uv=ct({patchProp:Pv},vv);let ed;function Wv(){return ed||(ed=Gw(Uv))}const Lv=(...e)=>{const t=Wv().createApp(...e),{mount:r}=t;return t.mount=n=>{const s=Fv(n);if(!s)return;const i=t._component;!Ce(i)&&!i.render&&!i.template&&(i.template=s.innerHTML),s.nodeType===1&&(s.textContent="");const a=r(s,!1,qv(s));return s instanceof Element&&(s.removeAttribute("v-cloak"),s.setAttribute("data-v-app","")),a},t};function qv(e){if(e instanceof SVGElement)return"svg";if(typeof MathMLElement=="function"&&e instanceof MathMLElement)return"mathml"}function Fv(e){return nt(e)?document.querySelector(e):e}/*!
  * vue-router v4.5.0
  * (c) 2024 Eduardo San Martin Morote
  * @license MIT
  */const un=typeof document<"u";function lm(e){return typeof e=="object"||"displayName"in e||"props"in e||"__vccOpts"in e}function Vv(e){return e.__esModule||e[Symbol.toStringTag]==="Module"||e.default&&lm(e.default)}const Ue=Object.assign;function Hs(e,t){const r={};for(const n in t){const s=t[n];r[n]=qt(s)?s.map(e):e(s)}return r}const Yn=()=>{},qt=Array.isArray,dm=/#/g,Hv=/&/g,Gv=/\//g,jv=/=/g,Kv=/\?/g,cm=/\+/g,Qv=/%5B/g,Zv=/%5D/g,pm=/%5E/g,Xv=/%60/g,fm=/%7B/g,Yv=/%7C/g,hm=/%7D/g,Jv=/%20/g;function Vo(e){return encodeURI(""+e).replace(Yv,"|").replace(Qv,"[").replace(Zv,"]")}function e$(e){return Vo(e).replace(fm,"{").replace(hm,"}").replace(pm,"^")}function so(e){return Vo(e).replace(cm,"%2B").replace(Jv,"+").replace(dm,"%23").replace(Hv,"%26").replace(Xv,"`").replace(fm,"{").replace(hm,"}").replace(pm,"^")}function t$(e){return so(e).replace(jv,"%3D")}function r$(e){return Vo(e).replace(dm,"%23").replace(Kv,"%3F")}function n$(e){return e==null?"":r$(e).replace(Gv,"%2F")}function ai(e){try{return decodeURIComponent(""+e)}catch{}return""+e}const i$=/\/$/,s$=e=>e.replace(i$,"");function Gs(e,t,r="/"){let n,s={},i="",a="";const o=t.indexOf("#");let u=t.indexOf("?");return o<u&&o>=0&&(u=-1),u>-1&&(n=t.slice(0,u),i=t.slice(u+1,o>-1?o:t.length),s=e(i)),o>-1&&(n=n||t.slice(0,o),a=t.slice(o,t.length)),n=l$(n??t,r),{fullPath:n+(i&&"?")+i+a,path:n,query:s,hash:ai(a)}}function a$(e,t){const r=t.query?e(t.query):"";return t.path+(r&&"?")+r+(t.hash||"")}function td(e,t){return!t||!e.toLowerCase().startsWith(t.toLowerCase())?e:e.slice(t.length)||"/"}function o$(e,t,r){const n=t.matched.length-1,s=r.matched.length-1;return n>-1&&n===s&&gn(t.matched[n],r.matched[s])&&mm(t.params,r.params)&&e(t.query)===e(r.query)&&t.hash===r.hash}function gn(e,t){return(e.aliasOf||e)===(t.aliasOf||t)}function mm(e,t){if(Object.keys(e).length!==Object.keys(t).length)return!1;for(const r in e)if(!u$(e[r],t[r]))return!1;return!0}function u$(e,t){return qt(e)?rd(e,t):qt(t)?rd(t,e):e===t}function rd(e,t){return qt(t)?e.length===t.length&&e.every((r,n)=>r===t[n]):e.length===1&&e[0]===t}function l$(e,t){if(e.startsWith("/"))return e;if(!e)return t;const r=t.split("/"),n=e.split("/"),s=n[n.length-1];(s===".."||s===".")&&n.push("");let i=r.length-1,a,o;for(a=0;a<n.length;a++)if(o=n[a],o!==".")if(o==="..")i>1&&i--;else break;return r.slice(0,i).join("/")+"/"+n.slice(a).join("/")}const yr={path:"/",name:void 0,params:{},query:{},hash:"",fullPath:"/",matched:[],meta:{},redirectedFrom:void 0};var oi;(function(e){e.pop="pop",e.push="push"})(oi||(oi={}));var Jn;(function(e){e.back="back",e.forward="forward",e.unknown=""})(Jn||(Jn={}));function d$(e){if(!e)if(un){const t=document.querySelector("base");e=t&&t.getAttribute("href")||"/",e=e.replace(/^\w+:\/\/[^\/]+/,"")}else e="/";return e[0]!=="/"&&e[0]!=="#"&&(e="/"+e),s$(e)}const c$=/^[^#]+#/;function p$(e,t){return e.replace(c$,"#")+t}function f$(e,t){const r=document.documentElement.getBoundingClientRect(),n=e.getBoundingClientRect();return{behavior:t.behavior,left:n.left-r.left-(t.left||0),top:n.top-r.top-(t.top||0)}}const ms=()=>({left:window.scrollX,top:window.scrollY});function h$(e){let t;if("el"in e){const r=e.el,n=typeof r=="string"&&r.startsWith("#"),s=typeof r=="string"?n?document.getElementById(r.slice(1)):document.querySelector(r):r;if(!s)return;t=f$(s,e)}else t=e;"scrollBehavior"in document.documentElement.style?window.scrollTo(t):window.scrollTo(t.left!=null?t.left:window.scrollX,t.top!=null?t.top:window.scrollY)}function nd(e,t){return(history.state?history.state.position-t:-1)+e}const ao=new Map;function m$(e,t){ao.set(e,t)}function g$(e){const t=ao.get(e);return ao.delete(e),t}let _$=()=>location.protocol+"//"+location.host;function gm(e,t){const{pathname:r,search:n,hash:s}=t,i=e.indexOf("#");if(i>-1){let o=s.includes(e.slice(i))?e.slice(i).length:1,u=s.slice(o);return u[0]!=="/"&&(u="/"+u),td(u,"")}return td(r,e)+n+s}function b$(e,t,r,n){let s=[],i=[],a=null;const o=({state:h})=>{const m=gm(e,location),_=r.value,b=t.value;let x=0;if(h){if(r.value=m,t.value=h,a&&a===_){a=null;return}x=b?h.position-b.position:0}else n(m);s.forEach(w=>{w(r.value,_,{delta:x,type:oi.pop,direction:x?x>0?Jn.forward:Jn.back:Jn.unknown})})};function u(){a=r.value}function l(h){s.push(h);const m=()=>{const _=s.indexOf(h);_>-1&&s.splice(_,1)};return i.push(m),m}function c(){const{history:h}=window;h.state&&h.replaceState(Ue({},h.state,{scroll:ms()}),"")}function p(){for(const h of i)h();i=[],window.removeEventListener("popstate",o),window.removeEventListener("beforeunload",c)}return window.addEventListener("popstate",o),window.addEventListener("beforeunload",c,{passive:!0}),{pauseListeners:u,listen:l,destroy:p}}function id(e,t,r,n=!1,s=!1){return{back:e,current:t,forward:r,replaced:n,position:window.history.length,scroll:s?ms():null}}function y$(e){const{history:t,location:r}=window,n={value:gm(e,r)},s={value:t.state};s.value||i(n.value,{back:null,current:n.value,forward:null,position:t.length-1,replaced:!0,scroll:null},!0);function i(u,l,c){const p=e.indexOf("#"),h=p>-1?(r.host&&document.querySelector("base")?e:e.slice(p))+u:_$()+e+u;try{t[c?"replaceState":"pushState"](l,"",h),s.value=l}catch(m){console.error(m),r[c?"replace":"assign"](h)}}function a(u,l){const c=Ue({},t.state,id(s.value.back,u,s.value.forward,!0),l,{position:s.value.position});i(u,c,!0),n.value=u}function o(u,l){const c=Ue({},s.value,t.state,{forward:u,scroll:ms()});i(c.current,c,!0);const p=Ue({},id(n.value,u,null),{position:c.position+1},l);i(u,p,!1),n.value=u}return{location:n,state:s,push:o,replace:a}}function w$(e){e=d$(e);const t=y$(e),r=b$(e,t.state,t.location,t.replace);function n(i,a=!0){a||r.pauseListeners(),history.go(i)}const s=Ue({location:"",base:e,go:n,createHref:p$.bind(null,e)},t,r);return Object.defineProperty(s,"location",{enumerable:!0,get:()=>t.location.value}),Object.defineProperty(s,"state",{enumerable:!0,get:()=>t.state.value}),s}function v$(e){return typeof e=="string"||e&&typeof e=="object"}function _m(e){return typeof e=="string"||typeof e=="symbol"}const bm=Symbol("");var sd;(function(e){e[e.aborted=4]="aborted",e[e.cancelled=8]="cancelled",e[e.duplicated=16]="duplicated"})(sd||(sd={}));function _n(e,t){return Ue(new Error,{type:e,[bm]:!0},t)}function sr(e,t){return e instanceof Error&&bm in e&&(t==null||!!(e.type&t))}const ad="[^/]+?",$$={sensitive:!1,strict:!1,start:!0,end:!0},x$=/[.+*?^${}()[\]/\\]/g;function S$(e,t){const r=Ue({},$$,t),n=[];let s=r.start?"^":"";const i=[];for(const l of e){const c=l.length?[]:[90];r.strict&&!l.length&&(s+="/");for(let p=0;p<l.length;p++){const h=l[p];let m=40+(r.sensitive?.25:0);if(h.type===0)p||(s+="/"),s+=h.value.replace(x$,"\\$&"),m+=40;else if(h.type===1){const{value:_,repeatable:b,optional:x,regexp:w}=h;i.push({name:_,repeatable:b,optional:x});const y=w||ad;if(y!==ad){m+=10;try{new RegExp(`(${y})`)}catch(S){throw new Error(`Invalid custom RegExp for param "${_}" (${y}): `+S.message)}}let k=b?`((?:${y})(?:/(?:${y}))*)`:`(${y})`;p||(k=x&&l.length<2?`(?:/${k})`:"/"+k),x&&(k+="?"),s+=k,m+=20,x&&(m+=-8),b&&(m+=-20),y===".*"&&(m+=-50)}c.push(m)}n.push(c)}if(r.strict&&r.end){const l=n.length-1;n[l][n[l].length-1]+=.7000000000000001}r.strict||(s+="/?"),r.end?s+="$":r.strict&&!s.endsWith("/")&&(s+="(?:/|$)");const a=new RegExp(s,r.sensitive?"":"i");function o(l){const c=l.match(a),p={};if(!c)return null;for(let h=1;h<c.length;h++){const m=c[h]||"",_=i[h-1];p[_.name]=m&&_.repeatable?m.split("/"):m}return p}function u(l){let c="",p=!1;for(const h of e){(!p||!c.endsWith("/"))&&(c+="/"),p=!1;for(const m of h)if(m.type===0)c+=m.value;else if(m.type===1){const{value:_,repeatable:b,optional:x}=m,w=_ in l?l[_]:"";if(qt(w)&&!b)throw new Error(`Provided param "${_}" is an array but it is not repeatable (* or + modifiers)`);const y=qt(w)?w.join("/"):w;if(!y)if(x)h.length<2&&(c.endsWith("/")?c=c.slice(0,-1):p=!0);else throw new Error(`Missing required param "${_}"`);c+=y}}return c||"/"}return{re:a,score:n,keys:i,parse:o,stringify:u}}function k$(e,t){let r=0;for(;r<e.length&&r<t.length;){const n=t[r]-e[r];if(n)return n;r++}return e.length<t.length?e.length===1&&e[0]===80?-1:1:e.length>t.length?t.length===1&&t[0]===80?1:-1:0}function ym(e,t){let r=0;const n=e.score,s=t.score;for(;r<n.length&&r<s.length;){const i=k$(n[r],s[r]);if(i)return i;r++}if(Math.abs(s.length-n.length)===1){if(od(n))return 1;if(od(s))return-1}return s.length-n.length}function od(e){const t=e[e.length-1];return e.length>0&&t[t.length-1]<0}const T$={type:0,value:""},E$=/[a-zA-Z0-9_]/;function I$(e){if(!e)return[[]];if(e==="/")return[[T$]];if(!e.startsWith("/"))throw new Error(`Invalid path "${e}"`);function t(m){throw new Error(`ERR (${r})/"${l}": ${m}`)}let r=0,n=r;const s=[];let i;function a(){i&&s.push(i),i=[]}let o=0,u,l="",c="";function p(){l&&(r===0?i.push({type:0,value:l}):r===1||r===2||r===3?(i.length>1&&(u==="*"||u==="+")&&t(`A repeatable param (${l}) must be alone in its segment. eg: '/:ids+.`),i.push({type:1,value:l,regexp:c,repeatable:u==="*"||u==="+",optional:u==="*"||u==="?"})):t("Invalid state to consume buffer"),l="")}function h(){l+=u}for(;o<e.length;){if(u=e[o++],u==="\\"&&r!==2){n=r,r=4;continue}switch(r){case 0:u==="/"?(l&&p(),a()):u===":"?(p(),r=1):h();break;case 4:h(),r=n;break;case 1:u==="("?r=2:E$.test(u)?h():(p(),r=0,u!=="*"&&u!=="?"&&u!=="+"&&o--);break;case 2:u===")"?c[c.length-1]=="\\"?c=c.slice(0,-1)+u:r=3:c+=u;break;case 3:p(),r=0,u!=="*"&&u!=="?"&&u!=="+"&&o--,c="";break;default:t("Unknown state");break}}return r===2&&t(`Unfinished custom RegExp for param "${l}"`),p(),a(),s}function C$(e,t,r){const n=S$(I$(e.path),r),s=Ue(n,{record:e,parent:t,children:[],alias:[]});return t&&!s.record.aliasOf==!t.record.aliasOf&&t.children.push(s),s}function z$(e,t){const r=[],n=new Map;t=cd({strict:!1,end:!0,sensitive:!1},t);function s(p){return n.get(p)}function i(p,h,m){const _=!m,b=ld(p);b.aliasOf=m&&m.record;const x=cd(t,p),w=[b];if("alias"in p){const S=typeof p.alias=="string"?[p.alias]:p.alias;for(const I of S)w.push(ld(Ue({},b,{components:m?m.record.components:b.components,path:I,aliasOf:m?m.record:b})))}let y,k;for(const S of w){const{path:I}=S;if(h&&I[0]!=="/"){const z=h.record.path,O=z[z.length-1]==="/"?"":"/";S.path=h.record.path+(I&&O+I)}if(y=C$(S,h,x),m?m.alias.push(y):(k=k||y,k!==y&&k.alias.push(y),_&&p.name&&!dd(y)&&a(p.name)),wm(y)&&u(y),b.children){const z=b.children;for(let O=0;O<z.length;O++)i(z[O],y,m&&m.children[O])}m=m||y}return k?()=>{a(k)}:Yn}function a(p){if(_m(p)){const h=n.get(p);h&&(n.delete(p),r.splice(r.indexOf(h),1),h.children.forEach(a),h.alias.forEach(a))}else{const h=r.indexOf(p);h>-1&&(r.splice(h,1),p.record.name&&n.delete(p.record.name),p.children.forEach(a),p.alias.forEach(a))}}function o(){return r}function u(p){const h=R$(p,r);r.splice(h,0,p),p.record.name&&!dd(p)&&n.set(p.record.name,p)}function l(p,h){let m,_={},b,x;if("name"in p&&p.name){if(m=n.get(p.name),!m)throw _n(1,{location:p});x=m.record.name,_=Ue(ud(h.params,m.keys.filter(k=>!k.optional).concat(m.parent?m.parent.keys.filter(k=>k.optional):[]).map(k=>k.name)),p.params&&ud(p.params,m.keys.map(k=>k.name))),b=m.stringify(_)}else if(p.path!=null)b=p.path,m=r.find(k=>k.re.test(b)),m&&(_=m.parse(b),x=m.record.name);else{if(m=h.name?n.get(h.name):r.find(k=>k.re.test(h.path)),!m)throw _n(1,{location:p,currentLocation:h});x=m.record.name,_=Ue({},h.params,p.params),b=m.stringify(_)}const w=[];let y=m;for(;y;)w.unshift(y.record),y=y.parent;return{name:x,path:b,params:_,matched:w,meta:A$(w)}}e.forEach(p=>i(p));function c(){r.length=0,n.clear()}return{addRoute:i,resolve:l,removeRoute:a,clearRoutes:c,getRoutes:o,getRecordMatcher:s}}function ud(e,t){const r={};for(const n of t)n in e&&(r[n]=e[n]);return r}function ld(e){const t={path:e.path,redirect:e.redirect,name:e.name,meta:e.meta||{},aliasOf:e.aliasOf,beforeEnter:e.beforeEnter,props:O$(e),children:e.children||[],instances:{},leaveGuards:new Set,updateGuards:new Set,enterCallbacks:{},components:"components"in e?e.components||null:e.component&&{default:e.component}};return Object.defineProperty(t,"mods",{value:{}}),t}function O$(e){const t={},r=e.props||!1;if("component"in e)t.default=r;else for(const n in e.components)t[n]=typeof r=="object"?r[n]:r;return t}function dd(e){for(;e;){if(e.record.aliasOf)return!0;e=e.parent}return!1}function A$(e){return e.reduce((t,r)=>Ue(t,r.meta),{})}function cd(e,t){const r={};for(const n in e)r[n]=n in t?t[n]:e[n];return r}function R$(e,t){let r=0,n=t.length;for(;r!==n;){const i=r+n>>1;ym(e,t[i])<0?n=i:r=i+1}const s=M$(e);return s&&(n=t.lastIndexOf(s,n-1)),n}function M$(e){let t=e;for(;t=t.parent;)if(wm(t)&&ym(e,t)===0)return t}function wm({record:e}){return!!(e.name||e.components&&Object.keys(e.components).length||e.redirect)}function B$(e){const t={};if(e===""||e==="?")return t;const n=(e[0]==="?"?e.slice(1):e).split("&");for(let s=0;s<n.length;++s){const i=n[s].replace(cm," "),a=i.indexOf("="),o=ai(a<0?i:i.slice(0,a)),u=a<0?null:ai(i.slice(a+1));if(o in t){let l=t[o];qt(l)||(l=t[o]=[l]),l.push(u)}else t[o]=u}return t}function pd(e){let t="";for(let r in e){const n=e[r];if(r=t$(r),n==null){n!==void 0&&(t+=(t.length?"&":"")+r);continue}(qt(n)?n.map(i=>i&&so(i)):[n&&so(n)]).forEach(i=>{i!==void 0&&(t+=(t.length?"&":"")+r,i!=null&&(t+="="+i))})}return t}function N$(e){const t={};for(const r in e){const n=e[r];n!==void 0&&(t[r]=qt(n)?n.map(s=>s==null?null:""+s):n==null?n:""+n)}return t}const P$=Symbol(""),fd=Symbol(""),Ho=Symbol(""),vm=Symbol(""),oo=Symbol("");function En(){let e=[];function t(n){return e.push(n),()=>{const s=e.indexOf(n);s>-1&&e.splice(s,1)}}function r(){e=[]}return{add:t,list:()=>e.slice(),reset:r}}function Er(e,t,r,n,s,i=a=>a()){const a=n&&(n.enterCallbacks[s]=n.enterCallbacks[s]||[]);return()=>new Promise((o,u)=>{const l=h=>{h===!1?u(_n(4,{from:r,to:t})):h instanceof Error?u(h):v$(h)?u(_n(2,{from:t,to:h})):(a&&n.enterCallbacks[s]===a&&typeof h=="function"&&a.push(h),o())},c=i(()=>e.call(n&&n.instances[s],t,r,l));let p=Promise.resolve(c);e.length<3&&(p=p.then(l)),p.catch(h=>u(h))})}function js(e,t,r,n,s=i=>i()){const i=[];for(const a of e)for(const o in a.components){let u=a.components[o];if(!(t!=="beforeRouteEnter"&&!a.instances[o]))if(lm(u)){const c=(u.__vccOpts||u)[t];c&&i.push(Er(c,r,n,a,o,s))}else{let l=u();i.push(()=>l.then(c=>{if(!c)throw new Error(`Couldn't resolve component "${o}" at "${a.path}"`);const p=Vv(c)?c.default:c;a.mods[o]=c,a.components[o]=p;const m=(p.__vccOpts||p)[t];return m&&Er(m,r,n,a,o,s)()}))}}return i}function hd(e){const t=fr(Ho),r=fr(vm),n=Dt(()=>{const u=jr(e.to);return t.resolve(u)}),s=Dt(()=>{const{matched:u}=n.value,{length:l}=u,c=u[l-1],p=r.matched;if(!c||!p.length)return-1;const h=p.findIndex(gn.bind(null,c));if(h>-1)return h;const m=md(u[l-2]);return l>1&&md(c)===m&&p[p.length-1].path!==m?p.findIndex(gn.bind(null,u[l-2])):h}),i=Dt(()=>s.value>-1&&q$(r.params,n.value.params)),a=Dt(()=>s.value>-1&&s.value===r.matched.length-1&&mm(r.params,n.value.params));function o(u={}){if(L$(u)){const l=t[jr(e.replace)?"replace":"push"](jr(e.to)).catch(Yn);return e.viewTransition&&typeof document<"u"&&"startViewTransition"in document&&document.startViewTransition(()=>l),l}return Promise.resolve()}return{route:n,href:Dt(()=>n.value.href),isActive:i,isExactActive:a,navigate:o}}function D$(e){return e.length===1?e[0]:e}const U$=Oh({name:"RouterLink",compatConfig:{MODE:3},props:{to:{type:[String,Object],required:!0},replace:Boolean,activeClass:String,exactActiveClass:String,custom:Boolean,ariaCurrentValue:{type:String,default:"page"}},useLink:hd,setup(e,{slots:t}){const r=ds(hd(e)),{options:n}=fr(Ho),s=Dt(()=>({[gd(e.activeClass,n.linkActiveClass,"router-link-active")]:r.isActive,[gd(e.exactActiveClass,n.linkExactActiveClass,"router-link-exact-active")]:r.isExactActive}));return()=>{const i=t.default&&D$(t.default(r));return e.custom?i:om("a",{"aria-current":r.isExactActive?e.ariaCurrentValue:null,href:r.href,onClick:r.navigate,class:s.value},i)}}}),W$=U$;function L$(e){if(!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)&&!e.defaultPrevented&&!(e.button!==void 0&&e.button!==0)){if(e.currentTarget&&e.currentTarget.getAttribute){const t=e.currentTarget.getAttribute("target");if(/\b_blank\b/i.test(t))return}return e.preventDefault&&e.preventDefault(),!0}}function q$(e,t){for(const r in t){const n=t[r],s=e[r];if(typeof n=="string"){if(n!==s)return!1}else if(!qt(s)||s.length!==n.length||n.some((i,a)=>i!==s[a]))return!1}return!0}function md(e){return e?e.aliasOf?e.aliasOf.path:e.path:""}const gd=(e,t,r)=>e??t??r,F$=Oh({name:"RouterView",inheritAttrs:!1,props:{name:{type:String,default:"default"},route:Object},compatConfig:{MODE:3},setup(e,{attrs:t,slots:r}){const n=fr(oo),s=Dt(()=>e.route||n.value),i=fr(fd,0),a=Dt(()=>{let l=jr(i);const{matched:c}=s.value;let p;for(;(p=c[l])&&!p.components;)l++;return l}),o=Dt(()=>s.value.matched[a.value]);Ui(fd,Dt(()=>a.value+1)),Ui(P$,o),Ui(oo,s);const u=or();return Wi(()=>[u.value,o.value,e.name],([l,c,p],[h,m,_])=>{c&&(c.instances[p]=l,m&&m!==c&&l&&l===h&&(c.leaveGuards.size||(c.leaveGuards=m.leaveGuards),c.updateGuards.size||(c.updateGuards=m.updateGuards))),l&&c&&(!m||!gn(c,m)||!h)&&(c.enterCallbacks[p]||[]).forEach(b=>b(l))},{flush:"post"}),()=>{const l=s.value,c=e.name,p=o.value,h=p&&p.components[c];if(!h)return _d(r.default,{Component:h,route:l});const m=p.props[c],_=m?m===!0?l.params:typeof m=="function"?m(l):m:null,x=om(h,Ue({},_,t,{onVnodeUnmounted:w=>{w.component.isUnmounted&&(p.instances[c]=null)},ref:u}));return _d(r.default,{Component:x,route:l})||x}}});function _d(e,t){if(!e)return null;const r=e(t);return r.length===1?r[0]:r}const $m=F$;function V$(e){const t=z$(e.routes,e),r=e.parseQuery||B$,n=e.stringifyQuery||pd,s=e.history,i=En(),a=En(),o=En(),u=ow(yr);let l=yr;un&&e.scrollBehavior&&"scrollRestoration"in history&&(history.scrollRestoration="manual");const c=Hs.bind(null,N=>""+N),p=Hs.bind(null,n$),h=Hs.bind(null,ai);function m(N,oe){let Y,de;return _m(N)?(Y=t.getRecordMatcher(N),de=oe):de=N,t.addRoute(de,Y)}function _(N){const oe=t.getRecordMatcher(N);oe&&t.removeRoute(oe)}function b(){return t.getRoutes().map(N=>N.record)}function x(N){return!!t.getRecordMatcher(N)}function w(N,oe){if(oe=Ue({},oe||u.value),typeof N=="string"){const A=Gs(r,N,oe.path),L=t.resolve({path:A.path},oe),q=s.createHref(A.fullPath);return Ue(A,L,{params:h(L.params),hash:ai(A.hash),redirectedFrom:void 0,href:q})}let Y;if(N.path!=null)Y=Ue({},N,{path:Gs(r,N.path,oe.path).path});else{const A=Ue({},N.params);for(const L in A)A[L]==null&&delete A[L];Y=Ue({},N,{params:p(A)}),oe.params=p(oe.params)}const de=t.resolve(Y,oe),ze=N.hash||"";de.params=c(h(de.params));const T=a$(n,Ue({},N,{hash:e$(ze),path:de.path})),E=s.createHref(T);return Ue({fullPath:T,hash:ze,query:n===pd?N$(N.query):N.query||{}},de,{redirectedFrom:void 0,href:E})}function y(N){return typeof N=="string"?Gs(r,N,u.value.path):Ue({},N)}function k(N,oe){if(l!==N)return _n(8,{from:oe,to:N})}function S(N){return O(N)}function I(N){return S(Ue(y(N),{replace:!0}))}function z(N){const oe=N.matched[N.matched.length-1];if(oe&&oe.redirect){const{redirect:Y}=oe;let de=typeof Y=="function"?Y(N):Y;return typeof de=="string"&&(de=de.includes("?")||de.includes("#")?de=y(de):{path:de},de.params={}),Ue({query:N.query,hash:N.hash,params:de.path!=null?{}:N.params},de)}}function O(N,oe){const Y=l=w(N),de=u.value,ze=N.state,T=N.force,E=N.replace===!0,A=z(Y);if(A)return O(Ue(y(A),{state:typeof A=="object"?Ue({},ze,A.state):ze,force:T,replace:E}),oe||Y);const L=Y;L.redirectedFrom=oe;let q;return!T&&o$(n,de,Y)&&(q=_n(16,{to:L,from:de}),P(de,de,!0,!1)),(q?Promise.resolve(q):G(L,de)).catch(F=>sr(F)?sr(F,2)?F:Me(F):Q(F,L,de)).then(F=>{if(F){if(sr(F,2))return O(Ue({replace:E},y(F.to),{state:typeof F.to=="object"?Ue({},ze,F.to.state):ze,force:T}),oe||L)}else F=ie(L,de,!0,E,ze);return le(L,de,F),F})}function R(N,oe){const Y=k(N,oe);return Y?Promise.reject(Y):Promise.resolve()}function B(N){const oe=_e.values().next().value;return oe&&typeof oe.runWithContext=="function"?oe.runWithContext(N):N()}function G(N,oe){let Y;const[de,ze,T]=H$(N,oe);Y=js(de.reverse(),"beforeRouteLeave",N,oe);for(const A of de)A.leaveGuards.forEach(L=>{Y.push(Er(L,N,oe))});const E=R.bind(null,N,oe);return Y.push(E),W(Y).then(()=>{Y=[];for(const A of i.list())Y.push(Er(A,N,oe));return Y.push(E),W(Y)}).then(()=>{Y=js(ze,"beforeRouteUpdate",N,oe);for(const A of ze)A.updateGuards.forEach(L=>{Y.push(Er(L,N,oe))});return Y.push(E),W(Y)}).then(()=>{Y=[];for(const A of T)if(A.beforeEnter)if(qt(A.beforeEnter))for(const L of A.beforeEnter)Y.push(Er(L,N,oe));else Y.push(Er(A.beforeEnter,N,oe));return Y.push(E),W(Y)}).then(()=>(N.matched.forEach(A=>A.enterCallbacks={}),Y=js(T,"beforeRouteEnter",N,oe,B),Y.push(E),W(Y))).then(()=>{Y=[];for(const A of a.list())Y.push(Er(A,N,oe));return Y.push(E),W(Y)}).catch(A=>sr(A,8)?A:Promise.reject(A))}function le(N,oe,Y){o.list().forEach(de=>B(()=>de(N,oe,Y)))}function ie(N,oe,Y,de,ze){const T=k(N,oe);if(T)return T;const E=oe===yr,A=un?history.state:{};Y&&(de||E?s.replace(N.fullPath,Ue({scroll:E&&A&&A.scroll},ze)):s.push(N.fullPath,ze)),u.value=N,P(N,oe,Y,E),Me()}let ae;function ke(){ae||(ae=s.listen((N,oe,Y)=>{if(!Xe.listening)return;const de=w(N),ze=z(de);if(ze){O(Ue(ze,{replace:!0,force:!0}),de).catch(Yn);return}l=de;const T=u.value;un&&m$(nd(T.fullPath,Y.delta),ms()),G(de,T).catch(E=>sr(E,12)?E:sr(E,2)?(O(Ue(y(E.to),{force:!0}),de).then(A=>{sr(A,20)&&!Y.delta&&Y.type===oi.pop&&s.go(-1,!1)}).catch(Yn),Promise.reject()):(Y.delta&&s.go(-Y.delta,!1),Q(E,de,T))).then(E=>{E=E||ie(de,T,!1),E&&(Y.delta&&!sr(E,8)?s.go(-Y.delta,!1):Y.type===oi.pop&&sr(E,20)&&s.go(-1,!1)),le(de,T,E)}).catch(Yn)}))}let be=En(),X=En(),se;function Q(N,oe,Y){Me(N);const de=X.list();return de.length?de.forEach(ze=>ze(N,oe,Y)):console.error(N),Promise.reject(N)}function ce(){return se&&u.value!==yr?Promise.resolve():new Promise((N,oe)=>{be.add([N,oe])})}function Me(N){return se||(se=!N,ke(),be.list().forEach(([oe,Y])=>N?Y(N):oe()),be.reset()),N}function P(N,oe,Y,de){const{scrollBehavior:ze}=e;if(!un||!ze)return Promise.resolve();const T=!Y&&g$(nd(N.fullPath,0))||(de||!Y)&&history.state&&history.state.scroll||null;return Th().then(()=>ze(N,oe,T)).then(E=>E&&h$(E)).catch(E=>Q(E,N,oe))}const V=N=>s.go(N);let J;const _e=new Set,Xe={currentRoute:u,listening:!0,addRoute:m,removeRoute:_,clearRoutes:t.clearRoutes,hasRoute:x,getRoutes:b,resolve:w,options:e,push:S,replace:I,go:V,back:()=>V(-1),forward:()=>V(1),beforeEach:i.add,beforeResolve:a.add,afterEach:o.add,onError:X.add,isReady:ce,install(N){const oe=this;N.component("RouterLink",W$),N.component("RouterView",$m),N.config.globalProperties.$router=oe,Object.defineProperty(N.config.globalProperties,"$route",{enumerable:!0,get:()=>jr(u)}),un&&!J&&u.value===yr&&(J=!0,S(s.location).catch(ze=>{}));const Y={};for(const ze in yr)Object.defineProperty(Y,ze,{get:()=>u.value[ze],enumerable:!0});N.provide(Ho,oe),N.provide(vm,vh(Y)),N.provide(oo,u);const de=N.unmount;_e.add(N),N.unmount=function(){_e.delete(N),_e.size<1&&(l=yr,ae&&ae(),ae=null,u.value=yr,J=!1,se=!1),de()}}};function W(N){return N.reduce((oe,Y)=>oe.then(()=>B(Y)),Promise.resolve())}return Xe}function H$(e,t){const r=[],n=[],s=[],i=Math.max(t.matched.length,e.matched.length);for(let a=0;a<i;a++){const o=t.matched[a];o&&(e.matched.find(l=>gn(l,o))?n.push(o):r.push(o));const u=e.matched[a];u&&(t.matched.find(l=>gn(l,u))||s.push(u))}return[r,n,s]}const G$={__name:"App",setup(e){return(t,r)=>(Xn(),rm(jr($m)))}};/*!
 * ONNX Runtime Web v1.22.0
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */var Go=Object.defineProperty,j$=Object.getOwnPropertyDescriptor,K$=Object.getOwnPropertyNames,Q$=Object.prototype.hasOwnProperty,Z$=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),K=(e,t)=>()=>(e&&(t=e(e=0)),t),wn=(e,t)=>{for(var r in t)Go(e,r,{get:t[r],enumerable:!0})},X$=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of K$(t))!Q$.call(e,s)&&s!==r&&Go(e,s,{get:()=>t[s],enumerable:!(n=j$(t,s))||n.enumerable});return e},ui=e=>X$(Go({},"__esModule",{value:!0}),e),In,wr,ln,bd,xm,Sm=K(()=>{In=new Map,wr=[],ln=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let n=In.get(e);if(n===void 0)In.set(e,{backend:t,priority:r});else{if(n.priority>r)return;if(n.priority===r&&n.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let s=wr.indexOf(e);s!==-1&&wr.splice(s,1);for(let i=0;i<wr.length;i++)if(In.get(wr[i]).priority<=r){wr.splice(i,0,e);return}wr.push(e)}return}throw new TypeError("not a valid backend")},bd=async e=>{let t=In.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(n){return r||(t.error=`${n}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},xm=async e=>{let t=e.executionProviders||[],r=t.map(u=>typeof u=="string"?u:u.name),n=r.length===0?wr:r,s,i=[],a=new Set;for(let u of n){let l=await bd(u);typeof l=="string"?i.push({name:u,err:l}):(s||(s=l),s===l&&a.add(u))}if(!s)throw new Error(`no available backend found. ERR: ${i.map(u=>`[${u.name}] ${u.err}`).join(", ")}`);for(let{name:u,err:l}of i)r.includes(u)&&console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${l}`);let o=t.filter(u=>a.has(typeof u=="string"?u:u.name));return[s,new Proxy(e,{get:(u,l)=>l==="executionProviders"?o:Reflect.get(u,l)})]}}),Y$=K(()=>{Sm()}),km,J$=K(()=>{km="1.22.0"}),Ks,zt,Tm=K(()=>{J$(),Ks="warning",zt={wasm:{},webgl:{},webgpu:{},versions:{common:km},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);Ks=e}},get logLevel(){return Ks}},Object.defineProperty(zt,"logLevel",{enumerable:!0})}),He,e1=K(()=>{Tm(),He=zt}),Em,Im,t1=K(()=>{Em=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let n=r.getContext("2d");if(n!=null){let s,i;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(s=e.dims[2],i=e.dims[3]):(s=e.dims[3],i=e.dims[2]);let a=(t==null?void 0:t.format)!==void 0?t.format:"RGB",o=t==null?void 0:t.norm,u,l;o===void 0||o.mean===void 0?u=[255,255,255,255]:typeof o.mean=="number"?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(u[3]=o.mean[3])),o===void 0||o.bias===void 0?l=[0,0,0,0]:typeof o.bias=="number"?l=[o.bias,o.bias,o.bias,o.bias]:(l=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(l[3]=o.bias[3]));let c=i*s,p=0,h=c,m=c*2,_=-1;a==="RGBA"?(p=0,h=c,m=c*2,_=c*3):a==="RGB"?(p=0,h=c,m=c*2):a==="RBG"&&(p=0,m=c,h=c*2);for(let b=0;b<i;b++)for(let x=0;x<s;x++){let w=(e.data[p++]-l[0])*u[0],y=(e.data[h++]-l[1])*u[1],k=(e.data[m++]-l[2])*u[2],S=_===-1?255:(e.data[_++]-l[3])*u[3];n.fillStyle="rgba("+w+","+y+","+k+","+S+")",n.fillRect(x,b,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},Im=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),n;if(r!=null){let s,i,a;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(s=e.dims[2],i=e.dims[1],a=e.dims[3]):(s=e.dims[3],i=e.dims[2],a=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",u=t==null?void 0:t.norm,l,c;u===void 0||u.mean===void 0?l=[255,255,255,255]:typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],255],u.mean[3]!==void 0&&(l[3]=u.mean[3])),u===void 0||u.bias===void 0?c=[0,0,0,0]:typeof u.bias=="number"?c=[u.bias,u.bias,u.bias,u.bias]:(c=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(c[3]=u.bias[3]));let p=i*s;if(t!==void 0&&(t.format!==void 0&&a===4&&t.format!=="RGBA"||a===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let h=4,m=0,_=1,b=2,x=3,w=0,y=p,k=p*2,S=-1;o==="RGBA"?(w=0,y=p,k=p*2,S=p*3):o==="RGB"?(w=0,y=p,k=p*2):o==="RBG"&&(w=0,k=p,y=p*2),n=r.createImageData(s,i);for(let I=0;I<i*s;m+=h,_+=h,b+=h,x+=h,I++)n.data[m]=(e.data[w++]-c[0])*l[0],n.data[_]=(e.data[y++]-c[1])*l[1],n.data[b]=(e.data[k++]-c[2])*l[2],n.data[x]=S===-1?255:(e.data[S++]-c[3])*l[3]}else throw new Error("Can not access image data");return n}}),Ti,Cm,zm,Om,Am,Rm,r1=K(()=>{jo(),Ti=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:n}=t,s=t.norm??{mean:255,bias:0},i,a;typeof s.mean=="number"?i=[s.mean,s.mean,s.mean,s.mean]:i=[s.mean[0],s.mean[1],s.mean[2],s.mean[3]??255],typeof s.bias=="number"?a=[s.bias,s.bias,s.bias,s.bias]:a=[s.bias[0],s.bias[1],s.bias[2],s.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",u=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",l=r*n,c=u==="RGBA"?new Float32Array(l*4):new Float32Array(l*3),p=4,h=0,m=1,_=2,b=3,x=0,w=l,y=l*2,k=-1;o==="RGB"&&(p=3,h=0,m=1,_=2,b=-1),u==="RGBA"?k=l*3:u==="RBG"?(x=0,y=l,w=l*2):u==="BGR"&&(y=0,w=l,x=l*2);for(let S=0;S<l;S++,h+=p,_+=p,m+=p,b+=p)c[x++]=(e[h]+a[0])/i[0],c[w++]=(e[m]+a[1])/i[1],c[y++]=(e[_]+a[2])/i[2],k!==-1&&b!==-1&&(c[k++]=(e[b]+a[3])/i[3]);return u==="RGBA"?new kt("float32",c,[1,4,r,n]):new kt("float32",c,[1,3,r,n])},Cm=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,n=typeof ImageData<"u"&&e instanceof ImageData,s=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,i=typeof e=="string",a,o=t??{},u=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},l=c=>typeof HTMLCanvasElement<"u"&&c instanceof HTMLCanvasElement||c instanceof OffscreenCanvas?c.getContext("2d"):null;if(r){let c=u();c.width=e.width,c.height=e.height;let p=l(c);if(p!=null){let h=e.height,m=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(h=t.resizedHeight,m=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=h,o.width=m}else o.tensorFormat="RGBA",o.height=h,o.width=m;p.drawImage(e,0,0),a=p.getImageData(0,0,m,h).data}else throw new Error("Can not access image data")}else if(n){let c,p;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(c=t.resizedHeight,p=t.resizedWidth):(c=e.height,p=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=c,o.width=p,t!==void 0){let h=u();h.width=p,h.height=c;let m=l(h);if(m!=null)m.putImageData(e,0,0),a=m.getImageData(0,0,p,c).data;else throw new Error("Can not access image data")}else a=e.data}else if(s){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let c=u();c.width=e.width,c.height=e.height;let p=l(c);if(p!=null){let h=e.height,m=e.width;return p.drawImage(e,0,0,m,h),a=p.getImageData(0,0,m,h).data,o.height=h,o.width=m,Ti(a,o)}else throw new Error("Can not access image data")}else{if(i)return new Promise((c,p)=>{let h=u(),m=l(h);if(!e||!m)return p();let _=new Image;_.crossOrigin="Anonymous",_.src=e,_.onload=()=>{h.width=_.width,h.height=_.height,m.drawImage(_,0,0,h.width,h.height);let b=m.getImageData(0,0,h.width,h.height);o.height=h.height,o.width=h.width,c(Ti(b.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(a!==void 0)return Ti(a,o);throw new Error("Input data provided is not supported - aborted tensor creation")},zm=(e,t)=>{let{width:r,height:n,download:s,dispose:i}=t,a=[1,n,r,4];return new kt({location:"texture",type:"float32",texture:e,dims:a,download:s,dispose:i})},Om=(e,t)=>{let{dataType:r,dims:n,download:s,dispose:i}=t;return new kt({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:n,download:s,dispose:i})},Am=(e,t)=>{let{dataType:r,dims:n,download:s,dispose:i}=t;return new kt({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:n,download:s,dispose:i})},Rm=(e,t,r)=>new kt({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Fr,Wn,Qs,Mm,n1=K(()=>{Fr=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),Wn=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),Qs=!1,Mm=()=>{if(!Qs){Qs=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,n=typeof r<"u"&&r.from;e&&(Fr.set("int64",BigInt64Array),Wn.set(BigInt64Array,"int64")),t&&(Fr.set("uint64",BigUint64Array),Wn.set(BigUint64Array,"uint64")),n?(Fr.set("float16",r),Wn.set(r,"float16")):Fr.set("float16",Uint16Array)}}}),Bm,Nm,i1=K(()=>{jo(),Bm=e=>{let t=1;for(let r=0;r<e.length;r++){let n=e[r];if(typeof n!="number"||!Number.isSafeInteger(n))throw new TypeError(`dims[${r}] must be an integer, got: ${n}`);if(n<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${n}`);t*=n}return t},Nm=(e,t)=>{switch(e.location){case"cpu":return new kt(e.type,e.data,t);case"cpu-pinned":return new kt({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new kt({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new kt({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new kt({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),kt,jo=K(()=>{t1(),r1(),n1(),i1(),kt=class{constructor(e,t,r){Mm();let n,s;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,n=e.type,s=e.dims,e.location){case"cpu-pinned":{let a=Fr.get(n);if(!a)throw new TypeError(`unsupported type "${n}" to create tensor from pinned buffer`);if(!(e.data instanceof a))throw new TypeError(`buffer should be of type ${a.name}`);this.cpuData=e.data;break}case"texture":{if(n!=="float32")throw new TypeError(`unsupported type "${n}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(n!=="float32"&&n!=="float16"&&n!=="int32"&&n!=="int64"&&n!=="uint32"&&n!=="uint8"&&n!=="bool"&&n!=="uint4"&&n!=="int4")throw new TypeError(`unsupported type "${n}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(n!=="float32"&&n!=="float16"&&n!=="int32"&&n!=="int64"&&n!=="uint32"&&n!=="uint64"&&n!=="int8"&&n!=="uint8"&&n!=="bool"&&n!=="uint4"&&n!=="int4")throw new TypeError(`unsupported type "${n}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let a,o;if(typeof e=="string")if(n=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");a=t}else{let u=Fr.get(e);if(u===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&u===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${u.name} as data.`);e==="uint64"||e==="int64"?a=u.from(t,BigInt):a=u.from(t)}else if(t instanceof u)a=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")a=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&u!==Uint16Array)a=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${n} tensor's data must be type of ${u}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let u=typeof e[0];if(u==="string")n="string",a=e;else if(u==="boolean")n="bool",a=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${u}.`)}else if(e instanceof Uint8ClampedArray)n="uint8",a=Uint8Array.from(e);else{let u=Wn.get(e.constructor);if(u===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);n=u,a=e}if(o===void 0)o=[a.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");s=o,this.cpuData=a,this.dataLocation="cpu"}let i=Bm(s);if(this.cpuData&&i!==this.cpuData.length&&!((n==="uint4"||n==="int4")&&Math.ceil(i/2)===this.cpuData.length))throw new Error(`Tensor's size(${i}) does not match data length(${this.cpuData.length}).`);this.type=n,this.dims=s,this.size=i}static async fromImage(e,t){return Cm(e,t)}static fromTexture(e,t){return zm(e,t)}static fromGpuBuffer(e,t){return Om(e,t)}static fromMLTensor(e,t){return Am(e,t)}static fromPinnedBuffer(e,t,r){return Rm(e,t,r)}toDataURL(e){return Em(this,e)}toImageData(e){return Im(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Nm(this,e)}}}),Xt,Pm=K(()=>{jo(),Xt=kt}),Yi,Zs,tr,Lt,Dm=K(()=>{Tm(),Yi=(e,t)=>{(typeof zt.trace>"u"?!zt.wasm.trace:!zt.trace)||console.timeStamp(`${e}::ORT::${t}`)},Zs=(e,t)=>{var s;let r=((s=new Error().stack)==null?void 0:s.split(/\r\n|\r|\n/g))||[],n=!1;for(let i=0;i<r.length;i++){if(n&&!r[i].includes("TRACE_FUNC")){let a=`FUNC_${e}::${r[i].trim().split(" ")[1]}`;t&&(a+=`::${t}`),Yi("CPU",a);return}r[i].includes("TRACE_FUNC")&&(n=!0)}},tr=e=>{(typeof zt.trace>"u"?!zt.wasm.trace:!zt.trace)||Zs("BEGIN",e)},Lt=e=>{(typeof zt.trace>"u"?!zt.wasm.trace:!zt.trace)||Zs("END",e)}}),Um,s1=K(()=>{Sm(),Pm(),Dm(),Um=class Wm{constructor(t){this.handler=t}async run(t,r,n){tr();let s={},i={};if(typeof t!="object"||t===null||t instanceof Xt||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let a=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof Xt)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");a=!1;for(let l of r){if(typeof l!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(l)===-1)throw new RangeError(`'fetches' contains invalid output name: ${l}.`);s[l]=null}if(typeof n=="object"&&n!==null)i=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else{let l=!1,c=Object.getOwnPropertyNames(r);for(let p of this.outputNames)if(c.indexOf(p)!==-1){let h=r[p];(h===null||h instanceof Xt)&&(l=!0,a=!1,s[p]=h)}if(l){if(typeof n=="object"&&n!==null)i=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else i=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let l of this.inputNames)if(typeof t[l]>"u")throw new Error(`input '${l}' is missing in 'feeds'.`);if(a)for(let l of this.outputNames)s[l]=null;let o=await this.handler.run(t,s,i),u={};for(let l in o)if(Object.hasOwnProperty.call(o,l)){let c=o[l];c instanceof Xt?u[l]=c:u[l]=new Xt(c.type,c.data,c.dims)}return Lt(),u}async release(){return this.handler.dispose()}static async create(t,r,n,s){tr();let i,a={};if(typeof t=="string"){if(i=t,typeof r=="object"&&r!==null)a=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(i=t,typeof r=="object"&&r!==null)a=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let c=t,p=0,h=t.byteLength;if(typeof r=="object"&&r!==null)a=r;else if(typeof r=="number"){if(p=r,!Number.isSafeInteger(p))throw new RangeError("'byteOffset' must be an integer.");if(p<0||p>=c.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${c.byteLength}).`);if(h=t.byteLength-p,typeof n=="number"){if(h=n,!Number.isSafeInteger(h))throw new RangeError("'byteLength' must be an integer.");if(h<=0||p+h>c.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${c.byteLength-p}].`);if(typeof s=="object"&&s!==null)a=s;else if(typeof s<"u")throw new TypeError("'options' must be an object.")}else if(typeof n<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");i=new Uint8Array(c,p,h)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await xm(a),l=await o.createInferenceSessionHandler(i,u);return Lt(),new Wm(l)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Lm,a1=K(()=>{s1(),Lm=Um}),o1=K(()=>{}),u1=K(()=>{}),l1=K(()=>{}),d1=K(()=>{}),c1={};wn(c1,{InferenceSession:()=>Lm,TRACE:()=>Yi,TRACE_FUNC_BEGIN:()=>tr,TRACE_FUNC_END:()=>Lt,Tensor:()=>Xt,env:()=>He,registerBackend:()=>ln});var Ft=K(()=>{Y$(),e1(),a1(),Pm(),o1(),u1(),Dm(),l1(),d1()}),Ko=K(()=>{}),qm={};wn(qm,{default:()=>Fm});var Xs,Ys,Fm,p1=K(()=>{var e;Kb(),en(),Qo(),Xs="ort-wasm-proxy-worker",Ys=((e=globalThis.self)==null?void 0:e.name)===Xs,Ys&&(self.onmessage=t=>{let{type:r,in:n}=t.data;try{switch(r){case"init-wasm":Zo(n.wasm).then(()=>{fu(n).then(()=>{postMessage({type:r})},s=>{postMessage({type:r,err:s})})},s=>{postMessage({type:r,err:s})});break;case"init-ep":{let{epName:s,env:i}=n;hu(i,s).then(()=>{postMessage({type:r})},a=>{postMessage({type:r,err:a})});break}case"copy-from":{let{buffer:s}=n,i=ss(s);postMessage({type:r,out:i});break}case"create":{let{model:s,options:i}=n;mu(s,i).then(a=>{postMessage({type:r,out:a})},a=>{postMessage({type:r,err:a})});break}case"release":gu(n),postMessage({type:r});break;case"run":{let{sessionId:s,inputIndices:i,inputs:a,outputIndices:o,options:u}=n;_u(s,i,a,o,new Array(o.length).fill(null),u).then(l=>{l.some(c=>c[3]!=="cpu")?postMessage({type:r,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:r,out:l},yu([...a,...l]))},l=>{postMessage({type:r,err:l})});break}case"end-profiling":bu(n),postMessage({type:r});break;default:}}catch(s){postMessage({type:r,err:s})}}),Fm=Ys?null:t=>new Worker(t??$t,{type:"module",name:Xs})}),Vm={};wn(Vm,{default:()=>Hm});var Js,ea,Hm,yd,f1=K(()=>{var e,t;ea=(Js=import.meta.url,async function(r={}){var kl;var n,s,i=r,a=new Promise((d,f)=>{n=d,s=f}),o=typeof window=="object",u=typeof WorkerGlobalScope<"u",l=u&&((kl=self.name)==null?void 0:kl.startsWith("em-pthread"));i.mountExternalData=(d,f)=>{d.startsWith("./")&&(d=d.substring(2)),(i.Fb||(i.Fb=new Map)).set(d,f)},i.unmountExternalData=()=>{delete i.Fb};var c=globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,qc:!0}).buffer.constructor;let p=d=>async(...f)=>{var g;try{if(i.Gb)throw Error("Session already started");let v=i.Gb={ec:f[0],errors:[]},$=await d(...f);if(i.Gb!==v)throw Error("Session mismatch");(g=i.Kb)==null||g.flush();let C=v.errors;if(0<C.length){let D=await Promise.all(C);if(D=D.filter(j=>j),0<D.length)throw Error(D.join(`
`))}return $}finally{i.Gb=null}};i.jsepInit=(d,f)=>{if(d==="webgpu"){[i.Kb,i.Vb,i.Zb,i.Lb,i.Yb,i.kb,i.$b,i.bc,i.Wb,i.Xb,i.ac]=f;let g=i.Kb;i.jsepRegisterBuffer=(v,$,C,D)=>g.registerBuffer(v,$,C,D),i.jsepGetBuffer=v=>g.getBuffer(v),i.jsepCreateDownloader=(v,$,C)=>g.createDownloader(v,$,C),i.jsepOnCreateSession=v=>{g.onCreateSession(v)},i.jsepOnReleaseSession=v=>{g.onReleaseSession(v)},i.jsepOnRunStart=v=>g.onRunStart(v),i.cc=(v,$)=>{g.upload(v,$)}}else if(d==="webnn"){let g=f[0];[i.oc,i.Ob,i.webnnEnsureTensor,i.Pb,i.webnnDownloadTensor]=f.slice(1),i.webnnReleaseTensorId=i.Ob,i.webnnUploadTensor=i.Pb,i.webnnOnRunStart=v=>g.onRunStart(v),i.webnnOnRunEnd=g.onRunEnd.bind(g),i.webnnRegisterMLContext=(v,$)=>{g.registerMLContext(v,$)},i.webnnOnReleaseSession=v=>{g.onReleaseSession(v)},i.webnnCreateMLTensorDownloader=(v,$)=>g.createMLTensorDownloader(v,$),i.webnnRegisterMLTensor=(v,$,C,D)=>g.registerMLTensor(v,$,C,D),i.webnnCreateMLContext=v=>g.createMLContext(v),i.webnnRegisterMLConstant=(v,$,C,D,j,ne)=>g.registerMLConstant(v,$,C,D,j,i.Fb,ne),i.webnnRegisterGraphInput=g.registerGraphInput.bind(g),i.webnnIsGraphInput=g.isGraphInput.bind(g),i.webnnRegisterGraphOutput=g.registerGraphOutput.bind(g),i.webnnIsGraphOutput=g.isGraphOutput.bind(g),i.webnnCreateTemporaryTensor=g.createTemporaryTensor.bind(g),i.webnnIsGraphInputOutputTypeSupported=g.isGraphInputOutputTypeSupported.bind(g)}};let h=()=>{let d=(f,g,v)=>(...$)=>{let C=Ht,D=g==null?void 0:g();$=f(...$);let j=g==null?void 0:g();return D!==j&&(f=j,v(D),g=v=null),Ht!=C?new Promise((ne,he)=>{ks={resolve:ne,reject:he}}):$};(()=>{for(let f of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])i[f]=d(i[f],()=>i[f],g=>i[f]=g)})(),p!==void 0&&(i._OrtRun=p(i._OrtRun),i._OrtRunWithBinding=p(i._OrtRunWithBinding)),h=void 0};i.asyncInit=()=>{h==null||h()};var m,_,b=Object.assign({},i),x=(d,f)=>{throw f},w="";(o||u)&&(u?w=self.location.href:typeof document<"u"&&document.currentScript&&(w=document.currentScript.src),Js&&(w=Js),w=w.startsWith("blob:")?"":w.slice(0,w.replace(/[?#].*/,"").lastIndexOf("/")+1),u&&(_=d=>{var f=new XMLHttpRequest;return f.open("GET",d,!1),f.responseType="arraybuffer",f.send(null),new Uint8Array(f.response)}),m=async d=>{if(P(d))return new Promise((g,v)=>{var $=new XMLHttpRequest;$.open("GET",d,!0),$.responseType="arraybuffer",$.onload=()=>{$.status==200||$.status==0&&$.response?g($.response):v($.status)},$.onerror=v,$.send(null)});var f=await fetch(d,{credentials:"same-origin"});if(f.ok)return f.arrayBuffer();throw Error(f.status+" : "+f.url)});var y=console.log.bind(console),k=console.error.bind(console),S=y,I=k;Object.assign(i,b),b=null;var z,O,R,B,G,le,ie,ae,ke,be,X,se,Q,ce=i.wasmBinary,Me=!1,P=d=>d.startsWith("file://");function V(){return z.buffer!=B.buffer&&T(),B}function J(){return z.buffer!=B.buffer&&T(),G}function _e(){return z.buffer!=B.buffer&&T(),le}function Xe(){return z.buffer!=B.buffer&&T(),ie}function W(){return z.buffer!=B.buffer&&T(),ae}function N(){return z.buffer!=B.buffer&&T(),ke}function oe(){return z.buffer!=B.buffer&&T(),be}function Y(){return z.buffer!=B.buffer&&T(),Q}if(l){let d=function(f){try{var g=f.data,v=g.Cb;if(v==="load"){let $=[];self.onmessage=C=>$.push(C),self.startWorker=()=>{postMessage({Cb:"loaded"});for(let C of $)d(C);self.onmessage=d};for(let C of g.Sb)i[C]&&!i[C].proxy||(i[C]=(...D)=>{postMessage({Cb:"callHandler",Rb:C,args:D})},C=="print"&&(S=i[C]),C=="printErr"&&(I=i[C]));z=g.lc,T(),de(g.mc)}else if(v==="run"){uy(g.Bb),Cs(g.Bb,0,0,1,0,0),$n(),xs(g.Bb),ze||(fl(),ze=!0);try{ly(g.hc,g.Ib)}catch($){if($!="unwind")throw $}}else g.target!=="setimmediate"&&(v==="checkMailbox"?ze&&pi():v&&(I(`worker: received unknown command ${v}`),I(g)))}catch($){throw hl(),$}};var de,ze=!1;I=function(...f){f=f.join(" "),console.error(f)},self.alert=function(...f){postMessage({Cb:"alert",text:f.join(" "),jc:wi()})},self.onunhandledrejection=f=>{throw f.reason||f},self.onmessage=d}function T(){var d=z.buffer;i.HEAP8=B=new Int8Array(d),i.HEAP16=le=new Int16Array(d),i.HEAPU8=G=new Uint8Array(d),i.HEAPU16=ie=new Uint16Array(d),i.HEAP32=ae=new Int32Array(d),i.HEAPU32=ke=new Uint32Array(d),i.HEAPF32=be=new Float32Array(d),i.HEAPF64=Q=new Float64Array(d),i.HEAP64=X=new BigInt64Array(d),i.HEAPU64=se=new BigUint64Array(d)}function E(){l?startWorker(i):ge.Da()}l||(z=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),T());var A,L=0,q=null;function F(){if(--L==0&&q){var d=q;q=null,d()}}function te(d){throw I(d="Aborted("+d+")"),Me=!0,d=new WebAssembly.RuntimeError(d+". Build with -sASSERTIONS for more info."),s(d),d}function re(){return{a:{L:$e,Aa:Z,b:cy,$:xu,A:Tu,pa:Eu,X:Cu,Z:zu,qa:Ou,na:Au,ga:Ru,ma:Mu,J:Bu,Y:Nu,V:Pu,oa:Du,W:Uu,va:py,E:fy,Q:hy,O:gy,D:by,v:yy,r:wy,P:vy,z:Iy,R:Cy,ja:zy,T:Oy,aa:Ay,M:Ry,F:My,ia:xs,sa:By,t:Ny,Ca:Py,w:Wy,o:Ly,m:Fy,c:ws,Ba:Vy,n:Hy,j:Ky,u:Qy,p:Zy,f:Xy,s:Yy,l:Jy,e:e0,k:t0,h:r0,g:n0,d:i0,da:s0,ea:a0,fa:o0,ba:Ju,ca:el,N:tl,xa:l0,ua:c0,i:p0,C:f0,G:h0,ta:d0,x:m0,ra:g0,U:_0,q:u0,y:b0,K:y0,S:w0,za:v0,ya:$0,ka:sl,la:al,_:yt,B:ol,I:ul,ha:ll,H:dl,a:z,wa:st}}}var ee={840156:(d,f,g,v,$)=>{if(i===void 0||!i.Fb)return 1;if((d=Je(Number(d>>>0))).startsWith("./")&&(d=d.substring(2)),!(d=i.Fb.get(d)))return 2;if(f=Number(f>>>0),g=Number(g>>>0),v=Number(v>>>0),f+g>d.byteLength)return 3;try{let C=d.subarray(f,f+g);switch($){case 0:J().set(C,v>>>0);break;case 1:i.nc?i.nc(v,C):i.cc(v,C);break;default:return 4}return 0}catch{return 4}},840980:(d,f,g)=>{i.Pb(d,J().subarray(f>>>0,f+g>>>0))},841044:()=>i.oc(),841086:d=>{i.Ob(d)},841123:()=>{i.Wb()},841154:()=>{i.Xb()},841183:()=>{i.ac()},841208:d=>i.Vb(d),841241:d=>i.Zb(d),841273:(d,f,g)=>{i.Lb(Number(d),Number(f),Number(g),!0)},841336:(d,f,g)=>{i.Lb(Number(d),Number(f),Number(g))},841393:()=>typeof wasmOffsetConverter<"u",841450:d=>{i.kb("Abs",d,void 0)},841501:d=>{i.kb("Neg",d,void 0)},841552:d=>{i.kb("Floor",d,void 0)},841605:d=>{i.kb("Ceil",d,void 0)},841657:d=>{i.kb("Reciprocal",d,void 0)},841715:d=>{i.kb("Sqrt",d,void 0)},841767:d=>{i.kb("Exp",d,void 0)},841818:d=>{i.kb("Erf",d,void 0)},841869:d=>{i.kb("Sigmoid",d,void 0)},841924:(d,f,g)=>{i.kb("HardSigmoid",d,{alpha:f,beta:g})},842003:d=>{i.kb("Log",d,void 0)},842054:d=>{i.kb("Sin",d,void 0)},842105:d=>{i.kb("Cos",d,void 0)},842156:d=>{i.kb("Tan",d,void 0)},842207:d=>{i.kb("Asin",d,void 0)},842259:d=>{i.kb("Acos",d,void 0)},842311:d=>{i.kb("Atan",d,void 0)},842363:d=>{i.kb("Sinh",d,void 0)},842415:d=>{i.kb("Cosh",d,void 0)},842467:d=>{i.kb("Asinh",d,void 0)},842520:d=>{i.kb("Acosh",d,void 0)},842573:d=>{i.kb("Atanh",d,void 0)},842626:d=>{i.kb("Tanh",d,void 0)},842678:d=>{i.kb("Not",d,void 0)},842729:(d,f,g)=>{i.kb("Clip",d,{min:f,max:g})},842798:d=>{i.kb("Clip",d,void 0)},842850:(d,f)=>{i.kb("Elu",d,{alpha:f})},842908:d=>{i.kb("Gelu",d,void 0)},842960:d=>{i.kb("Relu",d,void 0)},843012:(d,f)=>{i.kb("LeakyRelu",d,{alpha:f})},843076:(d,f)=>{i.kb("ThresholdedRelu",d,{alpha:f})},843146:(d,f)=>{i.kb("Cast",d,{to:f})},843204:d=>{i.kb("Add",d,void 0)},843255:d=>{i.kb("Sub",d,void 0)},843306:d=>{i.kb("Mul",d,void 0)},843357:d=>{i.kb("Div",d,void 0)},843408:d=>{i.kb("Pow",d,void 0)},843459:d=>{i.kb("Equal",d,void 0)},843512:d=>{i.kb("Greater",d,void 0)},843567:d=>{i.kb("GreaterOrEqual",d,void 0)},843629:d=>{i.kb("Less",d,void 0)},843681:d=>{i.kb("LessOrEqual",d,void 0)},843740:(d,f,g,v,$)=>{i.kb("ReduceMean",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},843915:(d,f,g,v,$)=>{i.kb("ReduceMax",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},844089:(d,f,g,v,$)=>{i.kb("ReduceMin",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},844263:(d,f,g,v,$)=>{i.kb("ReduceProd",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},844438:(d,f,g,v,$)=>{i.kb("ReduceSum",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},844612:(d,f,g,v,$)=>{i.kb("ReduceL1",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},844785:(d,f,g,v,$)=>{i.kb("ReduceL2",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},844958:(d,f,g,v,$)=>{i.kb("ReduceLogSum",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},845135:(d,f,g,v,$)=>{i.kb("ReduceSumSquare",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},845315:(d,f,g,v,$)=>{i.kb("ReduceLogSumExp",d,{keepDims:!!f,noopWithEmptyAxes:!!g,axes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},845495:d=>{i.kb("Where",d,void 0)},845548:(d,f,g)=>{i.kb("Transpose",d,{perm:f?Array.from(W().subarray(Number(f)>>>0,Number(g)>>>0)):[]})},845672:(d,f,g,v)=>{i.kb("DepthToSpace",d,{blocksize:f,mode:Je(g),format:v?"NHWC":"NCHW"})},845805:(d,f,g,v)=>{i.kb("DepthToSpace",d,{blocksize:f,mode:Je(g),format:v?"NHWC":"NCHW"})},845938:(d,f,g,v,$,C,D,j,ne,he,Ee,Be,qe,ot,nn)=>{i.kb("ConvTranspose",d,{format:ne?"NHWC":"NCHW",autoPad:f,dilations:[g],group:v,kernelShape:[$],pads:[C,D],strides:[j],wIsConst:()=>!!V()[he>>>0],outputPadding:Ee?Array.from(W().subarray(Number(Ee)>>>0,Number(Be)>>>0)):[],outputShape:qe?Array.from(W().subarray(Number(qe)>>>0,Number(ot)>>>0)):[],activation:Je(nn)})},846371:(d,f,g,v,$,C,D,j,ne,he,Ee,Be,qe,ot)=>{i.kb("ConvTranspose",d,{format:j?"NHWC":"NCHW",autoPad:f,dilations:Array.from(W().subarray(Number(g)>>>0,2+(Number(g)>>>0)>>>0)),group:v,kernelShape:Array.from(W().subarray(Number($)>>>0,2+(Number($)>>>0)>>>0)),pads:Array.from(W().subarray(Number(C)>>>0,4+(Number(C)>>>0)>>>0)),strides:Array.from(W().subarray(Number(D)>>>0,2+(Number(D)>>>0)>>>0)),wIsConst:()=>!!V()[ne>>>0],outputPadding:he?Array.from(W().subarray(Number(he)>>>0,Number(Ee)>>>0)):[],outputShape:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[],activation:Je(ot)})},847032:(d,f,g,v,$,C,D,j,ne,he,Ee,Be,qe,ot,nn)=>{i.kb("ConvTranspose",d,{format:ne?"NHWC":"NCHW",autoPad:f,dilations:[g],group:v,kernelShape:[$],pads:[C,D],strides:[j],wIsConst:()=>!!V()[he>>>0],outputPadding:Ee?Array.from(W().subarray(Number(Ee)>>>0,Number(Be)>>>0)):[],outputShape:qe?Array.from(W().subarray(Number(qe)>>>0,Number(ot)>>>0)):[],activation:Je(nn)})},847465:(d,f,g,v,$,C,D,j,ne,he,Ee,Be,qe,ot)=>{i.kb("ConvTranspose",d,{format:j?"NHWC":"NCHW",autoPad:f,dilations:Array.from(W().subarray(Number(g)>>>0,2+(Number(g)>>>0)>>>0)),group:v,kernelShape:Array.from(W().subarray(Number($)>>>0,2+(Number($)>>>0)>>>0)),pads:Array.from(W().subarray(Number(C)>>>0,4+(Number(C)>>>0)>>>0)),strides:Array.from(W().subarray(Number(D)>>>0,2+(Number(D)>>>0)>>>0)),wIsConst:()=>!!V()[ne>>>0],outputPadding:he?Array.from(W().subarray(Number(he)>>>0,Number(Ee)>>>0)):[],outputShape:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[],activation:Je(ot)})},848126:(d,f)=>{i.kb("GlobalAveragePool",d,{format:f?"NHWC":"NCHW"})},848217:(d,f,g,v,$,C,D,j,ne,he,Ee,Be,qe,ot)=>{i.kb("AveragePool",d,{format:ot?"NHWC":"NCHW",auto_pad:f,ceil_mode:g,count_include_pad:v,storage_order:$,dilations:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],kernel_shape:j?Array.from(W().subarray(Number(j)>>>0,Number(ne)>>>0)):[],pads:he?Array.from(W().subarray(Number(he)>>>0,Number(Ee)>>>0)):[],strides:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[]})},848696:(d,f)=>{i.kb("GlobalAveragePool",d,{format:f?"NHWC":"NCHW"})},848787:(d,f,g,v,$,C,D,j,ne,he,Ee,Be,qe,ot)=>{i.kb("AveragePool",d,{format:ot?"NHWC":"NCHW",auto_pad:f,ceil_mode:g,count_include_pad:v,storage_order:$,dilations:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],kernel_shape:j?Array.from(W().subarray(Number(j)>>>0,Number(ne)>>>0)):[],pads:he?Array.from(W().subarray(Number(he)>>>0,Number(Ee)>>>0)):[],strides:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[]})},849266:(d,f)=>{i.kb("GlobalMaxPool",d,{format:f?"NHWC":"NCHW"})},849353:(d,f,g,v,$,C,D,j,ne,he,Ee,Be,qe,ot)=>{i.kb("MaxPool",d,{format:ot?"NHWC":"NCHW",auto_pad:f,ceil_mode:g,count_include_pad:v,storage_order:$,dilations:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],kernel_shape:j?Array.from(W().subarray(Number(j)>>>0,Number(ne)>>>0)):[],pads:he?Array.from(W().subarray(Number(he)>>>0,Number(Ee)>>>0)):[],strides:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[]})},849828:(d,f)=>{i.kb("GlobalMaxPool",d,{format:f?"NHWC":"NCHW"})},849915:(d,f,g,v,$,C,D,j,ne,he,Ee,Be,qe,ot)=>{i.kb("MaxPool",d,{format:ot?"NHWC":"NCHW",auto_pad:f,ceil_mode:g,count_include_pad:v,storage_order:$,dilations:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],kernel_shape:j?Array.from(W().subarray(Number(j)>>>0,Number(ne)>>>0)):[],pads:he?Array.from(W().subarray(Number(he)>>>0,Number(Ee)>>>0)):[],strides:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[]})},850390:(d,f,g,v,$)=>{i.kb("Gemm",d,{alpha:f,beta:g,transA:v,transB:$})},850494:d=>{i.kb("MatMul",d,void 0)},850548:(d,f,g,v)=>{i.kb("ArgMax",d,{keepDims:!!f,selectLastIndex:!!g,axis:v})},850656:(d,f,g,v)=>{i.kb("ArgMin",d,{keepDims:!!f,selectLastIndex:!!g,axis:v})},850764:(d,f)=>{i.kb("Softmax",d,{axis:f})},850827:(d,f)=>{i.kb("Concat",d,{axis:f})},850887:(d,f,g,v,$)=>{i.kb("Split",d,{axis:f,numOutputs:g,splitSizes:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},851043:d=>{i.kb("Expand",d,void 0)},851097:(d,f)=>{i.kb("Gather",d,{axis:Number(f)})},851168:(d,f)=>{i.kb("GatherElements",d,{axis:Number(f)})},851247:(d,f)=>{i.kb("GatherND",d,{batch_dims:Number(f)})},851326:(d,f,g,v,$,C,D,j,ne,he,Ee)=>{i.kb("Resize",d,{antialias:f,axes:g?Array.from(W().subarray(Number(g)>>>0,Number(v)>>>0)):[],coordinateTransformMode:Je($),cubicCoeffA:C,excludeOutside:D,extrapolationValue:j,keepAspectRatioPolicy:Je(ne),mode:Je(he),nearestMode:Je(Ee)})},851688:(d,f,g,v,$,C,D)=>{i.kb("Slice",d,{starts:f?Array.from(W().subarray(Number(f)>>>0,Number(g)>>>0)):[],ends:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[],axes:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[]})},851952:d=>{i.kb("Tile",d,void 0)},852004:(d,f,g)=>{i.kb("InstanceNormalization",d,{epsilon:f,format:g?"NHWC":"NCHW"})},852118:(d,f,g)=>{i.kb("InstanceNormalization",d,{epsilon:f,format:g?"NHWC":"NCHW"})},852232:d=>{i.kb("Range",d,void 0)},852285:(d,f)=>{i.kb("Einsum",d,{equation:Je(f)})},852366:(d,f,g,v,$)=>{i.kb("Pad",d,{mode:f,value:g,pads:v?Array.from(W().subarray(Number(v)>>>0,Number($)>>>0)):[]})},852509:(d,f,g,v,$,C)=>{i.kb("BatchNormalization",d,{epsilon:f,momentum:g,spatial:!!$,trainingMode:!!v,format:C?"NHWC":"NCHW"})},852678:(d,f,g,v,$,C)=>{i.kb("BatchNormalization",d,{epsilon:f,momentum:g,spatial:!!$,trainingMode:!!v,format:C?"NHWC":"NCHW"})},852847:(d,f,g)=>{i.kb("CumSum",d,{exclusive:Number(f),reverse:Number(g)})},852944:(d,f,g)=>{i.kb("DequantizeLinear",d,{axis:f,blockSize:g})},853034:(d,f,g,v,$)=>{i.kb("GridSample",d,{align_corners:f,mode:Je(g),padding_mode:Je(v),format:$?"NHWC":"NCHW"})},853204:(d,f,g,v,$)=>{i.kb("GridSample",d,{align_corners:f,mode:Je(g),padding_mode:Je(v),format:$?"NHWC":"NCHW"})},853374:(d,f)=>{i.kb("ScatterND",d,{reduction:Je(f)})},853459:(d,f,g,v,$,C,D,j,ne)=>{i.kb("Attention",d,{numHeads:f,isUnidirectional:g,maskFilterValue:v,scale:$,doRotary:C,qkvHiddenSizes:D?Array.from(W().subarray(Number(j)>>>0,Number(j)+D>>>0)):[],pastPresentShareBuffer:!!ne})},853731:d=>{i.kb("BiasAdd",d,void 0)},853786:d=>{i.kb("BiasSplitGelu",d,void 0)},853847:d=>{i.kb("FastGelu",d,void 0)},853903:(d,f,g,v,$,C,D,j,ne,he,Ee,Be,qe,ot,nn,k0)=>{i.kb("Conv",d,{format:Be?"NHWC":"NCHW",auto_pad:f,dilations:g?Array.from(W().subarray(Number(g)>>>0,Number(v)>>>0)):[],group:$,kernel_shape:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],pads:j?Array.from(W().subarray(Number(j)>>>0,Number(ne)>>>0)):[],strides:he?Array.from(W().subarray(Number(he)>>>0,Number(Ee)>>>0)):[],w_is_const:()=>!!V()[Number(qe)>>>0],activation:Je(ot),activation_params:nn?Array.from(oe().subarray(Number(nn)>>>0,Number(k0)>>>0)):[]})},854487:d=>{i.kb("Gelu",d,void 0)},854539:(d,f,g,v,$,C,D,j,ne)=>{i.kb("GroupQueryAttention",d,{numHeads:f,kvNumHeads:g,scale:v,softcap:$,doRotary:C,rotaryInterleaved:D,smoothSoftmax:j,localWindowSize:ne})},854756:(d,f,g,v)=>{i.kb("LayerNormalization",d,{axis:f,epsilon:g,simplified:!!v})},854867:(d,f,g,v)=>{i.kb("LayerNormalization",d,{axis:f,epsilon:g,simplified:!!v})},854978:(d,f,g,v,$,C)=>{i.kb("MatMulNBits",d,{k:f,n:g,accuracyLevel:v,bits:$,blockSize:C})},855105:(d,f,g,v,$,C)=>{i.kb("MultiHeadAttention",d,{numHeads:f,isUnidirectional:g,maskFilterValue:v,scale:$,doRotary:C})},855264:(d,f)=>{i.kb("QuickGelu",d,{alpha:f})},855328:(d,f,g,v,$)=>{i.kb("RotaryEmbedding",d,{interleaved:!!f,numHeads:g,rotaryEmbeddingDim:v,scale:$})},855467:(d,f,g)=>{i.kb("SkipLayerNormalization",d,{epsilon:f,simplified:!!g})},855569:(d,f,g)=>{i.kb("SkipLayerNormalization",d,{epsilon:f,simplified:!!g})},855671:(d,f,g,v)=>{i.kb("GatherBlockQuantized",d,{gatherAxis:f,quantizeAxis:g,blockSize:v})},855792:d=>{i.$b(d)},855826:(d,f)=>i.bc(Number(d),Number(f),i.Gb.ec,i.Gb.errors)};function Z(d,f,g){return ju(async()=>{await i.Yb(Number(d),Number(f),Number(g))})}function $e(){return typeof wasmOffsetConverter<"u"}class ue{constructor(f){Tl(this,"name","ExitStatus");this.message=`Program terminated with exit(${f})`,this.status=f}}var ye=d=>{d.terminate(),d.onmessage=()=>{}},xe=[],Oe=d=>{tt.length==0&&(vu(),wu(tt[0]));var f=tt.pop();if(!f)return 6;Ot.push(f),Ye[d.Bb]=f,f.Bb=d.Bb;var g={Cb:"run",hc:d.fc,Ib:d.Ib,Bb:d.Bb};return f.postMessage(g,d.Nb),0},Re=0,we=(d,f,...g)=>{for(var v=2*g.length,$=As(),C=Os(8*v),D=C>>>3,j=0;j<g.length;j++){var ne=g[j];typeof ne=="bigint"?(X[D+2*j]=1n,X[D+2*j+1]=ne):(X[D+2*j]=0n,Y()[D+2*j+1>>>0]=ne)}return d=ml(d,0,v,C,f),$i($),d};function st(d){if(l)return we(0,1,d);if(R=d,!(0<Re)){for(var f of Ot)ye(f);for(f of tt)ye(f);tt=[],Ot=[],Ye={},Me=!0}x(0,new ue(d))}function at(d){if(l)return we(1,0,d);yt(d)}var yt=d=>{if(R=d,l)throw at(d),"unwind";st(d)},tt=[],Ot=[],vn=[],Ye={},vt=d=>{var f=d.Bb;delete Ye[f],tt.push(d),Ot.splice(Ot.indexOf(d),1),d.Bb=0,gl(f)};function $n(){vn.forEach(d=>d())}var wu=d=>new Promise(f=>{d.onmessage=$=>{var C=($=$.data).Cb;if($.Hb&&$.Hb!=wi()){var D=Ye[$.Hb];D?D.postMessage($,$.Nb):I(`Internal error! Worker sent a message "${C}" to target pthread ${$.Hb}, but that thread no longer exists!`)}else C==="checkMailbox"?pi():C==="spawnThread"?Oe($):C==="cleanupThread"?vt(Ye[$.ic]):C==="loaded"?(d.loaded=!0,f(d)):C==="alert"?alert(`Thread ${$.jc}: ${$.text}`):$.target==="setimmediate"?d.postMessage($):C==="callHandler"?i[$.Rb](...$.args):C&&I(`worker sent an unknown command ${C}`)},d.onerror=$=>{throw I(`worker sent an error! ${$.filename}:${$.lineno}: ${$.message}`),$};var g,v=[];for(g of[])i.propertyIsEnumerable(g)&&v.push(g);d.postMessage({Cb:"load",Sb:v,lc:z,mc:O})});function vu(){var d=new Worker((()=>{let f=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new f("ort.webgpu.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});tt.push(d)}var uy=d=>{T();var f=N()[d+52>>>2>>>0];d=N()[d+56>>>2>>>0],yl(f,f-d),$i(f)},ly=(d,f)=>{Re=0,d=wl(d,f),0<Re?R=d:zs(d)};class dy{constructor(f){this.Jb=f-24}}function cy(d,f,g){var v=new dy(d>>>=0);throw f>>>=0,g>>>=0,N()[v.Jb+16>>>2>>>0]=0,N()[v.Jb+4>>>2>>>0]=f,N()[v.Jb+8>>>2>>>0]=g,d}function $u(d,f,g,v){return l?we(2,1,d,f,g,v):xu(d,f,g,v)}function xu(d,f,g,v){if(d>>>=0,g>>>=0,v>>>=0,c===void 0)return 6;var $=[];return l&&$.length===0?$u(d,f>>>=0,g,v):(d={fc:g,Bb:d,Ib:v,Nb:$},l?(d.Cb="spawnThread",postMessage(d,$),0):Oe(d))}var Su=typeof TextDecoder<"u"?new TextDecoder:void 0,ku=(d,f=0,g=NaN)=>{var v=(f>>>=0)+g;for(g=f;d[g]&&!(g>=v);)++g;if(16<g-f&&d.buffer&&Su)return Su.decode(d.buffer instanceof ArrayBuffer?d.subarray(f,g):d.slice(f,g));for(v="";f<g;){var $=d[f++];if(128&$){var C=63&d[f++];if((224&$)==192)v+=String.fromCharCode((31&$)<<6|C);else{var D=63&d[f++];65536>($=(240&$)==224?(15&$)<<12|C<<6|D:(7&$)<<18|C<<12|D<<6|63&d[f++])?v+=String.fromCharCode($):($-=65536,v+=String.fromCharCode(55296|$>>10,56320|1023&$))}}else v+=String.fromCharCode($)}return v},Je=(d,f)=>(d>>>=0)?ku(J(),d,f):"";function Tu(d,f,g){return l?we(3,1,d,f,g):0}function Eu(d,f){if(l)return we(4,1,d,f)}var Iu=d=>{for(var f=0,g=0;g<d.length;++g){var v=d.charCodeAt(g);127>=v?f++:2047>=v?f+=2:55296<=v&&57343>=v?(f+=4,++g):f+=3}return f},rn=(d,f,g)=>{var v=J();if(f>>>=0,0<g){var $=f;g=f+g-1;for(var C=0;C<d.length;++C){var D=d.charCodeAt(C);if(55296<=D&&57343>=D&&(D=65536+((1023&D)<<10)|1023&d.charCodeAt(++C)),127>=D){if(f>=g)break;v[f++>>>0]=D}else{if(2047>=D){if(f+1>=g)break;v[f++>>>0]=192|D>>6}else{if(65535>=D){if(f+2>=g)break;v[f++>>>0]=224|D>>12}else{if(f+3>=g)break;v[f++>>>0]=240|D>>18,v[f++>>>0]=128|D>>12&63}v[f++>>>0]=128|D>>6&63}v[f++>>>0]=128|63&D}}v[f>>>0]=0,d=f-$}else d=0;return d};function Cu(d,f){if(l)return we(5,1,d,f)}function zu(d,f,g){if(l)return we(6,1,d,f,g)}function Ou(d,f,g){return l?we(7,1,d,f,g):0}function Au(d,f){if(l)return we(8,1,d,f)}function Ru(d,f,g){if(l)return we(9,1,d,f,g)}function Mu(d,f,g,v){if(l)return we(10,1,d,f,g,v)}function Bu(d,f,g,v){if(l)return we(11,1,d,f,g,v)}function Nu(d,f,g,v){if(l)return we(12,1,d,f,g,v)}function Pu(d){if(l)return we(13,1,d)}function Du(d,f){if(l)return we(14,1,d,f)}function Uu(d,f,g){if(l)return we(15,1,d,f,g)}var Wu,gr,py=()=>te(""),Vt=d=>{for(var f="";J()[d>>>0];)f+=Wu[J()[d++>>>0]];return f},_s={},bs={};function rr(d,f,g={}){return function(v,$,C={}){var D=$.name;if(!v)throw new gr(`type "${D}" must have a positive integer typeid pointer`);if(bs.hasOwnProperty(v)){if(C.Tb)return;throw new gr(`Cannot register type '${D}' twice`)}bs[v]=$,_s.hasOwnProperty(v)&&($=_s[v],delete _s[v],$.forEach(j=>j()))}(d,f,g)}var Lu=(d,f,g)=>{switch(f){case 1:return g?v=>V()[v>>>0]:v=>J()[v>>>0];case 2:return g?v=>_e()[v>>>1>>>0]:v=>Xe()[v>>>1>>>0];case 4:return g?v=>W()[v>>>2>>>0]:v=>N()[v>>>2>>>0];case 8:return g?v=>X[v>>>3]:v=>se[v>>>3];default:throw new TypeError(`invalid integer width (${f}): ${d}`)}};function fy(d,f,g){g>>>=0,rr(d>>>=0,{name:f=Vt(f>>>0),fromWireType:v=>v,toWireType:function(v,$){if(typeof $!="bigint"&&typeof $!="number")throw $=$===null?"null":(v=typeof $)=="object"||v==="array"||v==="function"?$.toString():""+$,new TypeError(`Cannot convert "${$}" to ${this.name}`);return typeof $=="number"&&($=BigInt($)),$},Db:_r,readValueFromPointer:Lu(f,g,f.indexOf("u")==-1),Eb:null})}var _r=8;function hy(d,f,g,v){rr(d>>>=0,{name:f=Vt(f>>>0),fromWireType:function($){return!!$},toWireType:function($,C){return C?g:v},Db:_r,readValueFromPointer:function($){return this.fromWireType(J()[$>>>0])},Eb:null})}var ys=[],nr=[];function ws(d){9<(d>>>=0)&&--nr[d+1]==0&&(nr[d]=void 0,ys.push(d))}var pt=d=>{if(!d)throw new gr("Cannot use deleted val. handle = "+d);return nr[d]},Ct=d=>{switch(d){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let f=ys.pop()||nr.length;return nr[f]=d,nr[f+1]=1,f}};function vs(d){return this.fromWireType(N()[d>>>2>>>0])}var my={name:"emscripten::val",fromWireType:d=>{var f=pt(d);return ws(d),f},toWireType:(d,f)=>Ct(f),Db:_r,readValueFromPointer:vs,Eb:null};function gy(d){return rr(d>>>0,my)}var _y=(d,f)=>{switch(f){case 4:return function(g){return this.fromWireType(oe()[g>>>2>>>0])};case 8:return function(g){return this.fromWireType(Y()[g>>>3>>>0])};default:throw new TypeError(`invalid float width (${f}): ${d}`)}};function by(d,f,g){g>>>=0,rr(d>>>=0,{name:f=Vt(f>>>0),fromWireType:v=>v,toWireType:(v,$)=>$,Db:_r,readValueFromPointer:_y(f,g),Eb:null})}function yy(d,f,g,v,$){if(d>>>=0,g>>>=0,f=Vt(f>>>0),$===-1&&($=4294967295),$=j=>j,v===0){var C=32-8*g;$=j=>j<<C>>>C}var D=f.includes("unsigned")?function(j,ne){return ne>>>0}:function(j,ne){return ne};rr(d,{name:f,fromWireType:$,toWireType:D,Db:_r,readValueFromPointer:Lu(f,g,v!==0),Eb:null})}function wy(d,f,g){function v(C){var D=N()[C>>>2>>>0];return C=N()[C+4>>>2>>>0],new $(V().buffer,C,D)}var $=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][f];rr(d>>>=0,{name:g=Vt(g>>>0),fromWireType:v,Db:_r,readValueFromPointer:v},{Tb:!0})}function vy(d,f){rr(d>>>=0,{name:f=Vt(f>>>0),fromWireType:function(g){for(var v,$=N()[g>>>2>>>0],C=g+4,D=C,j=0;j<=$;++j){var ne=C+j;j!=$&&J()[ne>>>0]!=0||(D=Je(D,ne-D),v===void 0?v=D:(v+="\0",v+=D),D=ne+1)}return Gt(g),v},toWireType:function(g,v){v instanceof ArrayBuffer&&(v=new Uint8Array(v));var $=typeof v=="string";if(!($||v instanceof Uint8Array||v instanceof Uint8ClampedArray||v instanceof Int8Array))throw new gr("Cannot pass non-string to std::string");var C=$?Iu(v):v.length,D=vi(4+C+1),j=D+4;if(N()[D>>>2>>>0]=C,$)rn(v,j,C+1);else if($)for($=0;$<C;++$){var ne=v.charCodeAt($);if(255<ne)throw Gt(D),new gr("String has UTF-16 code units that do not fit in 8 bits");J()[j+$>>>0]=ne}else for($=0;$<C;++$)J()[j+$>>>0]=v[$];return g!==null&&g.push(Gt,D),D},Db:_r,readValueFromPointer:vs,Eb(g){Gt(g)}})}var qu=typeof TextDecoder<"u"?new TextDecoder("utf-16le"):void 0,$y=(d,f)=>{for(var g=d>>1,v=g+f/2;!(g>=v)&&Xe()[g>>>0];)++g;if(32<(g<<=1)-d&&qu)return qu.decode(J().slice(d,g));for(g="",v=0;!(v>=f/2);++v){var $=_e()[d+2*v>>>1>>>0];if($==0)break;g+=String.fromCharCode($)}return g},xy=(d,f,g)=>{if(g??(g=2147483647),2>g)return 0;var v=f;g=(g-=2)<2*d.length?g/2:d.length;for(var $=0;$<g;++$){var C=d.charCodeAt($);_e()[f>>>1>>>0]=C,f+=2}return _e()[f>>>1>>>0]=0,f-v},Sy=d=>2*d.length,ky=(d,f)=>{for(var g=0,v="";!(g>=f/4);){var $=W()[d+4*g>>>2>>>0];if($==0)break;++g,65536<=$?($-=65536,v+=String.fromCharCode(55296|$>>10,56320|1023&$)):v+=String.fromCharCode($)}return v},Ty=(d,f,g)=>{if(f>>>=0,g??(g=2147483647),4>g)return 0;var v=f;g=v+g-4;for(var $=0;$<d.length;++$){var C=d.charCodeAt($);if(55296<=C&&57343>=C&&(C=65536+((1023&C)<<10)|1023&d.charCodeAt(++$)),W()[f>>>2>>>0]=C,(f+=4)+4>g)break}return W()[f>>>2>>>0]=0,f-v},Ey=d=>{for(var f=0,g=0;g<d.length;++g){var v=d.charCodeAt(g);55296<=v&&57343>=v&&++g,f+=4}return f};function Iy(d,f,g){if(d>>>=0,f>>>=0,g=Vt(g>>>=0),f===2)var v=$y,$=xy,C=Sy,D=j=>Xe()[j>>>1>>>0];else f===4&&(v=ky,$=Ty,C=Ey,D=j=>N()[j>>>2>>>0]);rr(d,{name:g,fromWireType:j=>{for(var ne,he=N()[j>>>2>>>0],Ee=j+4,Be=0;Be<=he;++Be){var qe=j+4+Be*f;Be!=he&&D(qe)!=0||(Ee=v(Ee,qe-Ee),ne===void 0?ne=Ee:(ne+="\0",ne+=Ee),Ee=qe+f)}return Gt(j),ne},toWireType:(j,ne)=>{if(typeof ne!="string")throw new gr(`Cannot pass non-string to C++ string type ${g}`);var he=C(ne),Ee=vi(4+he+f);return N()[Ee>>>2>>>0]=he/f,$(ne,Ee+4,he+f),j!==null&&j.push(Gt,Ee),Ee},Db:_r,readValueFromPointer:vs,Eb(j){Gt(j)}})}function Cy(d,f){rr(d>>>=0,{Ub:!0,name:f=Vt(f>>>0),Db:0,fromWireType:()=>{},toWireType:()=>{}})}function zy(d){Cs(d>>>0,!u,1,!o,131072,!1),$n()}var $s=d=>{if(!Me)try{if(d(),!(0<Re))try{l?zs(R):yt(R)}catch(f){f instanceof ue||f=="unwind"||x(0,f)}}catch(f){f instanceof ue||f=="unwind"||x(0,f)}};function xs(d){d>>>=0,typeof Atomics.kc=="function"&&(Atomics.kc(W(),d>>>2,d).value.then(pi),d+=128,Atomics.store(W(),d>>>2,1))}var pi=()=>{var d=wi();d&&(xs(d),$s(bl))};function Oy(d,f){(d>>>=0)==f>>>0?setTimeout(pi):l?postMessage({Hb:d,Cb:"checkMailbox"}):(d=Ye[d])&&d.postMessage({Cb:"checkMailbox"})}var Ss=[];function Ay(d,f,g,v,$){for(f>>>=0,v/=2,Ss.length=v,g=$>>>0>>>3,$=0;$<v;$++)Ss[$]=X[g+2*$]?X[g+2*$+1]:Y()[g+2*$+1>>>0];return(f?ee[f]:S0[d])(...Ss)}var Ry=()=>{Re=0};function My(d){d>>>=0,l?postMessage({Cb:"cleanupThread",ic:d}):vt(Ye[d])}function By(d){}var fi=(d,f)=>{var g=bs[d];if(g===void 0)throw d=pl(d),g=Vt(d),Gt(d),new gr(`${f} has unknown type ${g}`);return g},Fu=(d,f,g)=>{var v=[];return d=d.toWireType(v,g),v.length&&(N()[f>>>2>>>0]=Ct(v)),d};function Ny(d,f,g){return f>>>=0,g>>>=0,d=pt(d>>>0),f=fi(f,"emval::as"),Fu(f,g,d)}function Py(d,f){return f>>>=0,d=pt(d>>>0),(f=fi(f,"emval::as")).toWireType(null,d)}var hi=d=>{try{d()}catch(f){te(f)}},br=0,Ht=null,Vu=0,mi=[],Hu={},Gu={},Dy=0,ks=null,Uy=[];function ju(d){return function(f){if(!Me){if(br===0){var g=!1,v=!1;f(($=0)=>{if(!Me&&(Vu=$,g=!0,v)){br=2,hi(()=>xl(Ht)),typeof MainLoop<"u"&&MainLoop.Qb&&MainLoop.resume(),$=!1;try{var C=function(){var ne=W()[Ht+8>>>2>>>0];return ne=ge[Gu[ne]],--Re,ne()}()}catch(ne){C=ne,$=!0}var D=!1;if(!Ht){var j=ks;j&&(ks=null,($?j.reject:j.resolve)(C),D=!0)}if($&&!D)throw C}}),v=!0,g||(br=1,Ht=function(){var $=vi(65548),C=$+12;N()[$>>>2>>>0]=C,N()[$+4>>>2>>>0]=C+65536,C=mi[0];var D=Hu[C];return D===void 0&&(D=Dy++,Hu[C]=D,Gu[D]=C),C=D,W()[$+8>>>2>>>0]=C,$}(),typeof MainLoop<"u"&&MainLoop.Qb&&MainLoop.pause(),hi(()=>vl(Ht)))}else br===2?(br=0,hi(Sl),Gt(Ht),Ht=null,Uy.forEach($s)):te(`invalid state: ${br}`);return Vu}}(f=>{d().then(f)})}function Wy(d){return d>>>=0,ju(async()=>{var f=await pt(d);return Ct(f)})}var gi=[];function Ly(d,f,g,v){return g>>>=0,v>>>=0,(d=gi[d>>>0])(null,f=pt(f>>>0),g,v)}var qy={},_i=d=>{var f=qy[d];return f===void 0?Vt(d):f};function Fy(d,f,g,v,$){return g>>>=0,v>>>=0,$>>>=0,(d=gi[d>>>0])(f=pt(f>>>0),f[g=_i(g)],v,$)}function Vy(d,f){return f>>>=0,(d=pt(d>>>0))==pt(f)}var Ku=()=>typeof globalThis=="object"?globalThis:Function("return this")();function Hy(d){return(d>>>=0)==0?Ct(Ku()):(d=_i(d),Ct(Ku()[d]))}var Gy=d=>{var f=gi.length;return gi.push(d),f},jy=(d,f)=>{for(var g=Array(d),v=0;v<d;++v)g[v]=fi(N()[f+4*v>>>2>>>0],"parameter "+v);return g},Qu=(d,f)=>Object.defineProperty(f,"name",{value:d});function Ky(d,f,g){var v=(f=jy(d,f>>>0)).shift();d--;var $=`return function (obj, func, destructorsRef, args) {
`,C=0,D=[];g===0&&D.push("obj");for(var j=["retType"],ne=[v],he=0;he<d;++he)D.push("arg"+he),j.push("argType"+he),ne.push(f[he]),$+=`  var arg${he} = argType${he}.readValueFromPointer(args${C?"+"+C:""});
`,C+=f[he].Db;return $+=`  var rv = ${g===1?"new func":"func.call"}(${D.join(", ")});
`,v.Ub||(j.push("emval_returnValue"),ne.push(Fu),$+=`  return emval_returnValue(retType, destructorsRef, rv);
`),j.push($+`};
`),d=function(Ee){var Be=Function;if(!(Be instanceof Function))throw new TypeError(`new_ called with constructor type ${typeof Be} which is not a function`);var qe=Qu(Be.name||"unknownFunctionName",function(){});return qe.prototype=Be.prototype,qe=new qe,(Ee=Be.apply(qe,Ee))instanceof Object?Ee:qe}(j)(...ne),g=`methodCaller<(${f.map(Ee=>Ee.name).join(", ")}) => ${v.name}>`,Gy(Qu(g,d))}function Qy(d){return d=_i(d>>>0),Ct(i[d])}function Zy(d,f){return f>>>=0,d=pt(d>>>0),f=pt(f),Ct(d[f])}function Xy(d){9<(d>>>=0)&&(nr[d+1]+=1)}function Yy(){return Ct([])}function Jy(d){d=pt(d>>>0);for(var f=Array(d.length),g=0;g<d.length;g++)f[g]=d[g];return Ct(f)}function e0(d){return Ct(_i(d>>>0))}function t0(){return Ct({})}function r0(d){for(var f=pt(d>>>=0);f.length;){var g=f.pop();f.pop()(g)}ws(d)}function n0(d,f,g){f>>>=0,g>>>=0,d=pt(d>>>0),f=pt(f),g=pt(g),d[f]=g}function i0(d,f){return f>>>=0,d=(d=fi(d>>>0,"_emval_take_value")).readValueFromPointer(f),Ct(d)}function s0(d,f){d=-9007199254740992>d||9007199254740992<d?NaN:Number(d),f>>>=0,d=new Date(1e3*d),W()[f>>>2>>>0]=d.getUTCSeconds(),W()[f+4>>>2>>>0]=d.getUTCMinutes(),W()[f+8>>>2>>>0]=d.getUTCHours(),W()[f+12>>>2>>>0]=d.getUTCDate(),W()[f+16>>>2>>>0]=d.getUTCMonth(),W()[f+20>>>2>>>0]=d.getUTCFullYear()-1900,W()[f+24>>>2>>>0]=d.getUTCDay(),d=(d.getTime()-Date.UTC(d.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,W()[f+28>>>2>>>0]=d}var Zu=d=>d%4==0&&(d%100!=0||d%400==0),Xu=[0,31,60,91,121,152,182,213,244,274,305,335],Yu=[0,31,59,90,120,151,181,212,243,273,304,334];function a0(d,f){d=-9007199254740992>d||9007199254740992<d?NaN:Number(d),f>>>=0,d=new Date(1e3*d),W()[f>>>2>>>0]=d.getSeconds(),W()[f+4>>>2>>>0]=d.getMinutes(),W()[f+8>>>2>>>0]=d.getHours(),W()[f+12>>>2>>>0]=d.getDate(),W()[f+16>>>2>>>0]=d.getMonth(),W()[f+20>>>2>>>0]=d.getFullYear()-1900,W()[f+24>>>2>>>0]=d.getDay();var g=(Zu(d.getFullYear())?Xu:Yu)[d.getMonth()]+d.getDate()-1|0;W()[f+28>>>2>>>0]=g,W()[f+36>>>2>>>0]=-60*d.getTimezoneOffset(),g=new Date(d.getFullYear(),6,1).getTimezoneOffset();var v=new Date(d.getFullYear(),0,1).getTimezoneOffset();d=0|(g!=v&&d.getTimezoneOffset()==Math.min(v,g)),W()[f+32>>>2>>>0]=d}function o0(d){d>>>=0;var f=new Date(W()[d+20>>>2>>>0]+1900,W()[d+16>>>2>>>0],W()[d+12>>>2>>>0],W()[d+8>>>2>>>0],W()[d+4>>>2>>>0],W()[d>>>2>>>0],0),g=W()[d+32>>>2>>>0],v=f.getTimezoneOffset(),$=new Date(f.getFullYear(),6,1).getTimezoneOffset(),C=new Date(f.getFullYear(),0,1).getTimezoneOffset(),D=Math.min(C,$);return 0>g?W()[d+32>>>2>>>0]=+($!=C&&D==v):0<g!=(D==v)&&($=Math.max(C,$),f.setTime(f.getTime()+6e4*((0<g?D:$)-v))),W()[d+24>>>2>>>0]=f.getDay(),g=(Zu(f.getFullYear())?Xu:Yu)[f.getMonth()]+f.getDate()-1|0,W()[d+28>>>2>>>0]=g,W()[d>>>2>>>0]=f.getSeconds(),W()[d+4>>>2>>>0]=f.getMinutes(),W()[d+8>>>2>>>0]=f.getHours(),W()[d+12>>>2>>>0]=f.getDate(),W()[d+16>>>2>>>0]=f.getMonth(),W()[d+20>>>2>>>0]=f.getYear(),d=f.getTime(),BigInt(isNaN(d)?-1:d/1e3)}function Ju(d,f,g,v,$,C,D){return l?we(16,1,d,f,g,v,$,C,D):-52}function el(d,f,g,v,$,C){if(l)return we(17,1,d,f,g,v,$,C)}var xn={},u0=()=>performance.timeOrigin+performance.now();function tl(d,f){if(l)return we(18,1,d,f);if(xn[d]&&(clearTimeout(xn[d].id),delete xn[d]),!f)return 0;var g=setTimeout(()=>{delete xn[d],$s(()=>_l(d,performance.timeOrigin+performance.now()))},f);return xn[d]={id:g,rc:f},0}function l0(d,f,g,v){d>>>=0,f>>>=0,g>>>=0,v>>>=0;var $=new Date().getFullYear(),C=new Date($,0,1).getTimezoneOffset();$=new Date($,6,1).getTimezoneOffset();var D=Math.max(C,$);N()[d>>>2>>>0]=60*D,W()[f>>>2>>>0]=+(C!=$),d=(f=j=>{var ne=Math.abs(j);return`UTC${0<=j?"-":"+"}${String(Math.floor(ne/60)).padStart(2,"0")}${String(ne%60).padStart(2,"0")}`})(C),f=f($),$<C?(rn(d,g,17),rn(f,v,17)):(rn(d,v,17),rn(f,g,17))}var d0=()=>Date.now();function c0(d,f,g){return 0<=d&&3>=d?(d===0?d=Date.now():d=performance.timeOrigin+performance.now(),X[g>>>0>>>3]=BigInt(Math.round(1e6*d)),0):28}var Ts=[],rl=(d,f)=>{Ts.length=0;for(var g;g=J()[d++>>>0];){var v=g!=105;f+=(v&=g!=112)&&f%8?4:0,Ts.push(g==112?N()[f>>>2>>>0]:g==106?X[f>>>3]:g==105?W()[f>>>2>>>0]:Y()[f>>>3>>>0]),f+=v?8:4}return Ts};function p0(d,f,g){return d>>>=0,f=rl(f>>>0,g>>>0),ee[d](...f)}function f0(d,f,g){return d>>>=0,f=rl(f>>>0,g>>>0),ee[d](...f)}var h0=()=>{};function m0(d,f){return I(Je(d>>>0,f>>>0))}var g0=()=>{throw Re+=1,"unwind"};function _0(){return 4294901760}var b0=()=>navigator.hardwareConcurrency;function y0(){return te("Cannot use emscripten_pc_get_function without -sUSE_OFFSET_CONVERTER"),0}function w0(d){d>>>=0;var f=J().length;if(d<=f||4294901760<d)return!1;for(var g=1;4>=g;g*=2){var v=f*(1+.2/g);v=Math.min(v,d+100663296);e:{v=(Math.min(4294901760,65536*Math.ceil(Math.max(d,v)/65536))-z.buffer.byteLength+65535)/65536|0;try{z.grow(v),T();var $=1;break e}catch{}$=void 0}if($)return!0}return!1}var bi=()=>(te("Cannot use convertFrameToPC (needed by __builtin_return_address) without -sUSE_OFFSET_CONVERTER"),0),Sn={},nl=d=>{d.forEach(f=>{bi()})};function v0(){var d=Error().stack.toString().split(`
`);return d[0]=="Error"&&d.shift(),nl(d),Sn.Mb=bi(),Sn.dc=d,Sn.Mb}function $0(d,f,g){if(d>>>=0,f>>>=0,Sn.Mb==d)var v=Sn.dc;else(v=Error().stack.toString().split(`
`))[0]=="Error"&&v.shift(),nl(v);for(var $=3;v[$]&&bi()!=d;)++$;for(d=0;d<g&&v[d+$];++d)W()[f+4*d>>>2>>>0]=bi();return d}var Es,Is={},il=()=>{if(!Es){var d,f={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(typeof navigator=="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:"./this.program"};for(d in Is)Is[d]===void 0?delete f[d]:f[d]=Is[d];var g=[];for(d in f)g.push(`${d}=${f[d]}`);Es=g}return Es};function sl(d,f){if(l)return we(19,1,d,f);d>>>=0,f>>>=0;var g=0;return il().forEach((v,$)=>{var C=f+g;for($=N()[d+4*$>>>2>>>0]=C,C=0;C<v.length;++C)V()[$++>>>0]=v.charCodeAt(C);V()[$>>>0]=0,g+=v.length+1}),0}function al(d,f){if(l)return we(20,1,d,f);d>>>=0,f>>>=0;var g=il();N()[d>>>2>>>0]=g.length;var v=0;return g.forEach($=>v+=$.length+1),N()[f>>>2>>>0]=v,0}function ol(d){return l?we(21,1,d):52}function ul(d,f,g,v){return l?we(22,1,d,f,g,v):52}function ll(d,f,g,v){return l?we(23,1,d,f,g,v):70}var x0=[null,[],[]];function dl(d,f,g,v){if(l)return we(24,1,d,f,g,v);f>>>=0,g>>>=0,v>>>=0;for(var $=0,C=0;C<g;C++){var D=N()[f>>>2>>>0],j=N()[f+4>>>2>>>0];f+=8;for(var ne=0;ne<j;ne++){var he=J()[D+ne>>>0],Ee=x0[d];he===0||he===10?((d===1?S:I)(ku(Ee)),Ee.length=0):Ee.push(he)}$+=j}return N()[v>>>2>>>0]=$,0}l||function(){for(var d=i.numThreads-1;d--;)vu();xe.unshift(()=>{L++,function(f){l?f():Promise.all(tt.map(wu)).then(f)}(()=>F())})}();for(var cl=Array(256),yi=0;256>yi;++yi)cl[yi]=String.fromCharCode(yi);Wu=cl,gr=i.BindingError=class extends Error{constructor(d){super(d),this.name="BindingError"}},i.InternalError=class extends Error{constructor(d){super(d),this.name="InternalError"}},nr.push(0,1,void 0,1,null,1,!0,1,!1,1),i.count_emval_handles=()=>nr.length/2-5-ys.length;var ge,S0=[st,at,$u,Tu,Eu,Cu,zu,Ou,Au,Ru,Mu,Bu,Nu,Pu,Du,Uu,Ju,el,tl,sl,al,ol,ul,ll,dl];(async function(){function d(v,$){return ge=v.exports,ge=function(){var C=ge,D={};for(let[j,ne]of Object.entries(C))D[j]=typeof ne=="function"?(...he)=>{mi.push(j);try{return ne(...he)}finally{Me||(mi.pop(),Ht&&br===1&&mi.length===0&&(br=0,Re+=1,hi($l),typeof Fibers<"u"&&Fibers.sc()))}}:ne;return D}(),ge=function(){var C=ge,D=ne=>he=>ne(he)>>>0,j=ne=>()=>ne()>>>0;return(C=Object.assign({},C)).Ea=D(C.Ea),C.gb=j(C.gb),C.ib=D(C.ib),C.ub=D(C.ub),C.vb=j(C.vb),C.__cxa_get_exception_ptr=D(C.__cxa_get_exception_ptr),C}(),vn.push(ge.jb),O=$,F(),ge}L++;var f=re();if(i.instantiateWasm)return new Promise(v=>{i.instantiateWasm(f,($,C)=>{d($,C),v($.exports)})});if(l)return new Promise(v=>{de=$=>{var C=new WebAssembly.Instance($,re());v(d(C,$))}});A??(A=i.locateFile?i.locateFile?i.locateFile("ort-wasm-simd-threaded.jsep.wasm",w):w+"ort-wasm-simd-threaded.jsep.wasm":new URL("/assets/ort-wasm-simd-threaded.jsep-CLPRrI3A.wasm",import.meta.url).href);try{var g=await async function(v){var $=A;if(!ce&&typeof WebAssembly.instantiateStreaming=="function"&&!P($))try{var C=fetch($,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(C,v)}catch(D){I(`wasm streaming compile failed: ${D}`),I("falling back to ArrayBuffer instantiation")}return async function(D,j){try{var ne=await async function(he){if(!ce)try{var Ee=await m(he);return new Uint8Array(Ee)}catch{}if(he==A&&ce)he=new Uint8Array(ce);else{if(!_)throw"both async and sync fetching of the wasm failed";he=_(he)}return he}(D);return await WebAssembly.instantiate(ne,j)}catch(he){I(`failed to asynchronously prepare wasm: ${he}`),te(he)}}($,v)}(f);return d(g.instance,g.module)}catch(v){return s(v),Promise.reject(v)}})();var pl=d=>(pl=ge.Ea)(d),fl=()=>(fl=ge.Fa)();i._OrtInit=(d,f)=>(i._OrtInit=ge.Ga)(d,f),i._OrtGetLastError=(d,f)=>(i._OrtGetLastError=ge.Ha)(d,f),i._OrtCreateSessionOptions=(d,f,g,v,$,C,D,j,ne,he)=>(i._OrtCreateSessionOptions=ge.Ia)(d,f,g,v,$,C,D,j,ne,he),i._OrtAppendExecutionProvider=(d,f,g,v,$)=>(i._OrtAppendExecutionProvider=ge.Ja)(d,f,g,v,$),i._OrtAddFreeDimensionOverride=(d,f,g)=>(i._OrtAddFreeDimensionOverride=ge.Ka)(d,f,g),i._OrtAddSessionConfigEntry=(d,f,g)=>(i._OrtAddSessionConfigEntry=ge.La)(d,f,g),i._OrtReleaseSessionOptions=d=>(i._OrtReleaseSessionOptions=ge.Ma)(d),i._OrtCreateSession=(d,f,g)=>(i._OrtCreateSession=ge.Na)(d,f,g),i._OrtReleaseSession=d=>(i._OrtReleaseSession=ge.Oa)(d),i._OrtGetInputOutputCount=(d,f,g)=>(i._OrtGetInputOutputCount=ge.Pa)(d,f,g),i._OrtGetInputOutputMetadata=(d,f,g,v)=>(i._OrtGetInputOutputMetadata=ge.Qa)(d,f,g,v),i._OrtFree=d=>(i._OrtFree=ge.Ra)(d),i._OrtCreateTensor=(d,f,g,v,$,C)=>(i._OrtCreateTensor=ge.Sa)(d,f,g,v,$,C),i._OrtGetTensorData=(d,f,g,v,$)=>(i._OrtGetTensorData=ge.Ta)(d,f,g,v,$),i._OrtReleaseTensor=d=>(i._OrtReleaseTensor=ge.Ua)(d),i._OrtCreateRunOptions=(d,f,g,v)=>(i._OrtCreateRunOptions=ge.Va)(d,f,g,v),i._OrtAddRunConfigEntry=(d,f,g)=>(i._OrtAddRunConfigEntry=ge.Wa)(d,f,g),i._OrtReleaseRunOptions=d=>(i._OrtReleaseRunOptions=ge.Xa)(d),i._OrtCreateBinding=d=>(i._OrtCreateBinding=ge.Ya)(d),i._OrtBindInput=(d,f,g)=>(i._OrtBindInput=ge.Za)(d,f,g),i._OrtBindOutput=(d,f,g,v)=>(i._OrtBindOutput=ge._a)(d,f,g,v),i._OrtClearBoundOutputs=d=>(i._OrtClearBoundOutputs=ge.$a)(d),i._OrtReleaseBinding=d=>(i._OrtReleaseBinding=ge.ab)(d),i._OrtRunWithBinding=(d,f,g,v,$)=>(i._OrtRunWithBinding=ge.bb)(d,f,g,v,$),i._OrtRun=(d,f,g,v,$,C,D,j)=>(i._OrtRun=ge.cb)(d,f,g,v,$,C,D,j),i._OrtEndProfiling=d=>(i._OrtEndProfiling=ge.db)(d),i._JsepOutput=(d,f,g)=>(i._JsepOutput=ge.eb)(d,f,g),i._JsepGetNodeName=d=>(i._JsepGetNodeName=ge.fb)(d);var wi=()=>(wi=ge.gb)(),Gt=i._free=d=>(Gt=i._free=ge.hb)(d),vi=i._malloc=d=>(vi=i._malloc=ge.ib)(d),Cs=(d,f,g,v,$,C)=>(Cs=ge.lb)(d,f,g,v,$,C),hl=()=>(hl=ge.mb)(),ml=(d,f,g,v,$)=>(ml=ge.nb)(d,f,g,v,$),gl=d=>(gl=ge.ob)(d),zs=d=>(zs=ge.pb)(d),_l=(d,f)=>(_l=ge.qb)(d,f),bl=()=>(bl=ge.rb)(),yl=(d,f)=>(yl=ge.sb)(d,f),$i=d=>($i=ge.tb)(d),Os=d=>(Os=ge.ub)(d),As=()=>(As=ge.vb)(),wl=i.dynCall_ii=(d,f)=>(wl=i.dynCall_ii=ge.wb)(d,f),vl=d=>(vl=ge.xb)(d),$l=()=>($l=ge.yb)(),xl=d=>(xl=ge.zb)(d),Sl=()=>(Sl=ge.Ab)();return i.stackSave=()=>As(),i.stackRestore=d=>$i(d),i.stackAlloc=d=>Os(d),i.setValue=function(d,f,g="i8"){switch(g.endsWith("*")&&(g="*"),g){case"i1":case"i8":V()[d>>>0]=f;break;case"i16":_e()[d>>>1>>>0]=f;break;case"i32":W()[d>>>2>>>0]=f;break;case"i64":X[d>>>3]=BigInt(f);break;case"float":oe()[d>>>2>>>0]=f;break;case"double":Y()[d>>>3>>>0]=f;break;case"*":N()[d>>>2>>>0]=f;break;default:te(`invalid type for setValue: ${g}`)}},i.getValue=function(d,f="i8"){switch(f.endsWith("*")&&(f="*"),f){case"i1":case"i8":return V()[d>>>0];case"i16":return _e()[d>>>1>>>0];case"i32":return W()[d>>>2>>>0];case"i64":return X[d>>>3];case"float":return oe()[d>>>2>>>0];case"double":return Y()[d>>>3>>>0];case"*":return N()[d>>>2>>>0];default:te(`invalid type for getValue: ${f}`)}},i.UTF8ToString=Je,i.stringToUTF8=rn,i.lengthBytesUTF8=Iu,function d(){if(0<L)q=d;else if(l)n(i),E();else{for(;0<xe.length;)xe.shift()(i);0<L?q=d:(i.calledRun=!0,Me||(E(),n(i)))}}(),i.PTR_SIZE=4,a}),Hm=ea,yd=(t=(e=globalThis.self)==null?void 0:e.name)==null?void 0:t.startsWith("em-pthread"),yd&&ea()}),ta,uo,wd,$t,Gm,Ei,vd,$d,ra,xd,na,jm,ia,Km,Qo=K(()=>{Ko(),ta=typeof location>"u"?void 0:location.origin,uo=import.meta.url>"file:"&&import.meta.url<"file;",wd=()=>{{if(uo){let e=URL;return new URL(new e("ort.webgpu.bundle.min.mjs",import.meta.url).href,ta).href}return import.meta.url}},$t=wd(),Gm=()=>{if($t&&!$t.startsWith("blob:"))return $t.substring(0,$t.lastIndexOf("/")+1)},Ei=(e,t)=>{try{let r=t??$t;return(r?new URL(e,r):new URL(e)).origin===ta}catch{return!1}},vd=(e,t)=>{let r=t??$t;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},$d=(e,t)=>`${t??"./"}${e}`,ra=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},xd=async e=>(await import(e)).default,na=(p1(),ui(qm)).default,jm=async()=>{if(!$t)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(Ei($t))return[void 0,na()];let e=await ra($t);return[e,na(e)]},ia=(f1(),ui(Vm)).default,Km=async(e,t,r)=>{if(!e&&!t&&ia&&$t&&Ei($t))return[void 0,ia];{let n="ort-wasm-simd-threaded.jsep.mjs",s=e??vd(n,t),i=r&&s&&!Ei(s,t),a=i?await ra(s):s??$d(n,t);return[i?a:void 0,await xd(a)]}}}),sa,Ii,Cn,aa,Sd,kd,Td,Zo,Fe,en=K(()=>{Qo(),Ii=!1,Cn=!1,aa=!1,Sd=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},kd=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},Td=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Zo=async e=>{if(Ii)return Promise.resolve();if(Cn)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(aa)throw new Error("previous call to 'initializeWebAssembly()' failed.");Cn=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!Td())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!kd())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let n=Sd();r>1&&!n&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let s=e.wasmPaths,i=typeof s=="string"?s:void 0,a=s==null?void 0:s.mjs,o=(a==null?void 0:a.href)??a,u=s==null?void 0:s.wasm,l=(u==null?void 0:u.href)??u,c=e.wasmBinary,[p,h]=await Km(o,i,r>1),m=!1,_=[];if(t>0&&_.push(new Promise(b=>{setTimeout(()=>{m=!0,b()},t)})),_.push(new Promise((b,x)=>{let w={numThreads:r};if(c)w.wasmBinary=c;else if(l||i)w.locateFile=y=>l??i+y;else if(o&&o.indexOf("blob:")!==0)w.locateFile=y=>new URL(y,o).href;else if(p){let y=Gm();y&&(w.locateFile=k=>y+k)}h(w).then(y=>{Cn=!1,Ii=!0,sa=y,b(),p&&URL.revokeObjectURL(p)},y=>{Cn=!1,aa=!0,x(y)})})),await Promise.race(_),m)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},Fe=()=>{if(Ii&&sa)return sa;throw new Error("WebAssembly is not initialized yet.")}}),Pt,Ji,De,Xo=K(()=>{en(),Pt=(e,t)=>{let r=Fe(),n=r.lengthBytesUTF8(e)+1,s=r._malloc(n);return r.stringToUTF8(e,s,n),t.push(s),s},Ji=(e,t,r,n)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([s,i])=>{let a=t?t+s:s;if(typeof i=="object")Ji(i,a+".",r,n);else if(typeof i=="string"||typeof i=="number")n(a,i.toString());else if(typeof i=="boolean")n(a,i?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof i}`)})},De=e=>{let t=Fe(),r=t.stackSave();try{let n=t.PTR_SIZE,s=t.stackAlloc(2*n);t._OrtGetLastError(s,s+n);let i=Number(t.getValue(s,n===4?"i32":"i64")),a=t.getValue(s+n,"*"),o=a?t.UTF8ToString(a):"";throw new Error(`${e} ERROR_CODE: ${i}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),Qm,h1=K(()=>{en(),Xo(),Qm=e=>{let t=Fe(),r=0,n=[],s=e||{};try{if((e==null?void 0:e.logSeverityLevel)===void 0)s.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log serverity level is not valid: ${e.logSeverityLevel}`);if((e==null?void 0:e.logVerbosityLevel)===void 0)s.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);(e==null?void 0:e.terminate)===void 0&&(s.terminate=!1);let i=0;return(e==null?void 0:e.tag)!==void 0&&(i=Pt(e.tag,n)),r=t._OrtCreateRunOptions(s.logSeverityLevel,s.logVerbosityLevel,!!s.terminate,i),r===0&&De("Can't create run options."),(e==null?void 0:e.extra)!==void 0&&Ji(e.extra,"",new WeakSet,(a,o)=>{let u=Pt(a,n),l=Pt(o,n);t._OrtAddRunConfigEntry(r,u,l)!==0&&De(`Can't set a run config entry: ${a} - ${o}.`)}),[r,n]}catch(i){throw r!==0&&t._OrtReleaseRunOptions(r),n.forEach(a=>t._free(a)),i}}}),Ed,Id,Cd,zn,zd,Zm,m1=K(()=>{en(),Xo(),Ed=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},Id=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},Cd=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},zn=(e,t,r,n)=>{let s=Pt(t,n),i=Pt(r,n);Fe()._OrtAddSessionConfigEntry(e,s,i)!==0&&De(`Can't set a session config entry: ${t} - ${r}.`)},zd=async(e,t,r)=>{for(let n of t){let s=typeof n=="string"?n:n.name,i=[];switch(s){case"webnn":if(s="WEBNN",typeof n!="string"){let c=n==null?void 0:n.deviceType;c&&zn(e,"deviceType",c,r)}break;case"webgpu":if(s="JS",typeof n!="string"){let c=n;if(c!=null&&c.preferredLayout){if(c.preferredLayout!=="NCHW"&&c.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${c.preferredLayout}`);zn(e,"preferredLayout",c.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${s}`)}let a=Pt(s,r),o=i.length,u=0,l=0;if(o>0){u=Fe()._malloc(o*Fe().PTR_SIZE),r.push(u),l=Fe()._malloc(o*Fe().PTR_SIZE),r.push(l);for(let c=0;c<o;c++)Fe().setValue(u+c*Fe().PTR_SIZE,i[c][0],"*"),Fe().setValue(l+c*Fe().PTR_SIZE,i[c][1],"*")}await Fe()._OrtAppendExecutionProvider(e,a,u,l,o)!==0&&De(`Can't append execution provider: ${s}.`)}},Zm=async e=>{let t=Fe(),r=0,n=[],s=e||{};Cd(s);try{let i=Ed(s.graphOptimizationLevel??"all"),a=Id(s.executionMode??"sequential"),o=typeof s.logId=="string"?Pt(s.logId,n):0,u=s.logSeverityLevel??2;if(!Number.isInteger(u)||u<0||u>4)throw new Error(`log serverity level is not valid: ${u}`);let l=s.logVerbosityLevel??0;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log verbosity level is not valid: ${l}`);let c=typeof s.optimizedModelFilePath=="string"?Pt(s.optimizedModelFilePath,n):0;if(r=t._OrtCreateSessionOptions(i,!!s.enableCpuMemArena,!!s.enableMemPattern,a,!!s.enableProfiling,0,o,u,l,c),r===0&&De("Can't create session options."),s.executionProviders&&await zd(r,s.executionProviders,n),s.enableGraphCapture!==void 0){if(typeof s.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${s.enableGraphCapture}`);zn(r,"enableGraphCapture",s.enableGraphCapture.toString(),n)}if(s.freeDimensionOverrides)for(let[p,h]of Object.entries(s.freeDimensionOverrides)){if(typeof p!="string")throw new Error(`free dimension override name must be a string: ${p}`);if(typeof h!="number"||!Number.isInteger(h)||h<0)throw new Error(`free dimension override value must be a non-negative integer: ${h}`);let m=Pt(p,n);t._OrtAddFreeDimensionOverride(r,m,h)!==0&&De(`Can't set a free dimension override: ${p} - ${h}.`)}return s.extra!==void 0&&Ji(s.extra,"",new WeakSet,(p,h)=>{zn(r,p,h,n)}),[r,n]}catch(i){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&De("Can't release session options."),n.forEach(a=>t._free(a)),i}}}),Vr,pr,Hr,gs,es,Yo,Jo,lo,ve=K(()=>{Vr=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},pr=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Hr=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],n=typeof t=="number"?t:t.reduce((s,i)=>s*i,1);return r>0?Math.ceil(n*r):void 0},gs=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},es=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Yo=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Jo=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",lo=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),eu,Xm=K(()=>{Ko(),eu=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),n=r?parseInt(r,10):0;if(n<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let s=t.body.getReader(),i;try{i=new ArrayBuffer(n)}catch(o){if(o instanceof RangeError){let u=Math.ceil(n/65536);i=new WebAssembly.Memory({initial:u,maximum:u}).buffer}else throw o}let a=0;for(;;){let{done:o,value:u}=await s.read();if(o)break;let l=u.byteLength;new Uint8Array(i,a,l).set(u),a+=l}return new Uint8Array(i,0,n)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),Od,Ad,Rd,Md,tu,Bd,Ae,mr=K(()=>{ve(),Od=["V","I","W","E","F"],Ad=(e,t)=>{console.log(`[${Od[e]},${new Date().toISOString()}]${t}`)},tu=(e,t)=>{Rd=e,Md=t},Bd=(e,t)=>{let r=es(e),n=es(Rd);r>=n&&Ad(r,typeof t=="function"?t():t)},Ae=(...e)=>{Md&&Bd(...e)}}),Nd,bn,M,ts,Ym,Jm,eg,Se=K(()=>{Nd=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},bn=class{static calcShape(e,t,r=!1){let n=e.length,s=t.length;if(n===0)return t;if(s===0)return e;let i=Math.max(e.length,t.length),a=new Array(i);if(r){if(n<2||s<2)return;let o=Nd.calcMatMulShape([e[n-2],e[n-1]],[t[s-2],t[s-1]]);if(o===void 0)return;[a[i-2],a[i-1]]=o}for(let o=r?3:1;o<=i;o++){let u=n-o<0?1:e[n-o],l=s-o<0?1:t[s-o];if(u!==l&&u>1&&l>1)return;let c=Math.max(u,l);if(u&&l)a[i-o]=Math.max(u,l);else{if(c>1)return;a[i-o]=0}}return a}static isValidBroadcast(e,t){let r=e.length,n=t.length;if(r>n)return!1;for(let s=1;s<=r;s++)if(e[r-s]!==1&&e[r-s]!==t[n-s])return!1;return!0}},M=class Fi{static size(t){return Fi.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let n=t.length;if(n===0)return[];let s=new Array(n),i=n-1;for(;i>=0;){if(t[i]%r===0){s[i]=t[i]/r;break}if(r%t[i]!==0)throw new Error("cannot convert shape");s[i]=1,r/=t[i],i--}for(i--;i>=0;i--)s[i]=t[i];return s}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Fi.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Fi.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,n){let s=1;for(let i=r;i<n;i++){if(t[i]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");s*=Number(t[i])}return s}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let n=new Array(r);n[r-1]=1,n[r-2]=t[r-1];for(let s=r-3;s>=0;--s)n[s]=n[s+1]*t[s+1];return n}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(n=>this.normalizeAxis(n,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(n=>t[n]):t.slice().reverse()}static padShape(t,r){let n=t.length;return t.map((s,i)=>s+r[i]+r[i+n])}static areEqual(t,r){return t.length!==r.length?!1:t.every((n,s)=>n===r[s])}},ts=class Ln{static adjustPoolAttributes(t,r,n,s,i,a){if(!t&&n.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=n.length?n.push(r[o+2]):n[o]=r[o+2];for(let o=0;o<n.length;o++)if(o<s.length){if(s[o]<0)throw new Error("strides should be greater than or equal to 1")}else s.push(1);for(let o=0;o<n.length;o++)if(o<i.length){if(i[o]<0)throw new Error("dilations should be greater than or equal to 1")}else i.push(1);for(let o=0;o<n.length*2;o++)if(o<a.length){if(a[o]<0)throw new Error("pad should be greater than or equal to 1")}else a.push(0);for(let o=0;o<n.length;o++){if(n[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(a[o]>=n[o]||a[o+n.length]>=n[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,n,s,i,a,o){if(o){if(i.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(s.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)Ln.adjustPadAndReturnShape(t[u+(a?1:2)],r[u],n[u],s[u],i,u,u+t.length-2,o)}}static computePoolOutputShape(t,r,n,s,i,a,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let u=[r[0],r[1]];return Ln.computeShapeHelper(t,r,u,n,s,i,a,o),u}static computeConvOutputShape(t,r,n,s,i,a,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],r[0]];return Ln.computeShapeHelper(!1,t,u,n,s,i,a,o),u}static computeShapeHelper(t,r,n,s,i,a,o,u){if(t)for(let l=0;l<r.length-2;l++)n.push(1);else for(let l=0;l<r.length-2;l++)n.push(Ln.adjustPadAndReturnShape(r[l+2],s[l],i[l],a[l],o,l,l+r.length-2,u))}static adjustPadAndReturnShape(t,r,n,s,i,a,o,u){let l=n*(s-1)+1;if(u&&u!=="NOTSET")switch(u){case"VALID":return i[a]=0,i[o]=0,Math.floor((t-l)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(n!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let c=((t+r-1)/r-1)*r+s-t;return i[a]=Math.floor(u==="SAME_LOWER"?(c+1)/2:c/2),i[o]=c-i[a],Math.floor((t+c-s)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+i[a]+i[o]-l)/r+1)}},Ym=class{static getShapeOfGemmResult(e,t,r,n,s){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let i,a,o;t?(i=e[1],a=e[0]):(i=e[0],a=e[1]);let u=-1;if(n?(o=r[0],u=1):(o=r[1],u=0),r[u]!==a)throw new Error("dimension mismatch");if(i<=0||o<=0||a<=0)throw new Error("invalid shape specified");if(s&&!bn.isValidBroadcast(s,[i,o]))throw new Error("gemm: invalid bias shape for broadcast");return[i,o,a]}},Jm=-34028234663852886e22,eg=34028234663852886e22}),ru,tg=K(()=>{ve(),ru=(e,t)=>new(gs(t))(e)}),oa,co,ua,Pd,la,Dd,da,ca,pa,Ud,rg,g1=K(()=>{ve(),mr(),oa=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),co=(e,t)=>{if(t==="int32")return e;let r=oa.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let n=r/8;if(e.byteLength%n!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${n}.`);let s=e.byteLength/n,i=new(gs(t))(e.buffer,e.byteOffset,s);switch(t){case"int64":case"uint64":{let a=new Int32Array(s);for(let o=0;o<s;o++){let u=i[o];if(u>2147483647n||u<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");a[o]=Number(u)}return new Uint8Array(a.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&i.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let a=Int32Array.from(i,Number);return new Uint8Array(a.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},ua=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,n=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let s=BigInt64Array.from(n,BigInt);return new Uint8Array(s.buffer)}case"uint64":{if(n.some(i=>i<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let s=BigUint64Array.from(n,BigInt);return new Uint8Array(s.buffer)}case"int8":{if(n.some(i=>i<-128||i>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let s=Int8Array.from(n,Number);return new Uint8Array(s.buffer)}case"uint8":{if(n.some(s=>s<0||s>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(n,Number)}case"uint32":{if(n.some(i=>i<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let s=Uint32Array.from(n,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Pd=1,la=()=>Pd++,Dd=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),da=(e,t)=>{let r=oa.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((n,s)=>n*s)*r/8):0},ca=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:n,dataType:s,shape:i,fallbackDataType:a}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=n,this.dataType=s,this.tensorShape=i,this.fallbackDataType=a}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return da(this.dataType,this.tensorShape)}destroy(){Ae("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=ua(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return r.buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((n,s)=>n===r[s])}setIsDataConverted(e){this.isDataConverted=e}},pa=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,n){let s=this.tensorManager.getMLContext(e),i;if(!s.opSupportLimits().input.dataTypes.includes(t)){if(i=Dd.get(t),!i||!s.opSupportLimits().input.dataTypes.includes(i))throw new Error(`WebNN backend does not support data type: ${t}`);Ae("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${i}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(s,t,r))return this.wrapper.tensor;if(n){if(this.wrapper.byteLength!==da(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let a=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,a,!0,!0,i),n&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=co(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else Ae("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){var t,r;if(this.activeUpload){let n=(t=this.wrapper)!=null&&t.isDataConverted?ua(this.activeUpload,(r=this.wrapper)==null?void 0:r.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(n):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(n);return}else return n.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},Ud=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}reserveTensorId(){let e=la();return this.tensorTrackersById.set(e,new pa(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,n,s){Ae("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${n}, copyOld: ${s}}`);let i=this.tensorTrackersById.get(t);if(!i)throw new Error("Tensor not found.");return i.ensureTensor(e,r,n,s)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){Ae("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t==null?void 0:t.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,n){let s=this.getMLContext(e),i=la(),a=new ca({sessionId:e,context:s,tensor:t,dataType:r,shape:n});return this.tensorTrackersById.set(i,new pa(this,a)),this.externalTensors.add(a),i}async getCachedTensor(e,t,r,n,s,i,a){let o=this.getMLContext(e);for(let[l,c]of this.freeTensors.entries())if(c.canReuseTensor(o,t,r)){Ae("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${a?`fallbackDataType: ${a},`:""} shape: ${r}`);let p=this.freeTensors.splice(l,1)[0];return p.sessionId=e,p}Ae("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${a?`fallbackDataType: ${a},`:""} shape: ${r}}`);let u=await o.createTensor({dataType:a??t,shape:r,dimensions:r,usage:n,writable:s,readable:i});return new ca({sessionId:e,context:o,tensor:u,dataType:t,shape:r,fallbackDataType:a})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},rg=(...e)=>new Ud(...e)}),On,Wd,ng,_1=K(()=>{ve(),en(),tg(),g1(),mr(),On=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Wd=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),n=Object.keys(t).sort();return r.length===n.length&&r.every((s,i)=>s===n[i]&&e[s]===t[s])},ng=class{constructor(e){this.tensorManager=rg(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,tu(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){Ae("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){Ae("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)Ae("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(n=>n.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let n=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:n}),n}}else if(e===void 0){let r=this.mlContextCache.findIndex(n=>n.options===void 0&&n.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let n=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:n}),n}}let t=this.mlContextCache.findIndex(r=>Wd(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let n=this.mlContextCache.findIndex(s=>s.mlContext===t);n!==-1&&this.mlContextCache.splice(n,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){Ae("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,n,s){let i=On.get(r);if(!i)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,i,n,s)}async createTemporaryTensor(e,t,r){Ae("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let n=On.get(t);if(!n)throw new Error(`Unsupported ONNX data type: ${t}`);let s=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,s,n,r,!1);let i=this.temporarySessionTensorIds.get(e);return i?i.push(s):this.temporarySessionTensorIds.set(e,[s]),s}uploadTensor(e,t){if(!Fe().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");Ae("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return ru(r,t)}}registerMLTensor(e,t,r,n){let s=On.get(r);if(!s)throw new Error(`Unsupported ONNX data type: ${r}`);let i=this.tensorManager.registerTensor(e,t,s,n);return Ae("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${s}, dimensions: ${n}} -> {tensorId: ${i}}`),i}registerMLConstant(e,t,r,n,s,i,a=!1){if(!i)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let u=i.get(o);if(!u)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>u.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let l=u.slice(t,t+r).buffer,c;switch(s.dataType){case"float32":c=new Float32Array(l);break;case"float16":c=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(l):new Uint16Array(l);break;case"int32":c=new Int32Array(l);break;case"uint32":c=new Uint32Array(l);break;case"int64":if(a){let p=co(new Uint8Array(l),"int64");c=new Int32Array(p.buffer),s.dataType="int32"}else c=new BigInt64Array(l);break;case"uint64":c=new BigUint64Array(l);break;case"int8":c=new Int8Array(l);break;case"int4":case"uint4":case"uint8":c=new Uint8Array(l);break;default:throw new Error(`Unsupported data type: ${s.dataType} in creating WebNN Constant from external data.`)}return Ae("verbose",()=>`[WebNN] registerMLConstant {dataType: ${s.dataType}, shape: ${s.shape}}} ${a?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),n.constant(s,c)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let n=this.mlContextBySessionId.get(e),s=On.get(Vr(t));return typeof s>"u"?!1:r?!!(n!=null&&n.opSupportLimits().input.dataTypes.includes(s)):!!(n!=null&&n.opSupportLimits().output.dataTypes.includes(s))}flush(){}}}),nu=K(()=>{}),fa,Ci,zi,Ld,qd,ha,po,Fd,ig,b1=K(()=>{mr(),nu(),fa=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Ci=[],zi=e=>Math.ceil(Number(e)/16)*16,Ld=e=>{for(let t=0;t<Ci.length;t++){let r=Ci[t];if(e<=r)return r}return Math.ceil(e/16)*16},qd=1,ha=()=>qd++,po=async(e,t,r,n)=>{let s=zi(r),i=e.device.createBuffer({size:s,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let a=e.getCommandEncoder();e.endComputePass(),a.copyBufferToBuffer(t,0,i,0,s),e.flush(),await i.mapAsync(GPUMapMode.READ);let o=i.getMappedRange();if(n){let u=n();return u.set(new Uint8Array(o,0,r)),u}else return new Uint8Array(o.slice(0,r))}finally{i.destroy()}},Fd=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of fa)Ci.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,n=t.byteOffset,s=t.byteLength,i=zi(s),a=this.storageCache.get(e);if(!a)throw new Error("gpu data for uploading does not exist");if(Number(a.originalSize)!==s)throw new Error(`inconsistent data size. gpu data size=${a.originalSize}, data size=${s}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:i,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),u=o.getMappedRange();new Uint8Array(u).set(new Uint8Array(r,n,s)),o.unmap();let l=this.backend.device.createCommandEncoder();l.copyBufferToBuffer(o,0,a.gpuData.buffer,0,i),this.backend.device.queue.submit([l.finish()]),o.destroy(),Ae("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let n=this.storageCache.get(t);if(!n)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==n.originalSize)throw new Error("inconsistent source and destination gpu data size");let s=zi(r.originalSize),i=this.backend.getCommandEncoder();this.backend.endComputePass(),i.copyBufferToBuffer(r.gpuData.buffer,0,n.gpuData.buffer,0,s)}registerExternalBuffer(e,t,r){let n;if(r){if(n=r[0],e===r[1])return Ae("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${n}, buffer is the same, skip.`),n;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else n=ha();return this.storageCache.set(n,{gpuData:{id:n,type:0,buffer:e},originalSize:t}),Ae("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${n}, registered.`),n}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),Ae("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=Ld(e),n,s=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,i=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(s||i){let o=(s?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?n=o.pop():n=this.backend.device.createBuffer({size:r,usage:t}):n=this.backend.device.createBuffer({size:r,usage:t})}else n=this.backend.device.createBuffer({size:r,usage:t});let a={id:ha(),type:0,buffer:n};return this.storageCache.set(a.id,{gpuData:a,originalSize:Number(e)}),Ae("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${a.id}`),a}get(e){var t;return(t=this.storageCache.get(e))==null?void 0:t.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return Ae("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await po(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=fa.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(Ae("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},ig=(...e)=>new Fd(...e)}),Vd,Pe,Ze=K(()=>{Vd=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},Pe=e=>new Vd(e)}),yn,Oi,rt,ut,me,Ke,fo,dn,Or,fe,An,U,pe,sg,iu,Hd,ag,Te=K(()=>{ve(),Se(),yn=64,Oi=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},rt=(e,t=1)=>{let r=Oi(e,t);return typeof r=="string"?r:r[0]},ut=(e,t=1)=>{let r=Oi(e,t);return typeof r=="string"?r:r[1]},me=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:M.computeStrides(r)})}),t},Ke=e=>e%4===0?4:e%2===0?2:1,fo=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,dn=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,Or=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,fe=(e,t,r,n)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?n==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:n==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,An=(e,t,r,n,s)=>{let i=typeof r=="number",a=i?r:r.length,o=[...new Array(a).keys()],u=a<2?"u32":a<=4?`vec${a}<u32>`:`array<u32, ${a}>`,l=Oi(t,s),c=typeof l=="string"?l:l[1],p=typeof l=="string"?l:l[0],h={indices:u,value:c,storage:p,tensor:t},m=P=>typeof P=="string"?P:`${P}u`,_={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},b=i?"uniforms.":"",x=`${b}${e}_shape`,w=`${b}${e}_strides`,y="";for(let P=0;P<a-1;P++)y+=`
    let dim${P} = current / ${fe(w,P,a)};
    let rest${P} = current % ${fe(w,P,a)};
    indices[${P}] = dim${P};
    current = rest${P};
    `;y+=`indices[${a-1}] = current;`;let k=a<2?"":`
  fn o2i_${e}(offset: u32) -> ${h.indices} {
    var indices: ${h.indices};
    var current = offset;
    ${y}
    return indices;
  }`,S=P=>(_.offsetToIndices=!0,a<2?P:`o2i_${e}(${P})`),I=[];if(a>=2)for(let P=a-1;P>=0;P--)I.push(`${fe(w,P,a)} * (indices[${P}])`);let z=a<2?"":`
  fn i2o_${e}(indices: ${h.indices}) -> u32 {
    return ${I.join("+")};
  }`,O=P=>(_.indicesToOffset=!0,a<2?P:`i2o_${e}(${P})`),R=(...P)=>a===0?"0u":`${h.indices}(${P.map(m).join(",")})`,B=(P,V)=>a<2?`${P}`:`${fe(P,V,a)}`,G=(P,V,J)=>a<2?`${P}=${J};`:`${fe(P,V,a)}=${J};`,le={},ie=(P,V)=>{_.broadcastedIndicesToOffset=!0;let J=`${V.name}broadcastedIndicesTo${e}Offset`;if(J in le)return`${J}(${P})`;let _e=[];for(let Xe=a-1;Xe>=0;Xe--){let W=V.indicesGet("outputIndices",Xe+V.rank-a);_e.push(`${B(w,Xe)} * (${W} % ${B(x,Xe)})`)}return le[J]=`fn ${J}(outputIndices: ${V.type.indices}) -> u32 {
             return ${_e.length>0?_e.join("+"):"0u"};
           }`,`${J}(${P})`},ae=(P,V)=>(()=>{if(h.storage===h.value)return`${e}[${P}]=${V};`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`${e}[${P}]=vec2<u32>(u32(${V}), select(0u, 0xFFFFFFFFu, ${V} < 0));`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`${e}[${P}]=vec2<u32>(u32(${V}), 0u);`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`${e}[${P}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${V}));`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),ke=P=>(()=>{if(h.storage===h.value)return`${e}[${P}]`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`i32(${e}[${P}].x)`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`u32(${e}[${P}].x)`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${P}] & 0xFFu), bool(${e}[${P}] & 0xFF00u), bool(${e}[${P}] & 0xFF0000u), bool(${e}[${P}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),be=a<2?"":`
  fn get_${e}ByIndices(indices: ${h.indices}) -> ${c} {
    return ${ke(`i2o_${e}(indices)`)};
  }`,X=a<2?"":(()=>{let P=o.map(J=>`d${J}: u32`).join(", "),V=o.map(J=>`d${J}`).join(", ");return`
  fn get_${e}(${P}) -> ${c} {
    return get_${e}ByIndices(${R(V)});
  }`})(),se=(...P)=>{if(P.length!==a)throw new Error(`indices length must be ${a}`);let V=P.map(m).join(",");return a===0?ke("0u"):a===1?ke(V[0]):(_.get=!0,_.getByIndices=!0,_.indicesToOffset=!0,`get_${e}(${V})`)},Q=P=>a<2?ke(P):(_.getByIndices=!0,_.indicesToOffset=!0,`get_${e}ByIndices(${P})`),ce=a<2?"":`
  fn set_${e}ByIndices(indices: ${h.indices}, value: ${c}) {
    ${ae(`i2o_${e}(indices)`,"value")}
  }`,Me=a<2?"":(()=>{let P=o.map(J=>`d${J}: u32`).join(", "),V=o.map(J=>`d${J}`).join(", ");return`
  fn set_${e}(${P}, value: ${c}) {
    set_${e}ByIndices(${R(V)}, value);
  }`})();return{impl:()=>{let P=[],V=!1;return _.offsetToIndices&&(P.push(k),V=!0),_.indicesToOffset&&(P.push(z),V=!0),_.broadcastedIndicesToOffset&&(Object.values(le).forEach(J=>P.push(J)),V=!0),_.set&&(P.push(Me),V=!0),_.setByIndices&&(P.push(ce),V=!0),_.get&&(P.push(X),V=!0),_.getByIndices&&(P.push(be),V=!0),!i&&V&&P.unshift(`const ${x} = ${h.indices}(${r.join(",")});`,`const ${w} = ${h.indices}(${M.computeStrides(r).join(",")});`),P.join(`
`)},type:h,offsetToIndices:S,indicesToOffset:O,broadcastedIndicesToOffset:ie,indices:R,indicesGet:B,indicesSet:G,set:(...P)=>{if(P.length!==a+1)throw new Error(`indices length must be ${a}`);let V=P[a];if(typeof V!="string")throw new Error("value must be string");let J=P.slice(0,a).map(m).join(",");return a===0?ae("0u",V):a===1?ae(J[0],V):(_.set=!0,_.setByIndices=!0,_.indicesToOffset=!0,`set_${e}(${J}, ${V})`)},setByOffset:ae,setByIndices:(P,V)=>a<2?ae(P,V):(_.setByIndices=!0,_.indicesToOffset=!0,`set_${e}ByIndices(${P}, ${V});`),get:se,getByOffset:ke,getByIndices:Q,usage:n,name:e,strides:w,shape:x,rank:a}},U=(e,t,r,n=1)=>An(e,t,r,"input",n),pe=(e,t,r,n=1)=>An(e,t,r,"output",n),sg=(e,t,r)=>An(e,t,r,"atomicOutput",1),iu=(e,t,r,n=1)=>An(e,t,r,"internal",n),Hd=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=yn){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],n=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||n>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${n}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*n>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${n}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let s=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,i=s?`@builtin(global_invocation_id) global_id : vec3<u32>,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                             @builtin(local_invocation_id) local_id : vec3<u32>,
    @builtin(local_invocation_index) local_idx : u32,
    @builtin(workgroup_id) workgroup_id : vec3<u32>,
    @builtin(num_workgroups) num_workgroups : vec3<u32>`,a=s?`let global_idx = global_id.x;
         let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
             workgroup_id.y * num_workgroups[0] + workgroup_id.x;
         let global_idx = workgroup_index * ${t*r*n}u + local_idx;`;return`@compute @workgroup_size(${t}, ${r}, ${n})
  fn main(${i}) {
    ${a}
  `}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let r=e.usage==="input"?"read":"read_write",n=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${r}> ${e.name}: array<${n}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,r=1){return this.uniforms.push({name:e,type:t,length:r}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:r,length:n}of this.uniforms)if(n&&n>4)r==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${r}>, ${Math.ceil(n/8)}>`):e.push(`${t}:array<vec4<${r}>, ${Math.ceil(n/4)}>`);else{let s=n==null||n===1?r:`vec${n}<${r}>`;e.push(`${t}:${s}`)}return`
      struct Uniforms { ${e.join(", ")} };
      @group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},ag=(e,t)=>new Hd(e,t)}),Gd,ma,jd,Kd,Qd,Zd,It,og,ug,Br=K(()=>{ve(),Se(),Ze(),Te(),Gd=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},ma=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),jd=(e,t)=>M.sortBasedOnPerm(e,ma(e.length,t)),Kd=(e,t,r,n)=>{let s=`fn perm(i: ${n.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let i=0;i<t;++i)s+=`a[${e[i]}]=i[${i}];`;return s+="return a;}"},Qd=(e,t)=>{let r=[],n=[];for(let s=0;s<e.length;++s)e[s]!==1&&r.push(e[s]),e[t[s]]!==1&&n.push(t[s]);return{newShape:r,newPerm:n}},Zd=(e,t)=>{let r=0;for(let n=0;n<e.length;++n)if(t[e[n]]!==1){if(e[n]<r)return!1;r=e[n]}return!0},It=(e,t)=>{let r=e.dataType,n=e.dims.length,s=ma(n,t),i=jd(e.dims,s),a=e.dims,o=i,u=n<2||Zd(s,e.dims),l;if(u)return l=_=>{let b=U("input",r,a,4),x=pe("output",r,o,4);return`
  ${_.registerUniform("output_size","u32").declareVariables(b,x)}
  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let _=M.size(i);return{outputs:[{dims:i,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(_/64/4)},programUniforms:[{type:12,data:Math.ceil(_/4)}]}},getShaderSource:l};let{newShape:c,newPerm:p}=Qd(e.dims,s),h=M.areEqual(p,[2,3,1]),m=M.areEqual(p,[3,1,2]);if(c.length===2||h||m){a=h?[c[0],c[1]*c[2]]:m?[c[0]*c[1],c[2]]:c,o=[a[1],a[0]];let _=16;return l=b=>{let x=U("a",r,a.length),w=pe("output",r,o.length);return`
  ${b.registerUniform("output_size","u32").declareVariables(x,w)}
  var<workgroup> tile : array<array<${w.type.value}, ${_+1}>, ${_}>;
  ${b.mainStart([_,_,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${_} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${_}u + local_id.x;
    let input_row = workgroup_id_x * ${_}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${x.getByIndices(`${x.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${_}u + local_id.x;
    let output_row = workgroup_id_y * ${_}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${w.setByIndices(`${w.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let b=M.size(i);return{outputs:[{dims:i,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/_),y:Math.ceil(o[0]/_)},programUniforms:[{type:12,data:b},...me(a,o)]}},getShaderSource:l}}return l=_=>{let b=U("a",r,a.length),x=pe("output",r,o.length);return`
  ${_.registerUniform("output_size","u32").declareVariables(b,x)}

  ${Kd(s,n,b,x)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${x.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${x.setByOffset("global_idx",b.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let _=M.size(i);return{outputs:[{dims:i,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:[{type:12,data:_},...me(a,o)]}},getShaderSource:l}},og=(e,t)=>{Gd(e.inputs,t.perm),e.compute(It(e.inputs[0],t.perm))},ug=e=>Pe({perm:e.perm})}),Xd,Yd,Jd,ec,tc,rc,nc,ic,sc,ac,At,lg,dg,cg,pg,fg,hg,mg,gg,_g,bg,y1=K(()=>{ve(),Se(),Te(),su(),Br(),Xd={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Yd={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Jd={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},ec={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},tc=(e,t)=>{let r=[];for(let n=t-e;n<t;++n)r.push(n);return r},rc=(e,t)=>{let r=[],n=e.length;for(let i=0;i<n;i++)t.indexOf(i)===-1&&r.push(e[i]);let s=t.map(i=>e[i]);return[r,s]},nc=(e,t)=>{let r=e.length+t.length,n=[],s=0;for(let i=0;i<r;i++)t.indexOf(i)===-1?n.push(e[s++]):n.push(1);return n},ic=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},sc=(e,t)=>{let r=[];if(!ic(e,t)){for(let n=0;n<t;++n)e.indexOf(n)===-1&&r.push(n);e.forEach(n=>r.push(n))}return r},ac=(e,t,r,n,s,i,a)=>{let o=r[0].dims,u=M.size(i),l=M.size(a),c=U("_A",r[0].dataType,o),p=pe("output",s,i),h=64;u===1&&(h=256);let m=`
          var<workgroup> aBestValues : array<f32, ${h}>;
       `,_=b=>`
        ${b.registerUniform("reduceSize","u32").declareVariables(c,p)}
        ${m}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${b.mainStart(h)}

          let outputIndex = global_idx / ${h};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Jd[n]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${h}) {
           let candidate = f32(${c.getByOffset("offset + k")});
           bestValue = ${Xd[n]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${h}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Yd[n]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${p.setByOffset("outputIndex",`${n==="mean"?`${p.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${p.type.storage}(${ec[n]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${h}`,inputDependencies:["type"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:i,dataType:s}],dispatchGroup:{x:u},programUniforms:[{type:12,data:l}]})}},At=(e,t,r,n)=>{let s=e.inputs.length===1?r:ho(e.inputs,r),i=s.axes;i.length===0&&!s.noopWithEmptyAxes&&(i=e.inputs[0].dims.map((m,_)=>_));let a=M.normalizeAxes(i,e.inputs[0].dims.length),o=a,u=e.inputs[0],l=sc(o,e.inputs[0].dims.length);l.length>0&&(u=e.compute(It(e.inputs[0],l),{inputs:[0],outputs:[-1]})[0],o=tc(o.length,u.dims.length));let[c,p]=rc(u.dims,o),h=c;s.keepDims&&(h=nc(c,a)),e.compute(ac(t,s.cacheKey,[u],n,e.inputs[0].dataType,h,p),{inputs:[u]})},lg=(e,t)=>{At(e,"ReduceMeanShared",t,"mean")},dg=(e,t)=>{At(e,"ReduceL1Shared",t,"l1")},cg=(e,t)=>{At(e,"ReduceL2Shared",t,"l2")},pg=(e,t)=>{At(e,"ReduceLogSumExpShared",t,"logSumExp")},fg=(e,t)=>{At(e,"ReduceMaxShared",t,"max")},hg=(e,t)=>{At(e,"ReduceMinShared",t,"min")},mg=(e,t)=>{At(e,"ReduceProdShared",t,"prod")},gg=(e,t)=>{At(e,"ReduceSumShared",t,"sum")},_g=(e,t)=>{At(e,"ReduceSumSquareShared",t,"sumSquare")},bg=(e,t)=>{At(e,"ReduceLogSumShared",t,"logSum")}}),Rt,oc,rs,ho,Mt,uc,lc,dc,cc,pc,fc,hc,mc,gc,_c,Bt,yg,wg,vg,$g,xg,Sg,kg,Tg,Eg,Ig,su=K(()=>{ve(),Se(),Ze(),Te(),y1(),Rt=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},oc=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],rs=(e,t,r,n,s,i,a=!1,o=!1)=>{let u=[],l=r[0].dims,c=l.length,p=M.normalizeAxes(s,c),h=!o&&p.length===0;l.forEach((b,x)=>{h||p.indexOf(x)>=0?a&&u.push(1):u.push(b)});let m=u.length,_=M.size(u);return{name:e,shaderCache:t,getShaderSource:b=>{let x=[],w=U("_A",r[0].dataType,c),y=pe("output",i,m),k=n(w,y,p),S=k[2];for(let I=0,z=0;I<c;I++)h||p.indexOf(I)>=0?(a&&z++,S=`for(var j${I}: u32 = 0; j${I} < ${l[I]}; j${I}++) {
                  ${k[2].includes("last_index")?`let last_index = j${I};`:""}
                  ${w.indicesSet("input_indices",I,`j${I}`)}
                  ${S}
                }`):(x.push(`${w.indicesSet("input_indices",I,y.indicesGet("output_indices",z))};`),z++);return`

        ${b.registerUniform("output_size","u32").declareVariables(w,y)}

        ${b.mainStart()}
          ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${w.type.indices};
          let output_indices = ${y.offsetToIndices("global_idx")};

          ${x.join(`
`)}
          ${k[0]}       // init ops for reduce max/min
          ${k[1]}
          ${S}
          ${k[3]}
          ${k.length===4?y.setByOffset("global_idx","value"):k.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:u,dataType:i}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:[{type:12,data:_},...me(l,u)]})}},ho=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(n=>r.push(Number(n))),Pe({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Mt=(e,t,r,n)=>{let s=e.inputs,i=s.length===1?r:ho(s,r);e.compute(rs(t,{hint:i.cacheKey,inputDependencies:["rank"]},[s[0]],i.noopWithEmptyAxes&&i.axes.length===0?oc:n,i.axes,s[0].dataType,i.keepDims,i.noopWithEmptyAxes),{inputs:[0]})},uc=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceLogSum",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},lc=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceL1",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},dc=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceL2",t,(r,n)=>[`var t = ${n.type.value}(0); var value = ${n.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},cc=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceLogSumExp",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},pc=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceMax",t,(r,n,s)=>{let i=[];for(let a=0;a<r.rank;a++)(s.indexOf(a)>=0||s.length===0)&&i.push(r.indicesSet("input_indices",a,0));return[`${i.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},fc=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceMean",t,(r,n,s)=>{let i=1;for(let a=0;a<r.rank;a++)(s.indexOf(a)>=0||s.length===0)&&(i*=e.inputs[0].dims[a]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${n.type.value}(sum / ${i});`]})},hc=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceMin",t,(r,n,s)=>{let i=[];for(let a=0;a<r.rank;a++)(s.indexOf(a)>=0||s.length===0)&&i.push(`input_indices[${a}] = 0;`);return[`${i.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},mc=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceProd",t,(r,n)=>[`var value = ${n.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},gc=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceSum",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},_c=(e,t)=>{Rt(e.inputs),Mt(e,"ReduceSumSquare",t,(r,n)=>[`var t = ${n.type.value}(0); var value = ${n.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Bt=(e,t,r)=>{if(t.length===0)return r;let n=1,s=1;for(let i=0;i<t.length;i++)t.indexOf(i)===-1?n*=e[i]:s*=e[i];return s<32&&n>1024},yg=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?fc(e,t):lg(e,t)},wg=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?lc(e,t):dg(e,t)},vg=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?dc(e,t):cg(e,t)},$g=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?cc(e,t):pg(e,t)},xg=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?pc(e,t):fg(e,t)},Sg=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?hc(e,t):hg(e,t)},kg=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?mc(e,t):mg(e,t)},Tg=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?gc(e,t):gg(e,t)},Eg=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?_c(e,t):_g(e,t)},Ig=(e,t)=>{Bt(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?uc(e,t):bg(e,t)}}),ga,Cg,zg,mo,w1=K(()=>{ve(),Ze(),su(),ga=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},Cg=(e,t)=>{ga(e.inputs);let r=(n,s,i)=>{let a=[];for(let o=0;o<n.rank;o++)(i.indexOf(o)>=0||i.length===0)&&a.push(`input_indices[${o}] = 0;`);return[`${a.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${n.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${n.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",s.setByOffset("global_idx","best_index")]};e.compute(rs("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},zg=(e,t)=>{ga(e.inputs);let r=(n,s,i)=>{let a=[];for(let o=0;o<n.rank;o++)(i.indexOf(o)>=0||i.length===0)&&a.push(`input_indices[${o}] = 0;`);return[`${a.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${n.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${n.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",s.setByOffset("global_idx","best_index")]};e.compute(rs("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},mo=e=>Pe(e)}),bc,Ai,yc,wc,vc,li,$c,Og,au=K(()=>{ve(),Se(),nu(),Te(),bc=(e,t)=>{let r=e[0],n=e[1],s=e[2],i=e[3],a=e[4],o=e[5];if(a&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let u=r.dims[0],l=r.dims[1],c=r.dims[2];if(s.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(n.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(n.dims[0]!==c)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(s.dims[0]!==n.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let p=s.dims[0]/3,h=p,m=h;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let k of t.qkvHiddenSizes)if(k%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");p=t.qkvHiddenSizes[0],h=t.qkvHiddenSizes[1],m=t.qkvHiddenSizes[2]}let _=l;if(p!==h)throw new Error("qkv_hidden_sizes first element should be same as the second");if(s.dims[0]!==p+h+m)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let b=0;if(a){if(h!==m)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(a.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(a.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(a.dims[1]!==u)throw new Error('Input "past" second dimension must be batch_size');if(a.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(a.dims[4]!==h/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(b=a.dims[3])}let x=_+b,w=-1,y=0;if(i)throw new Error("Mask not supported");if(a)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==u||o.dims[1]!==t.numHeads||o.dims[2]!==l||o.dims[3]!==x)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:l,pastSequenceLength:b,kvSequenceLength:_,totalSequenceLength:x,maxSequenceLength:w,inputHiddenSize:c,hiddenSize:p,vHiddenSize:m,headSize:Math.floor(p/t.numHeads),vHeadSize:Math.floor(m/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:y,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Ai=(e,t,r)=>t&&e?`
      let total_sequence_length_input = u32(${t.getByOffset("0")});
      let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
      let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
      let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
      total_sequence_length = u32(${e==null?void 0:e.getByOffset("batchIdx")}) + 1;
      var past_sequence_length: u32 = 0;
      if (is_first_prompt == false) {
        past_sequence_length = total_sequence_length - sequence_length;
      }
       `:`
    ${r?"let past_sequence_length = uniforms.past_sequence_length":""};
    let present_sequence_length = total_sequence_length;
    `,yc=(e,t,r,n,s,i,a,o)=>{let u=Ke(a?1:i),l=64,c=i/u;c<l&&(l=32);let p=Math.ceil(i/u/l),h=[{type:12,data:t},{type:12,data:r},{type:12,data:n},{type:12,data:s},{type:12,data:c},{type:12,data:p}],m=rt(e.dataType,u),_=ut(1,u),b=["type"];a&&b.push("type"),o&&b.push("type");let x=w=>{let y=pe("x",e.dataType,e.dims,u),k=[y],S=a?U("seq_lens",a.dataType,a.dims):void 0;S&&k.push(S);let I=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;I&&k.push(I);let z=ut(e.dataType),O=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${l}>;
  var<workgroup> thread_sum: array<f32, ${l}>;
  ${w.registerUniforms(O).declareVariables(...k)}
  ${w.mainStart([l,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${Ai(S,I,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${l}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${a?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${_}(-3.402823e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${_}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(u){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.402823e+38f);
    for (var i = 0u; i < ${l}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${_}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${_}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(u){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${l}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${y.type.value}(${z}(1.0) / ${z}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${_}(x[offset + i]);
        x[offset + i] = ${y.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${a?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${y.type.value}(${z}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${l};${m};${u}`,inputDependencies:b},getShaderSource:x,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:s,z:t*r},programUniforms:h})}},wc=(e,t,r,n,s,i,a,o,u)=>{let l=a+i.kvSequenceLength,c=[i.batchSize,i.numHeads,i.sequenceLength,l],p=e>1&&n,h=i.kvNumHeads?i.kvNumHeads:i.numHeads,m=p?[i.batchSize,h,l,i.headSize]:void 0,_=i.nReps?i.nReps:1,b=i.scale===0?1/Math.sqrt(i.headSize):i.scale,x=Ke(i.headSize),w=i.headSize/x,y=12,k={x:Math.ceil(l/y),y:Math.ceil(i.sequenceLength/y),z:i.batchSize*i.numHeads},S=[{type:12,data:i.sequenceLength},{type:12,data:w},{type:12,data:l},{type:12,data:i.numHeads},{type:12,data:i.headSize},{type:1,data:b},{type:12,data:a},{type:12,data:i.kvSequenceLength},{type:12,data:_}],I=p&&n&&M.size(n.dims)>0,z=["type","type"];I&&z.push("type"),s&&z.push("type"),o&&z.push("type"),u&&z.push("type");let O=[{dims:c,dataType:t.dataType,gpuDataType:0}];p&&O.push({dims:m,dataType:t.dataType,gpuDataType:0});let R=B=>{let G=U("q",t.dataType,t.dims,x),le=U("key",r.dataType,r.dims,x),ie=[G,le];if(I){let ce=U("past_key",n.dataType,n.dims,x);ie.push(ce)}s&&ie.push(U("attention_bias",s.dataType,s.dims));let ae=o?U("seq_lens",o.dataType,o.dims):void 0;ae&&ie.push(ae);let ke=u?U("total_sequence_length_input",u.dataType,u.dims):void 0;ke&&ie.push(ke);let be=pe("output",t.dataType,c),X=[be];p&&X.push(pe("present_key",t.dataType,m,x));let se=ut(1,x),Q=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${y}u;

  var<workgroup> tileQ: array<${G.type.storage}, ${y*y}>;
  var<workgroup> tileK: array<${G.type.storage}, ${y*y}>;
  ${B.registerUniforms(Q).declareVariables(...ie,...X)}
  ${B.mainStart([y,y,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${_===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${_===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${Ai(ae,ke,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${I&&p?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${p?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${se}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
      }
      if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
      ${I&&p?`
              if (n + local_id.y < past_sequence_length) {
                tileK[idx] = past_key[pastKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
              } else if (n + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
                tileK[idx] = key[kOffset + (n + local_id.y - past_sequence_length) * uniforms.K + w + local_id.x];
              }`:`
          if (n + local_id.y < uniforms.kv_sequence_length) {
            tileK[idx] = key[kOffset + (n + local_id.y) * uniforms.K + w + local_id.x];
          }`}
      ${p?`if (n + local_id.y < present_sequence_length) {
        present_key[presentKeyOffset + (n + local_id.y) * uniforms.K + w + local_id.x] = tileK[idx];
      }`:""}
      }
      workgroupBarrier();

      for (var k: u32 = 0u; k < TILE_SIZE && w+k < uniforms.K; k++) {
          value += ${se}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(x){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${x}`)}})()};
        output[outputIdx] = ${be.type.value} (sum * uniforms.alpha) + ${s?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${x};${s!==void 0};${n!==void 0};${e}`,inputDependencies:z},getRunData:()=>({outputs:O,dispatchGroup:k,programUniforms:S}),getShaderSource:R}},vc=(e,t,r,n,s,i,a=void 0,o=void 0)=>{let u=i+s.kvSequenceLength,l=s.nReps?s.nReps:1,c=s.vHiddenSize*l,p=e>1&&n,h=s.kvNumHeads?s.kvNumHeads:s.numHeads,m=p?[s.batchSize,h,u,s.headSize]:void 0,_=[s.batchSize,s.sequenceLength,c],b=12,x={x:Math.ceil(s.vHeadSize/b),y:Math.ceil(s.sequenceLength/b),z:s.batchSize*s.numHeads},w=[{type:12,data:s.sequenceLength},{type:12,data:u},{type:12,data:s.vHeadSize},{type:12,data:s.numHeads},{type:12,data:s.headSize},{type:12,data:c},{type:12,data:i},{type:12,data:s.kvSequenceLength},{type:12,data:l}],y=p&&n&&M.size(n.dims)>0,k=["type","type"];y&&k.push("type"),a&&k.push("type"),o&&k.push("type");let S=[{dims:_,dataType:t.dataType,gpuDataType:0}];p&&S.push({dims:m,dataType:t.dataType,gpuDataType:0});let I=z=>{let O=U("probs",t.dataType,t.dims),R=U("v",r.dataType,r.dims),B=[O,R];y&&B.push(U("past_value",n.dataType,n.dims));let G=a?U("seq_lens",a.dataType,a.dims):void 0;a&&B.push(G);let le=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;o&&B.push(le);let ie=[pe("output",t.dataType,_)];p&&ie.push(pe("present_value",t.dataType,m));let ae=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;
  var<workgroup> tileQ: array<${O.type.value}, ${b*b}>;
  var<workgroup> tileV: array<${O.type.value}, ${b*b}>;
  ${z.registerUniforms(ae).declareVariables(...B,...ie)}
  ${z.mainStart([b,b,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${l===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${l===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${Ai(G,le,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${y&&p?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${p?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${O.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${y&&p?`
        if (w + local_id.y < past_sequence_length) {
          tileV[idx] = past_value[pastValueOffset + (w + local_id.y) * uniforms.N];
        } else if (w + local_id.y - past_sequence_length < uniforms.kv_sequence_length) {
          tileV[idx] = v[vOffset + (w + local_id.y - past_sequence_length) * uniforms.N];
        }
      `:`
            if (w + local_id.y < uniforms.kv_sequence_length) {
              tileV[idx] = v[vOffset + (w + local_id.y) * uniforms.N];
            }`}
        ${p?`
            if (w + local_id.y < present_sequence_length) {
          present_value[presentValueOffset + (w + local_id.y) * uniforms.N] = tileV[idx];
        }`:""}
      }
     workgroupBarrier();
     for (var k: u32 = 0u; k < TILE_SIZE && w+k < total_sequence_length; k++) {
       value += tileQ[TILE_SIZE * local_id.y + k] * tileV[TILE_SIZE * k + local_id.x];
     }
     workgroupBarrier();
   }

   // we need to transpose output from BNSH_v to BSND_v
   if (m < uniforms.M && n < uniforms.N) {
     let outputIdx = batchIdx * uniforms.M * uniforms.v_hidden_size + m * uniforms.v_hidden_size
       + headIdx * uniforms.N + n;
     output[outputIdx] = value;
   }
  }`};return{name:"AttentionScore",shaderCache:{hint:`${n!==void 0};${e}`,inputDependencies:k},getRunData:()=>({outputs:S,dispatchGroup:x,programUniforms:w}),getShaderSource:I}},li=(e,t,r,n,s,i,a,o,u,l,c=void 0,p=void 0)=>{let h=Math.min(e.outputCount,1+(a?1:0)+(o?1:0)),m=h>1?l.pastSequenceLength:0,_=m+l.kvSequenceLength,b=u&&M.size(u.dims)>0?u:void 0,x=[t,r];h>1&&a&&M.size(a.dims)>0&&x.push(a),b&&x.push(b),c&&x.push(c),p&&x.push(p);let w=e.compute(wc(h,t,r,a,b,l,m,c,p),{inputs:x,outputs:h>1?[-1,1]:[-1]})[0];e.compute(yc(w,l.batchSize,l.numHeads,m,l.sequenceLength,_,c,p),{inputs:c&&p?[w,c,p]:[w],outputs:[]});let y=[w,n];h>1&&o&&M.size(o.dims)>0&&y.push(o),c&&y.push(c),p&&y.push(p),e.compute(vc(h,w,n,o,l,m,c,p),{inputs:y,outputs:h>1?[0,2]:[0]})},$c=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],n=t.sequenceLength,s=t.inputHiddenSize,i=t.headSize,a=12,o={x:Math.ceil(t.headSize/a),y:Math.ceil(t.sequenceLength/a),z:t.batchSize*t.numHeads},u=[e.inputs[0],e.inputs[1],e.inputs[2]],l=[{type:12,data:n},{type:12,data:s},{type:12,data:i},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],c=p=>{let h=pe("output_q",u[0].dataType,r),m=pe("output_k",u[0].dataType,r),_=pe("output_v",u[0].dataType,r),b=U("input",u[0].dataType,u[0].dims),x=U("weight",u[1].dataType,u[1].dims),w=U("bias",u[2].dataType,u[2].dims),y=b.type.storage,k=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${a}u;
  var<workgroup> tileInput: array<${y}, ${a*a}>;
  var<workgroup> tileWeightQ: array<${y}, ${a*a}>;
  var<workgroup> tileWeightK: array<${y}, ${a*a}>;
  var<workgroup> tileWeightV: array<${y}, ${a*a}>;
  ${p.registerUniforms(k).declareVariables(b,x,w,h,m,_)}
  ${p.mainStart([a,a,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${y}(0);
    var valueK = ${y}(0);
    var valueV = ${y}(0);
    for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileInput[TILE_SIZE * local_id.y + local_id.x] = input[inputOffset + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        let offset = n + (w + local_id.y) * uniforms.ldb;
        tileWeightQ[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetQ + offset];
        tileWeightK[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetK + offset];
        tileWeightV[TILE_SIZE * local_id.y + local_id.x] = weight[biasOffsetV + offset];
      }
      workgroupBarrier();
      for (var k: u32 = 0u; k<TILE_SIZE && w+k < uniforms.K; k++) {
        let inputTileOffset = TILE_SIZE * local_id.y + k;
        let weightTileOffset = TILE_SIZE * k + local_id.x;
        valueQ += tileInput[inputTileOffset] * tileWeightQ[weightTileOffset];
        valueK += tileInput[inputTileOffset] * tileWeightK[weightTileOffset];
        valueV += tileInput[inputTileOffset] * tileWeightV[weightTileOffset];
      }

      workgroupBarrier();
    }

    let headOffset = (m * uniforms.N + n) % uniforms.head_size;
    valueQ += bias[headOffset + biasOffsetQ];
    valueK += bias[headOffset + biasOffsetK];
    valueV += bias[headOffset + biasOffsetV];

    let offset = workgroup_id.z * uniforms.M * uniforms.N;
    if (m < uniforms.M && n < uniforms.N) {
      let outputIdx = offset + m * uniforms.N + n;
      output_q[outputIdx] = valueQ;
      output_k[outputIdx] = valueK;
      output_v[outputIdx] = valueV;
    }
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:l}),getShaderSource:c},{inputs:u,outputs:[-1,-1,-1]})},Og=(e,t)=>{let r=bc(e.inputs,t),[n,s,i]=$c(e,r);return li(e,n,s,i,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),xc,Sc,kc,Ag,v1=K(()=>{Ft(),ve(),Se(),Ze(),Te(),xc=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(n,s,i)=>{let a=s.length;if(a!==n.length)throw new Error(`${i}: num dimensions != ${a}`);s.forEach((o,u)=>{if(o!==n[u])throw new Error(`${i}: dim[${u}] do not match`)})};if(e[0].dims.length>1){let n=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,n,"Invalid input scale"),r(e[2].dims,n,"Invalid input B"),r(e[3].dims,n,"Invalid input mean"),r(e[4].dims,n,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},Sc=(e,t)=>{let{epsilon:r,spatial:n,format:s}=t,i=e[0].dims,a=n?Ke(i[i.length-1]):1,o=s==="NHWC"&&i.length>1?a:1,u=M.size(i)/a,l=n,c=l?i.length:i,p=U("x",e[0].dataType,e[0].dims,a),h=U("scale",e[1].dataType,e[1].dims,o),m=U("bias",e[2].dataType,e[2].dims,o),_=U("inputMean",e[3].dataType,e[3].dims,o),b=U("inputVar",e[4].dataType,e[4].dims,o),x=pe("y",e[0].dataType,c,a),w=()=>{let k="";if(n)k=`let cOffset = ${i.length===1?"0u":s==="NHWC"?`outputIndices[${i.length-1}] / ${a}`:"outputIndices[1]"};`;else if(s==="NCHW")k=`
            ${x.indicesSet("outputIndices","0","0")}
            let cOffset = ${x.indicesToOffset("outputIndices")};`;else{k=`var cIndices = ${h.type.indices}(0);
                       cIndices[0] = outputIndices[${i.length-1}];`;for(let S=1;S<h.rank;S++)k+=`cIndices[${S}] = outputIndices[${S}];`;k+=`let cOffset = ${h.indicesToOffset("cIndices")};`}return k},y=k=>`
  const epsilon = ${r};
  ${k.registerUniform("outputSize","u32").declareVariables(p,h,m,_,b,x)}
  ${k.mainStart()}
  ${k.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${x.offsetToIndices(`global_idx * ${a}`)};
    ${w()}
    let scale = ${h.getByOffset("cOffset")};
    let bias = ${m.getByOffset("cOffset")};
    let inputMean = ${_.getByOffset("cOffset")};
    let inputVar = ${b.getByOffset("cOffset")};
    let x = ${p.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${x.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${n}_${a}`,inputDependencies:l?["rank","type","type","type","type"]:void 0},getShaderSource:y,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l?[{type:12,data:u},...me(i)]:[{type:12,data:u}]})}},kc=e=>Pe(e),Ag=(e,t)=>{let{inputs:r,outputCount:n}=e,s=kc({...t,outputCount:n});if(He.webgpu.validateInputContent&&xc(r,s),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(Sc(r,s))}}),Tc,Ec,Rg,$1=K(()=>{Se(),Te(),Tc=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Ec=e=>{let t=e[0].dims,r=e[0].dims[2],n=M.size(t)/4,s=e[0].dataType,i=U("input",s,t,4),a=U("bias",s,[r],4),o=U("residual",s,t,4),u=pe("output",s,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:l=>`
  const channels = ${r}u / 4;
  ${l.declareVariables(i,a,o,u)}

  ${l.mainStart()}
    ${l.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let value = ${i.getByOffset("global_idx")}
      + ${a.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${u.setByOffset("global_idx","value")}
  }`}},Rg=e=>{Tc(e.inputs),e.compute(Ec(e.inputs))}}),Ic,Ne,Mg,Bg,Ng,Pg,Dg,Ug,Wg,Lg,qg,Cc,Fg,Vg,Hg,Gg,qn,jg,Vi,Kg,Qg,Zg,Xg,Yg,Jg,e_,t_,r_,n_,i_,s_,a_,o_,u_,l_,_a,d_,go,_o,c_,p_,f_,zc,Oc,h_,ou=K(()=>{ve(),Se(),Ze(),Te(),Ic=(e,t,r,n,s,i,a)=>{let o=Math.ceil(t/4),u="";typeof s=="string"?u=`${s}(a)`:u=s("a");let l=U("inputData",r,[o],4),c=pe("outputData",n,[o],4),p=[{name:"vec_size",type:"u32"}];return a&&p.push(...a),`
      ${e.registerUniforms(p).declareVariables(l,c)}

  ${i??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${l.getByOffset("global_idx")};
    ${c.setByOffset("global_idx",u)}
  }`},Ne=(e,t,r,n,s,i=e.dataType,a,o)=>{let u=[{type:12,data:Math.ceil(M.size(e.dims)/4)}];return a&&u.push(...a),{name:t,shaderCache:{hint:s,inputDependencies:["type"]},getShaderSource:l=>Ic(l,M.size(e.dims),e.dataType,i,r,n,o),getRunData:l=>({outputs:[{dims:e.dims,dataType:i}],dispatchGroup:{x:Math.ceil(M.size(l[0].dims)/64/4)},programUniforms:u})}},Mg=e=>{e.compute(Ne(e.inputs[0],"Abs","abs"))},Bg=e=>{e.compute(Ne(e.inputs[0],"Acos","acos"))},Ng=e=>{e.compute(Ne(e.inputs[0],"Acosh","acosh"))},Pg=e=>{e.compute(Ne(e.inputs[0],"Asin","asin"))},Dg=e=>{e.compute(Ne(e.inputs[0],"Asinh","asinh"))},Ug=e=>{e.compute(Ne(e.inputs[0],"Atan","atan"))},Wg=e=>{e.compute(Ne(e.inputs[0],"Atanh","atanh"))},Lg=e=>Pe(e),qg=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(Ne(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},Cc=e=>{let t,r,n=e.length>=2&&e[1].data!==0,s=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=n?e[1].getFloat32Array()[0]:-34028234663852886e22,r=s?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=n?e[1].getUint16Array()[0]:64511,r=s?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return Pe({min:t,max:r})},Fg=(e,t)=>{let r=t||Cc(e.inputs),n=ut(e.inputs[0].dataType);e.compute(Ne(e.inputs[0],"Clip",s=>`clamp(${s}, vec4<${n}>(uniforms.min), vec4<${n}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:n},{name:"max",type:n}]),{inputs:[0]})},Vg=e=>{e.compute(Ne(e.inputs[0],"Ceil","ceil"))},Hg=e=>{e.compute(Ne(e.inputs[0],"Cos","cos"))},Gg=e=>{e.compute(Ne(e.inputs[0],"Cosh","cosh"))},qn=e=>Pe(e),jg=(e,t)=>{let r=ut(e.inputs[0].dataType);e.compute(Ne(e.inputs[0],"Elu",n=>`elu_vf32(${n})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},Vi=(e="f32")=>`
const r0: ${e} = 0.3275911;
const r1: ${e} = 0.254829592;
const r2: ${e} = -0.284496736;
const r3: ${e} = 1.421413741;
const r4: ${e} = -1.453152027;
const r5: ${e} = 1.061405429;

fn erf_vf32(v: vec4<${e}>) -> vec4<${e}> {
  let absv = abs(v);
  let x = 1.0 / (1.0 + r0 * absv);
  return sign(v) * (1.0 - ((((r5 * x + r4) * x + r3) * x + r2) * x + r1) * x * exp(-absv * absv));
}`,Kg=e=>{let t=ut(e.inputs[0].dataType);e.compute(Ne(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,Vi(t)))},Qg=e=>{e.compute(Ne(e.inputs[0],"Exp","exp"))},Zg=e=>{e.compute(Ne(e.inputs[0],"Floor","floor"))},Xg=e=>{let t=ut(e.inputs[0].dataType);e.compute(Ne(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,Vi(t)))},Yg=(e,t)=>{let r=ut(e.inputs[0].dataType);e.compute(Ne(e.inputs[0],"LeakyRelu",n=>`select(leaky_relu_alpha_ * ${n}, ${n}, ${n} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},Jg=e=>{e.compute(Ne(e.inputs[0],"Not",t=>`!${t}`))},e_=e=>{e.compute(Ne(e.inputs[0],"Neg",t=>`-${t}`))},t_=e=>{e.compute(Ne(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},r_=e=>{let t=ut(e.inputs[0].dataType);e.compute(Ne(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},n_=e=>{e.compute(Ne(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},i_=e=>Pe(e),s_=(e,t)=>{let r=ut(e.inputs[0].dataType);e.compute(Ne(e.inputs[0],"HardSigmoid",n=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${n} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},a_=e=>{e.compute(Ne(e.inputs[0],"Sin","sin"))},o_=e=>{e.compute(Ne(e.inputs[0],"Sinh","sinh"))},u_=e=>{e.compute(Ne(e.inputs[0],"Sqrt","sqrt"))},l_=e=>{e.compute(Ne(e.inputs[0],"Tan","tan"))},_a=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,d_=e=>{e.compute(Ne(e.inputs[0],"Tanh",_a))},go=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${_a("v")};
}
`,_o=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,c_=e=>{let t=ut(e.inputs[0].dataType);e.compute(Ne(e.inputs[0],"FastGelu",_o,go(t),void 0,e.inputs[0].dataType))},p_=(e,t)=>{let r=ut(e.inputs[0].dataType);return e.compute(Ne(e.inputs[0],"ThresholdedRelu",n=>`select(vec4<${r}>(0.0), ${n}, ${n} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},f_=e=>{e.compute(Ne(e.inputs[0],"Log","log"))},zc=(e,t)=>`
const alpha = vec4<${e}>(${t});
const one = ${e}(1.0);
const zero = ${e}(0.0);

fn quick_gelu_impl(x: vec4<${e}>) -> vec4<${e}> {
  let v = x *alpha;
  var x1 : vec4<${e}>;
  for (var i = 0; i < 4; i = i + 1) {
    if (v[i] >= zero) {
      x1[i] = one / (one + exp(-v[i]));
    } else {
      x1[i] = one - one / (one + exp(v[i]));
    }
  }
  return x * x1;
}
`,Oc=e=>`quick_gelu_impl(${e})`,h_=(e,t)=>{let r=ut(e.inputs[0].dataType);e.compute(Ne(e.inputs[0],"QuickGelu",Oc,zc(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Ac,Rc,m_,x1=K(()=>{Se(),Te(),ou(),Ac=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Rc=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=U("input",e[0].dataType,e[0].dims,4),n=U("bias",e[0].dataType,[e[0].dims[2]],4),s=pe("output",e[0].dataType,t,4),i=M.size(t)/4,a=rt(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(r,n,s)}

  ${Vi(a)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${s.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},m_=e=>{Ac(e.inputs),e.compute(Rc(e.inputs))}}),Mc,Bc,Nt,g_,__,b_,y_,w_,v_,$_,x_,S_,k_,S1=K(()=>{ve(),Se(),Te(),Mc=(e,t,r,n,s,i,a,o,u,l,c,p)=>{let h,m;typeof o=="string"?h=m=(y,k)=>`${o}((${y}),(${k}))`:typeof o=="function"?h=m=o:(h=o.scalar,m=o.vector);let _=pe("outputData",c,n.length,4),b=U("aData",u,t.length,4),x=U("bData",l,r.length,4),w;if(s)if(i){let y=M.size(t)===1,k=M.size(r)===1,S=t.length>0&&t[t.length-1]%4===0,I=r.length>0&&r[r.length-1]%4===0;y||k?w=_.setByOffset("global_idx",m(y?`${b.type.value}(${b.getByOffset("0")}.x)`:b.getByOffset("global_idx"),k?`${x.type.value}(${x.getByOffset("0")}.x)`:x.getByOffset("global_idx"))):w=`
            let outputIndices = ${_.offsetToIndices("global_idx * 4u")};
            let offsetA = ${b.broadcastedIndicesToOffset("outputIndices",_)};
            let offsetB = ${x.broadcastedIndicesToOffset("outputIndices",_)};
            ${_.setByOffset("global_idx",m(a||S?b.getByOffset("offsetA / 4u"):`${b.type.value}(${b.getByOffset("offsetA / 4u")}[offsetA % 4u])`,a||I?x.getByOffset("offsetB / 4u"):`${x.type.value}(${x.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else w=_.setByOffset("global_idx",m(b.getByOffset("global_idx"),x.getByOffset("global_idx")));else{if(!i)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let y=(k,S,I="")=>{let z=`aData[indexA${S}][componentA${S}]`,O=`bData[indexB${S}][componentB${S}]`;return`
            let outputIndices${S} = ${_.offsetToIndices(`global_idx * 4u + ${S}u`)};
            let offsetA${S} = ${b.broadcastedIndicesToOffset(`outputIndices${S}`,_)};
            let offsetB${S} = ${x.broadcastedIndicesToOffset(`outputIndices${S}`,_)};
            let indexA${S} = offsetA${S} / 4u;
            let indexB${S} = offsetB${S} / 4u;
            let componentA${S} = offsetA${S} % 4u;
            let componentB${S} = offsetB${S} % 4u;
            ${k}[${S}] = ${I}(${h(z,O)});
          `};c===9?w=`
            var data = vec4<u32>(0);
            ${y("data",0,"u32")}
            ${y("data",1,"u32")}
            ${y("data",2,"u32")}
            ${y("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:w=`
            ${y("outputData[global_idx]",0)}
            ${y("outputData[global_idx]",1)}
            ${y("outputData[global_idx]",2)}
            ${y("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(b,x,_)}

        ${p??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${w}
      }`},Bc=(e,t,r,n,s,i,a=r.dataType)=>{let o=r.dims.map(b=>Number(b)??1),u=n.dims.map(b=>Number(b)??1),l=!M.areEqual(o,u),c=o,p=M.size(o),h=!1,m=!1,_=[l];if(l){let b=bn.calcShape(o,u,!1);if(!b)throw new Error("Can't perform binary op on the given tensors");c=b.slice(),p=M.size(c);let x=M.size(o)===1,w=M.size(u)===1,y=o.length>0&&o[o.length-1]%4===0,k=u.length>0&&u[u.length-1]%4===0;_.push(x),_.push(w),_.push(y),_.push(k);let S=1;for(let I=1;I<c.length;I++){let z=o[o.length-I],O=u[u.length-I];if(z===O)S*=z;else break}S%4===0?(m=!0,h=!0):(x||w||y||k)&&(h=!0)}else h=!0;return _.push(h),{name:e,shaderCache:{hint:t+_.map(b=>b.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:b=>Mc(b,o,u,c,h,l,m,s,r.dataType,n.dataType,a,i),getRunData:()=>({outputs:[{dims:c,dataType:a}],dispatchGroup:{x:Math.ceil(p/64/4)},programUniforms:[{type:12,data:Math.ceil(M.size(c)/4)},...me(o,u,c)]})}},Nt=(e,t,r,n,s,i)=>{e.compute(Bc(t,s??"",e.inputs[0],e.inputs[1],r,n,i))},g_=e=>{Nt(e,"Add",(t,r)=>`${t}+${r}`)},__=e=>{Nt(e,"Div",(t,r)=>`${t}/${r}`)},b_=e=>{Nt(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},y_=e=>{Nt(e,"Mul",(t,r)=>`${t}*${r}`)},w_=e=>{let t=U("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;Nt(e,"Pow",{scalar:(r,n)=>`pow_custom(${r},${n})`,vector:(r,n)=>`pow_vector_custom(${r},${n})`},`
    fn pow_custom(a : ${t}, b : ${t}) -> ${t} {
      if (b == ${t}(0.0)) {
        return ${t}(1.0);
      } else if (a < ${t}(0.0) && f32(b) != floor(f32(b))) {
        return ${t}(pow(f32(a), f32(b))); // NaN
      }
      return select(sign(a), ${t}(1.0), round(f32(abs(b) % ${t}(2.0))) != 1.0) * ${t}(${t==="i32"?"round":""}(pow(f32(abs(a)), f32(b))));
    }
    fn pow_vector_custom(a : vec4<${t}>, b : vec4<${t}>) -> vec4<${t}> {
      // TODO: implement vectorized pow
      return vec4<${t}>(pow_custom(a.x, b.x), pow_custom(a.y, b.y), pow_custom(a.z, b.z), pow_custom(a.w, b.w));
    }
      `)},v_=e=>{Nt(e,"Sub",(t,r)=>`${t}-${r}`)},$_=e=>{Nt(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},x_=e=>{Nt(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},S_=e=>{Nt(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},k_=e=>{Nt(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),Nc,Pc,Dc,Uc,T_,E_,k1=K(()=>{ve(),Se(),Ze(),Te(),Nc=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,n=e[r],s=n.dataType,i=n.dims.length;e.forEach((a,o)=>{if(o!==r){if(a.dataType!==s)throw new Error("input tensors should be one type");if(a.dims.length!==i)throw new Error("input tensors should have the same shape");a.dims.forEach((u,l)=>{if(l!==t&&u!==n.dims[l])throw new Error("non concat dimensions must match")})}})},Pc=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,Dc=(e,t)=>{let r=e.length,n=[];for(let s=0;s<r;++s){let i=t.setByOffset("global_idx",e[s].getByIndices("indices"));r===1?n.push(i):s===0?n.push(`if (inputIndex == ${s}u) { ${i} }`):s===r-1?n.push(`else { ${i} }`):n.push(`else if (inputIndex == ${s}) { ${i} }`)}return n.join(`
`)},Uc=(e,t,r,n)=>{let s=M.size(r),i=new Array(e.length),a=new Array(e.length),o=0,u=[],l=[],c=[{type:12,data:s}];for(let b=0;b<e.length;++b)o+=e[b].dims[t],i[b]=o,l.push(e[b].dims.length),a[b]=U(`input${b}`,n,l[b]),u.push("rank"),c.push({type:12,data:i[b]});for(let b=0;b<e.length;++b)c.push(...me(e[b].dims));c.push(...me(r));let p=pe("output",n,r.length),h=p.indicesGet("indices",t),m=Array.from(Array(i.length).keys()).map(b=>`uniforms.sizeInConcatAxis${b}`).join(","),_=b=>`

  ${(()=>{b.registerUniform("outputSize","u32");for(let x=0;x<e.length;x++)b.registerUniform(`sizeInConcatAxis${x}`,"u32");return b.declareVariables(...a,p)})()}

  ${Pc(i.length,m)}

  ${b.mainStart()}
    ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${p.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${h});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${i.length}u>(${m});
      ${h} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${Dc(a,p)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:n}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:c}),getShaderSource:_}},T_=(e,t)=>{let r=e.inputs,n=r[0].dims,s=M.normalizeAxis(t.axis,n.length);Nc(r,s);let i=n.slice();i[s]=r.reduce((o,u)=>o+(u.dims.length>s?u.dims[s]:0),0);let a=r.filter(o=>M.size(o.dims)>0);e.compute(Uc(a,s,i,r[0].dataType),{inputs:a})},E_=e=>Pe({axis:e.axis})}),Zr,Xr,Yr,uu,tn=K(()=>{ve(),Se(),Zr=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Xr=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Yr=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},uu=e=>{let t=(e==null?void 0:e.activation)||"";if(t==="HardSigmoid"){let[r,n]=(e==null?void 0:e.activation_params)||[.2,.5];return{activation:t,alpha:r,beta:n}}else if(t==="Clip"){let[r,n]=(e==null?void 0:e.activation_params)||[Jm,eg];return{activation:t,clipMax:n,clipMin:r}}else if(t==="LeakyRelu"){let[r]=(e==null?void 0:e.activation_params)||[.01];return{activation:t,alpha:r}}return{activation:t}}}),it,I_,lu=K(()=>{it=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},I_=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),C_,T1=K(()=>{C_=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),ei,du,cu=K(()=>{ve(),Se(),Te(),tn(),ei=(e,t,r,n,s)=>{let i=n-r;return`
      ${Array.from({length:r}).map((a,o)=>`
      if (${fe(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,fe(s,o+i,n))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},du=(e,t,r,n,s=!1,i)=>{let a=e[0].dims,o=e[1].dims,u=a[a.length-2],l=o[o.length-1],c=a[a.length-1],p=Ke(l),h=Ke(c),m=Ke(u),_=M.size(r)/p/m,b=e.length>2,x=n?n.slice(0,-2):r.slice(0,-2),w=[M.size(x),u,l],y=[{type:12,data:_},{type:12,data:u},{type:12,data:l},{type:12,data:c}];Xr(t,y),y.push(...me(x,a,o)),b&&y.push(...me(e[2].dims)),y.push(...me(w));let k=S=>{let I=iu("batch_dims",e[0].dataType,x.length),z=U("a",e[0].dataType,a.length,h),O=U("b",e[1].dataType,o.length,p),R=pe("output",e[0].dataType,w.length,p),B=rt(R.type.tensor),G=Zr(t,R.type.value,B),le=[z,O],ie="";if(b){let be=s?p:1;le.push(U("bias",e[2].dataType,e[2].dims.length,be)),ie=`${s?`value += bias[col / ${be}];`:`value += ${R.type.value}(bias[row + i]);`}`}let ae=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Yr(t,ae);let ke=()=>{let be=`var a_data: ${z.type.value};`;for(let X=0;X<h;X++)be+=`
              let b_data${X} = b[(b_offset + (k + ${X}) * uniforms.N + col) / ${p}];`;for(let X=0;X<m;X++){be+=`a_data = a[(a_offset + (row + ${X}) * uniforms.K + k) / ${h}];`;for(let se=0;se<h;se++)be+=`
            values[${X}] = fma(${O.type.value}(a_data${h===1?"":`[${se}]`}), b_data${se}, values[${X}]);
`}return be};return`
  ${S.registerUniforms(ae).registerInternalVariables(I).declareVariables(...le,R)}
  ${S.mainStart()}
    ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${p})) * ${p};
    var index1 = global_idx / (uniforms.N / ${p});
    let stride1 = uniforms.M / ${m};
    let row = (index1 % stride1) * ${m};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${I.offsetToIndices("batch")};`}

    var a_indices: ${z.type.indices};
    ${ei("a_indices",z,z.rank-2,I.rank,"batch_indices")}
    ${z.indicesSet("a_indices",z.rank-2,0)}
    ${z.indicesSet("a_indices",z.rank-1,0)}
    let a_offset = ${z.indicesToOffset("a_indices")};

    var b_indices: ${O.type.indices};
    ${ei("b_indices",O,O.rank-2,I.rank,"batch_indices")}
    ${O.indicesSet("b_indices",O.rank-2,0)}
    ${O.indicesSet("b_indices",O.rank-1,0)}
    let b_offset = ${O.indicesToOffset("b_indices")};
    var values: array<${R.type.value}, ${m}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${h}) {
      ${ke()}
    }
    for (var i = 0u; i < ${m}u; i++) {
      var value = values[i];
      ${ie}
      ${G}
      let cur_indices = ${R.type.indices}(batch, row + i, col);
      let offset = ${R.indicesToOffset("cur_indices")};
      ${R.setByOffset(`offset / ${p}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${p};${h};${m};${s}`,inputDependencies:b?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:y}),getShaderSource:k}}}),Wc,Lc,bo,ba,qc,yo,Fc,ns,pu=K(()=>{ve(),Se(),Te(),tn(),cu(),lu(),Wc=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,Lc=(e,t)=>e?`
        let ACached0 = mm_Asub[k * innerElementSize][localRow];
        let ACached1 = mm_Asub[k * innerElementSize + 1][localRow];
        let ACached2 = mm_Asub[k * innerElementSize + 2][localRow];
        ${t===3?"":"let ACached3 = mm_Asub[k * innerElementSize + 3][localRow];"}
        for (var i = 0; i < rowPerThread; i = i + 1) {
          acc[i] = BCached0 * ACached0[i] + acc[i];
          acc[i] = BCached1 * ACached1[i] + acc[i];
          acc[i] = BCached2 * ACached2[i] + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached3[i] + acc[i];"}
        }`:`
        for (var i = 0; i < rowPerThread; i = i + 1) {
          let ACached = mm_Asub[tileRow + i][k];
          acc[i] = BCached0 * ACached.x + acc[i];
          acc[i] = BCached1 * ACached.y + acc[i];
          acc[i] = BCached2 * ACached.z + acc[i];
          ${t===3?"":"acc[i] = BCached3 * ACached.w + acc[i];"}
        }`,bo=(e,t,r="f32",n,s=!1,i=32,a=!1,o=32)=>{let u=t[1]*e[1],l=t[0]*e[0],c=s?u:i,p=s?i:u,h=c/t[0],m=i/t[1];if(!((s&&h===4&&e[1]===4||!s&&(h===3||h===4))&&c%t[0]===0&&i%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${s} is true, innerElementSize ${h} and workPerThread[1] ${e[1]} must be 4.
      Otherwise, innerElementSize ${h} must be 3 or 4.
  tileAWidth ${c} must be divisible by workgroupSize[0]${t[0]}. tileInner ${i} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${h}<${r}>, ${c/h}>, ${p}>;
var<workgroup> mm_Bsub: array<array<vec4<${r}>, ${l/e[0]}>, ${i}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${h};
const tileInner = ${i};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
  let localRow = i32(localId.y);
  let tileRow = localRow * rowPerThread;
  let tileCol = i32(localId.x);

  let globalRow =i32(globalId.y) * rowPerThread;
  let globalCol = i32(globalId.x);
  let batch = ${a?"0":"i32(globalId.z)"};
  ${n?`let batchIndices = ${n.offsetToIndices("u32(batch)")};`:""}
  let globalRowStart = i32(workgroupId.y) * ${u};

  let num_tiles = ${a?`${Math.ceil(o/i)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
  var kStart = ${a?`i32(globalId.z) * ${o}`:"0"};

  var acc: array<vec4<${r}>, rowPerThread>;

  // Loop over shared dimension.
  let tileRowB = localRow * ${m};
  for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let inputRow = tileRow + innerRow;
          let inputCol = tileCol;
          ${Wc(s,n)}
      }

      // Load one tile of B into local memory.
      for (var innerRow = 0; innerRow < ${m}; innerRow = innerRow + 1) {
          let inputRow = tileRowB + innerRow;
          let inputCol = tileCol;
          mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${n?", batchIndices":""});
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
          let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
          let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
          let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
          ${h===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

          ${Lc(s,h)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},ba=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,qc=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",yo=(e,t,r="f32",n,s=!1,i=32,a=!1,o=32,u=!1)=>{let l=e[1]*t[1],c=e[0]*t[0],p=s?l:i,h=s?i:l;if(!(h%t[1]===0&&p%t[0]===0&&i%t[1]===0))throw new Error(`tileAHight ${h} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${p} must be divisible by workgroupSize[0]${t[0]}, tileInner ${i} must be divisible by workgroupSize[1]${t[1]}`);let m=h/t[1],_=p/t[0],b=i/t[1],x=u?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${l};
    let globalColStart = i32(workgroupId.x) * ${c};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${h}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${p}; inputCol = inputCol + ${t[0]}) {
          ${ba(s,n)}
        }
      }
      // Load one tile of B into local memory.
      for (var inputRow = localRow; inputRow < ${i}; inputRow = inputRow + ${t[1]}) {
            for (var inputCol = localCol; inputCol < ${c}; inputCol = inputCol + ${t[0]}) {
          mm_Bsub[inputRow][inputCol] = mm_readB(batch,
            kStart + inputRow,
            globalColStart + inputCol${n?", batchIndices":""});
        }
      }
      kStart = kStart + tileInner;
      workgroupBarrier();

      // Compute acc values for a single thread.
      var BCached : array<${r}, colPerThread>;
      for (var k = 0; k < tileInner; k = k + 1) {
        for (var inner = 0; inner < colPerThread; inner = inner + 1) {
          BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
        }
        for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
          let ACached = ${s?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
          for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
            acc[innerRow][innerCol] = acc[innerRow][innerCol] +
                ACached * BCached[innerCol];
          }
        }
      }
      workgroupBarrier();
    }
    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      let gRow = globalRowStart + localRow + innerRow * ${t[1]};
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        let gCol = globalColStart + localCol + innerCol * ${t[0]};
        mm_write(batch, gRow, gCol, acc[innerRow][innerCol]);
      }
    }
    `:`
let tileRow = i32(localId.y) * rowPerThread;
let tileCol = i32(localId.x) * colPerThread;

let globalRow = i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x) * colPerThread;
let globalRowStart = i32(workgroupId.y) * ${l};

let tileRowA = i32(localId.y) * ${m};
let tileColA = i32(localId.x) * ${_};
let tileRowB = i32(localId.y) * ${b};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${m}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${_}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${ba(s,n)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${b}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
      let inputRow = tileRowB + innerRow;
      let inputCol = tileCol + innerCol;
      mm_Bsub[inputRow][inputCol] = mm_readB(batch,
        kStart + inputRow,
        globalCol + innerCol${n?", batchIndices":""});
    }
  }
  kStart = kStart + tileInner;
  workgroupBarrier();

  // Compute acc values for a single thread.
  var BCached : array<${r}, colPerThread>;
  for (var k = 0; k < tileInner; k = k + 1) {
    for (var inner = 0; inner < colPerThread; inner = inner + 1) {
      BCached[inner] = mm_Bsub[k][tileCol + inner];
    }

    for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      ${qc(s)}
      for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
        acc[innerRow][innerCol] = acc[innerRow][innerCol] + ACached * BCached[innerCol];
      }
    }
  }

  workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
  for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
    mm_write(batch, globalRow + innerRow, globalCol + innerCol,
        acc[innerRow][innerCol]);
  }
}
`;return`
  var<workgroup> mm_Asub : array<array<${r}, ${p}>, ${h}>;
  var<workgroup> mm_Bsub : array<array<${r}, ${c}>, ${i}>;
  const rowPerThread = ${e[1]};
  const colPerThread = ${e[0]};
  const tileInner = ${i};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
        @builtin(global_invocation_id) globalId : vec3<u32>,
        @builtin(workgroup_id) workgroupId : vec3<u32>) {
    let batch = ${a?"0":"i32(globalId.z)"};
    ${n?`let batchIndices = ${n.offsetToIndices("u32(batch)")};`:""}
    let num_tiles = ${a?`${Math.ceil(o/i)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
    var kStart = ${a?`i32(globalId.z) * ${o}`:"0"};

    var acc : array<array<${r}, colPerThread>, rowPerThread>;
    ${x}
  }
`},Fc=(e,t,r,n,s=!1)=>{let[i,a,o,u]=n,l=rt(n[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${i.type.indices}) -> ${it(e,l)} {
      var value = ${it(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${a.type.indices};
        ${ei("aIndices",a,a.rank-2,i.rank,"batchIndices")}
        ${a.indicesSet("aIndices",a.rank-2,"u32(row)")}
        ${a.indicesSet("aIndices",a.rank-1,"u32(colIn)")}
        value = ${a.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${i.type.indices}) -> ${it(e,l)} {
      var value = ${it(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${ei("bIndices",o,o.rank-2,i.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${it(e,l)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${s?"bias[colIn]":`${it(e,l)}(bias[row])`};`:""}
        ${r}
        ${u.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},ns=(e,t,r,n,s=!1,i)=>{let a=e[0].dims,o=e[1].dims,u=a.slice(0,-2),l=o.slice(0,-2),c=n?n.slice(0,-2):r.slice(0,-2),p=M.size(c),h=a[a.length-2],m=a[a.length-1],_=o[o.length-1],b=m%4===0&&_%4===0,x=h<=8?[4,1,1]:[4,4,1],w=[8,8,1],y=[Math.ceil(_/w[0]/x[0]),Math.ceil(h/w[1]/x[1]),Math.ceil(p/w[2]/x[2])],k=b?4:1,S=[...u,h,m/k],I=S.length,z=[...l,m,_/k],O=z.length,R=[p,h,_/k],B=[{type:6,data:h},{type:6,data:_},{type:6,data:m}];Xr(t,B),B.push(...me(c,S,z));let G=["rank","rank"],le=e.length>2;le&&(B.push(...me(e[2].dims)),G.push("rank")),B.push(...me(R));let ie=ae=>{let ke=c.length,be=iu("batchDims",e[0].dataType,ke,1),X=rt(e[0].dataType),se=U("a",e[0].dataType,I,k),Q=U("b",e[1].dataType,O,k),ce=pe("result",e[0].dataType,R.length,k),Me=[se,Q];if(le){let Xe=s?k:1;Me.push(U("bias",e[2].dataType,e[2].dims.length,Xe))}let P=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Yr(t,P);let V=rt(ce.type.tensor),J=Zr(t,ce.type.value,V),_e=Fc(k,le,J,[be,se,Q,ce],s);return`
  ${ae.registerUniforms(P).registerInternalVariables(be).declareVariables(...Me,ce)}
  ${_e}
  ${b?bo(x,w,X,be):yo(x,w,X,be)}
                   `};return{name:"MatMul",shaderCache:{hint:`${x};${t.activation};${b};${s}`,inputDependencies:G},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:y[0],y:y[1],z:y[2]},programUniforms:B}),getShaderSource:ie}}}),Vc,z_,E1=K(()=>{ve(),mr(),Te(),tn(),lu(),T1(),pu(),Vc=(e,t,r,n,s=!1,i,a=4,o=4,u=4,l="f32")=>{let c=B=>{switch(B){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${l}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${B} is not supported.`)}},p=B=>{switch(B){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${B} is not supported.`)}},h=e?`
    let coord = vec4<i32>(batch, xRow, xCol, xCh);
    `:`
    let coord = vec4<i32>(batch, xCh, xRow, xCol);
    `,m=e?`
    let coords = vec4<i32>(
      batch,
      row / outWidth,
      row % outWidth,
      col);
    `:`
    let coords = vec4<i32>(
      batch,
      row,
      col / outWidth,
      col % outWidth);
    `,_=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",b=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",x=e?"row":"col",w=e?"col":"row",y=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${x} / outWidth;
    let outCol = ${x} % outWidth;

    let WRow = ${w} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${w} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${w} % inChannels;
    var resData = ${it(a,l)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${_} && xCol >= 0 && xCol < ${b}) {
      ${h}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${c(a)}
    }
    return resData;`,k=e?t&&n?`
    let col = colIn * ${a};
    ${y}`:`
    let col = colIn * ${a};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${y}
    }
    return ${it(a,l)}(0.0);`:n&&r?`
    let col = colIn * ${a};
    ${y}`:`
    let col = colIn * ${a};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${y}
    }
    return ${it(a,l)}(0.0);`,S=e?n&&r?p(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${p(o)}
    }
    return ${it(o,l)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${p(o)}
    }
    return ${it(o,l)}(0.0);`,I=it(u,l),z=it(e?a:o,l),O=it(e?o:a,l),R=Zr(i,I,l);return`
    fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${z} {
      ${e?k:S}
    }

    fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${O} {
      ${e?S:k}
    }

    fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${I}) {
      let col = colIn * ${u};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
      {
      var value = valueIn;
      let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
      ${m}
      ${I_(s)}
      ${R}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},z_=(e,t,r,n,s,i,a,o,u)=>{let l=t.format==="NHWC",c=l?e[0].dims[3]:e[0].dims[1],p=r[0],h=l?r[2]:r[3],m=l?r[1]:r[2],_=l?r[3]:r[1],b=l&&(c%4===0||c%3===0)&&_%4===0,x=l?_:h*m,w=l?h*m:_,y=[8,8,1],k=n<=8?[4,1,1]:[4,4,1],S=[Math.ceil(x/y[0]/k[0]),Math.ceil(w/y[1]/k[1]),Math.ceil(p/y[2]/k[2])];Ae("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${S}`);let I=b?l&&c%4!==0?3:4:1,z=y[1]*k[1],O=y[0]*k[0],R=Math.max(y[0]*I,y[1]),B=n%z===0,G=s%O===0,le=i%R===0,ie=b?[I,4,4]:[1,1,1],ae=[{type:6,data:n},{type:6,data:s},{type:6,data:i},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Xr(t,ae),ae.push(...me(e[0].dims,e[1].dims));let ke=["rank","rank"];a&&(ae.push(...me(e[2].dims)),ke.push("rank")),ae.push(...me(r));let be=X=>{let se=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Yr(t,se);let Q=b?4:1,ce=rt(e[0].dataType),Me=`
      fn setOutputAtIndex(flatIndex : i32, value : ${b?`vec4<${ce}>`:ce}) {
        result[flatIndex] = ${b?`vec4<${ce}>`:ce}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${b?`vec4<${ce}>`:ce}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${b?"/ 4":""}, value);
      }`,P=U("x",e[0].dataType,e[0].dims.length,I===3?1:I),V=U("w",e[1].dataType,e[1].dims.length,Q),J=[P,V],_e=pe("result",e[0].dataType,r.length,Q);if(a){let Xe=U("bias",e[2].dataType,e[2].dims.length,Q);J.push(Xe),Me+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${b?`vec4<${ce}>`:ce} {
          return bias[coords.${l?"w":"y"}${b?"/ 4":""}];
        }`}return`
        ${C_("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${X.registerUniforms(se).declareVariables(...J,_e)}
        ${Me}
        ${Vc(l,B,G,le,a,t,ie[0],ie[1],ie[2],ce)}
        ${b?bo(k,y,ce,void 0,!l,R):yo(k,y,ce,void 0,!l,R,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${I};${b};${B};${G};${le};${z};${O};${R}`,inputDependencies:ke},getRunData:()=>({outputs:[{dims:u?u(r):r,dataType:e[0].dataType}],dispatchGroup:{x:S[0],y:S[1],z:S[2]},programUniforms:ae}),getShaderSource:be}}}),Hc,ya,Rn,Gc,wa,jc,O_,A_,I1=K(()=>{ve(),mr(),Se(),Te(),tn(),lu(),Hc=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},ya=e=>typeof e=="number"?[e,e,e]:e,Rn=(e,t)=>t<=1?e:e+(e-1)*(t-1),Gc=(e,t,r,n=1)=>{let s=Rn(t,n);return Math.floor((e[0]*(r-1)-r+s)/2)},wa=(e,t,r,n,s)=>{s==null&&(s=Gc(e,t[0],n[0]));let i=[0,0,0,r];for(let a=0;a<3;a++)e[a]+2*s>=t[a]&&(i[a]=Math.trunc((e[a]-t[a]+2*s)/n[a]+1));return i},jc=(e,t,r,n,s,i,a,o,u,l)=>{let c,p,h,m;if(e==="VALID"&&(e=0),typeof e=="number"){c={top:e,bottom:e,left:e,right:e,front:e,back:e};let _=wa([t,r,n,1],[o,u,l],1,[s,i,a],e);p=_[0],h=_[1],m=_[2]}else if(Array.isArray(e)){if(!e.every((b,x,w)=>b===w[0]))throw Error(`Unsupported padding parameter: ${e}`);c={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let _=wa([t,r,n,1],[o,u,l],1,[s,i,a],e[0]);p=_[0],h=_[1],m=_[2]}else if(e==="SAME_UPPER"){p=Math.ceil(t/s),h=Math.ceil(r/i),m=Math.ceil(n/a);let _=(p-1)*s+o-t,b=(h-1)*i+u-r,x=(m-1)*a+l-n,w=Math.floor(_/2),y=_-w,k=Math.floor(b/2),S=b-k,I=Math.floor(x/2),z=x-I;c={top:k,bottom:S,left:I,right:z,front:w,back:y}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:c,outDepth:p,outHeight:h,outWidth:m}},O_=(e,t,r,n,s,i=!1,a="channelsLast")=>{let o,u,l,c,p;if(a==="channelsLast")[o,u,l,c,p]=e;else if(a==="channelsFirst")[o,p,u,l,c]=e;else throw new Error(`Unknown dataFormat ${a}`);let[h,,m,_,b]=t,[x,w,y]=ya(r),[k,S,I]=ya(n),z=Rn(m,k),O=Rn(_,S),R=Rn(b,I),{padInfo:B,outDepth:G,outHeight:le,outWidth:ie}=jc(s,u,l,c,x,w,y,z,O,R),ae=i?h*p:h,ke=[0,0,0,0,0];return a==="channelsFirst"?ke=[o,ae,G,le,ie]:a==="channelsLast"&&(ke=[o,G,le,ie,ae]),{batchSize:o,dataFormat:a,inDepth:u,inHeight:l,inWidth:c,inChannels:p,outDepth:G,outHeight:le,outWidth:ie,outChannels:ae,padInfo:B,strideDepth:x,strideHeight:w,strideWidth:y,filterDepth:m,filterHeight:_,filterWidth:b,effectiveFilterDepth:z,effectiveFilterHeight:O,effectiveFilterWidth:R,dilationDepth:k,dilationHeight:S,dilationWidth:I,inShape:e,outShape:ke,filterShape:t}},A_=(e,t,r,n,s,i)=>{let a=i==="channelsLast";a?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],u={x:r.map((x,w)=>w)},l=[Math.ceil(Hc(u.x.map(x=>r[x]))/o[0]),1,1];Ae("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${l}`);let c=1,p=M.size(r),h=[{type:12,data:p},{type:12,data:n},{type:12,data:s},{type:12,data:t.strides},{type:12,data:t.dilations}];Xr(t,h),h.push(...me(e[0].dims,e[1].dims));let m=["rank","rank"],_=e.length===3;_&&(h.push(...me(e[2].dims)),m.push("rank")),h.push(...me(r));let b=x=>{let w=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:n.length},{name:"pads",type:"u32",length:s.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Yr(t,w);let y=1,k=rt(e[0].dataType),S=U("x",e[0].dataType,e[0].dims.length,c),I=U("W",e[1].dataType,e[1].dims.length,y),z=[S,I],O=pe("result",e[0].dataType,r.length,y),R="";if(_){let le=U("bias",e[2].dataType,e[2].dims.length,y);z.push(le),R+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${k} {
          return bias[${a?fe("coords",4,5):fe("coords",1,5)}];
        }`}let B=it(c,k),G=Zr(t,B,k);return`
            ${R}
            fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${S.getByIndices("aIndices")};
            }
            fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
              let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
              return ${I.getByIndices("aIndices")};
            }
          ${x.registerUniforms(w).declareVariables(...z,O)}
          ${x.mainStart()}
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
              let coords = ${O.offsetToIndices("global_idx")};
              let batch = ${fe("coords",0,S.rank)};
              let d2 = ${a?fe("coords",S.rank-1,S.rank):fe("coords",1,S.rank)};
              let xFRCCorner = vec3<u32>(${a?fe("coords",1,S.rank):fe("coords",2,S.rank)},
              ${a?fe("coords",2,S.rank):fe("coords",3,S.rank)},
              ${a?fe("coords",3,S.rank):fe("coords",4,S.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${a?fe("uniforms.x_shape",1,S.rank):fe("uniforms.x_shape",2,S.rank)};
              let xShapeZ = ${a?fe("uniforms.x_shape",2,S.rank):fe("uniforms.x_shape",3,S.rank)};
              let xShapeW = ${a?fe("uniforms.x_shape",3,S.rank):fe("uniforms.x_shape",4,S.rank)};
              let xShapeU = ${a?fe("uniforms.x_shape",4,S.rank):fe("uniforms.x_shape",1,S.rank)};
              let inputDepthNearestVec4 = (xShapeU / 4) * 4;
              let inputDepthVec4Remainder = xShapeU % 4;

              var value = 0.0;
              for (var wF = 0u; wF < uniforms.filter_dims[0]; wF++) {
                let xF = xFCorner + wF * uniforms.dilations[0];
                if (xF < 0 || xF >= xShapeY) {
                  continue;
                }

                for (var wR = 0u; wR < uniforms.filter_dims[1]; wR++) {
                  let xR = xRCorner + wR * uniforms.dilations[1];
                  if (xR < 0 || xR >= xShapeZ) {
                    continue;
                  }

                  for (var wC = 0u; wC < uniforms.filter_dims[2]; wC++) {
                    let xC = xCCorner + wC * uniforms.dilations[2];
                    if (xC < 0 || xC >= xShapeW) {
                      continue;
                    }

                    for (var d1 = 0u; d1 < inputDepthNearestVec4; d1 += 4) {
                      ${a?`let xValues = vec4<f32>(
                               getX(batch, xF, xR, xC, d1),
                               getX(batch, xF, xR, xC, d1 + 1),
                               getX(batch, xF, xR, xC, d1 + 2),
                               getX(batch, xF, xR, xC, d1 + 3));
                            `:`let xValues = vec4<f32>(
                               getX(batch, d1, xF, xR, xC),
                               getX(batch, d1 + 1, xF, xR, xC),
                               getX(batch, d1 + 2, xF, xR, xC),
                               getX(batch, d1 + 3, xF, xR, xC));
                            `}
                            let wValues = vec4<f32>(
                              getW(d2, d1, wF, wR, wC),
                              getW(d2, d1 + 1, wF, wR, wC),
                              getW(d2, d1 + 2, wF, wR, wC),
                              getW(d2, d1 + 3, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                    if (inputDepthVec4Remainder == 1) {
                        ${a?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
                          * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
                    } else if (inputDepthVec4Remainder == 2) {
                      ${a?`let xValues = vec2<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1));
                      `:`let xValues = vec2<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC));
                    `}
                    let wValues = vec2<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC));
                      value += dot(xValues, wValues);
                    } else if (inputDepthVec4Remainder == 3) {
                      ${a?`let xValues = vec3<f32>(
                        getX(batch, xF, xR, xC, inputDepthNearestVec4),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 1),
                        getX(batch, xF, xR, xC, inputDepthNearestVec4 + 2));
                      `:`let xValues = vec3<f32>(
                        getX(batch, inputDepthNearestVec4, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 1, xF, xR, xC),
                        getX(batch, inputDepthNearestVec4 + 2, xF, xR, xC));
                    `}
                    let wValues = vec3<f32>(
                      getW(d2, inputDepthNearestVec4, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 1, wF, wR, wC),
                      getW(d2, inputDepthNearestVec4 + 2, wF, wR, wC));
                      value += dot(xValues, wValues);
                    }
                  }
                }
              }
              ${_?"value = value + getBiasByOutputCoords(coords)":""};
              ${G}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${a};${c};${_}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:l[0],y:l[1],z:l[2]},programUniforms:h}),getShaderSource:b}}}),R_,M_,C1=K(()=>{ve(),Se(),Te(),tn(),R_=(e,t,r,n)=>{let s=e.length>2,i=s?"value += b[output_channel];":"",a=e[0].dims,o=e[1].dims,u=t.format==="NHWC",l=u?r[3]:r[1],c=l/t.group,p=u&&c>=4?Ke(l):1,h=M.size(r)/p,m=[{type:12,data:h},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:c}];Xr(t,m),m.push(...me(a,[o[0],o[1],o[2],o[3]/p]));let _=s?["rank","rank","rank"]:["rank","rank"];m.push(...me([r[0],r[1],r[2],r[3]/p]));let b=x=>{let w=pe("output",e[0].dataType,r.length,p),y=rt(w.type.tensor),k=Zr(t,w.type.value,y),S=U("x",e[0].dataType,a.length),I=U("w",e[1].dataType,o.length,p),z=[S,I];s&&z.push(U("b",e[2].dataType,e[2].dims,p));let O=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Yr(t,O);let R=u?`
      for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[0]; wHeight++) {
        let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

        if (xHeight < 0u || xHeight >= uniforms.x_shape[1]) {
          continue;
        }

        for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[1]; wWidth++) {
          let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
          if (xWidth < 0u || xWidth >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[2]; wInChannel++) {
            let input_channel = in_channel_offset + wInChannel;
            let xVal = ${S.get("batch","xHeight","xWidth","input_channel")};
            let wVal = ${I.get("wHeight","wWidth","wInChannel","output_channel")};
            value += xVal * wVal;
          }
        }
      }
      `:`
      for (var wInChannel: u32 = 0u; wInChannel < uniforms.w_shape[1]; wInChannel++) {
        let input_channel = in_channel_offset + wInChannel;
        for (var wHeight: u32 = 0u; wHeight < uniforms.w_shape[2]; wHeight++) {
          let xHeight = xRCCorner.x + wHeight * uniforms.dilations[0];

          if (xHeight < 0u || xHeight >= uniforms.x_shape[2]) {
            continue;
          }

          for (var wWidth: u32 = 0u; wWidth < uniforms.w_shape[3]; wWidth++) {
            let xWidth = xRCCorner.y + wWidth * uniforms.dilations[1];
            if (xWidth < 0u || xWidth >= uniforms.x_shape[3]) {
              continue;
            }

            let xVal = ${S.get("batch","input_channel","xHeight","xWidth")};
            let wVal = ${I.get("output_channel","wInChannel","wHeight","wWidth")};
            value += xVal * wVal;
          }
        }
      }
      `;return`
  ${x.registerUniforms(O).declareVariables(...z,w)}

  ${x.mainStart()}
    ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let outputIndices = ${w.offsetToIndices("global_idx")};
    let batch: u32 = outputIndices[0];
    let output_channel: u32 = outputIndices[${u?3:1}];
    let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${u?1:2}], outputIndices[${u?2:3}]) * uniforms.strides - uniforms.pads;
    let group_id: u32 = output_channel * ${p} / uniforms.output_channels_per_group;
    var in_channel_offset = group_id * uniforms.w_shape[${u?2:1}];

    var value: ${w.type.value} = ${w.type.value}(0);
    ${R}
    ${i}
    ${k}
    ${w.setByOffset("global_idx","value")}
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${p}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:m}),getShaderSource:b}},M_=(e,t,r,n)=>{let s=e.length>2,i=Ke(r[3]),a=Ke(r[2]),o=M.size(r)/i/a,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/i],l=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/i],c=[r[0],r[1],r[2],r[3]/i],p=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Xr(t,p),p.push(...me(u,l,c));let h=(a-1)*t.strides[1]+l[1],m=_=>{let b=pe("output",e[0].dataType,c.length,i),x=rt(b.type.tensor),w=Zr(t,b.type.value,x),y=U("x",e[0].dataType,u.length,i),k=U("w",e[1].dataType,l.length,i),S=[y,k];s&&S.push(U("b",e[2].dataType,e[2].dims,i));let I=s?"value += b[output_channel];":"",z=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Yr(t,z),`
  ${_.registerUniforms(z).declareVariables(...S,b)}
  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${a}u;
    let col = (index1 % width1) * ${a}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${y.type.value}, ${h}>;
    var values: array<${b.type.value}, ${a}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${l[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${h}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${y.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${y.type.value}(0);
          }
        }
        for (var w_width: u32 = 0u; w_width < ${l[1]}; w_width++) {
          let w_val = ${k.get("w_height","w_width","0","output_channel")};
          for (var i = 0u; i < ${a}u; i++) {
            values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
          }
        }
      }
    }

    for (var i = 0u; i < ${a}u; i++) {
      var value = values[i];
      ${I}
      ${w}
      ${b.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${i};${a};${h};${l[0]};${l[1]}`,inputDependencies:s?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p}),getShaderSource:m}}}),Kc,Ri,Qc,Mi,wo,va,Zc,Xc,vo,z1=K(()=>{Se(),E1(),I1(),pu(),C1(),tn(),cu(),Br(),Kc=(e,t,r,n,s,i)=>{let a=e[0],o=e.slice(i?1:2,i?3:4),u=o.length,l=t[0],c=t.slice(2).map((h,m)=>h+(h-1)*(r[m]-1)),p=o.map((h,m)=>h+n[m]+n[m+u]).map((h,m)=>Math.floor((h-c[m]+s[m])/s[m]));return p.splice(0,0,a),p.splice(i?3:1,0,l),p},Ri=[2,3,1,0],Qc=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],n=e[1].dims[1]*t.group;if(r!==n)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let s=e[0].dims.length-2;if(t.dilations.length!==s)throw new Error(`dilations should be ${s}D`);if(t.strides.length!==s)throw new Error(`strides should be ${s}D`);if(t.pads.length!==s*2)throw new Error(`pads should be ${s*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Mi=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let i=2;i<t[1].dims.length;++i)r[i-2]===0&&(r[i-2]=t[1].dims[i]);let n=e.pads.slice();ts.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,n,e.format==="NHWC",e.autoPad);let s=Object.assign({},e);return Object.assign(s,{kernelShape:r,pads:n}),s},wo=e=>{let t=uu(e),r=e.format,n=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],s=e.dilations,i=e.group,a=e.kernel_shape,o=e.pads,u=e.strides,l=e.w_is_const();return{autoPad:n,format:r,dilations:s,group:i,kernelShape:a,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},va=(e,t,r,n)=>{let s=r.format==="NHWC",i=Kc(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,s);if(r.group!==1){let z=[t[0]];if(s){let O=e.kernelCustomData.wT??e.compute(It(t[1],Ri),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=O),z.push(O)}else z.push(t[1]);t.length===3&&z.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&s&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(M_(z,r,i,n),{inputs:z}):e.compute(R_(z,r,i,n),{inputs:z});return}let a=t.length===3,o=t[0].dims[s?1:2],u=t[0].dims[s?2:3],l=t[0].dims[s?3:1],c=t[1].dims[2],p=t[1].dims[3],h=i[s?1:2],m=i[s?2:3],_=i[s?3:1],b=s&&c===o&&p===u&&r.pads[0]===0&&r.pads[1]===0;if(b||c===1&&p===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let z=i[0],O,R,B,G=[];if(s){let ae=e.kernelCustomData.wT??e.compute(It(t[1],Ri),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=ae),b){let ke=o*u*l;O=t[0].reshape([1,z,ke]),R=ae.reshape([1,ke,_]),B=[1,z,_]}else O=t[0].reshape([z,o*u,l]),R=ae.reshape([1,l,_]),B=[z,h*m,_];G.push(O),G.push(R)}else O=t[0].reshape([z,l,o*u]),R=t[1].reshape([1,_,l]),B=[z,_,h*m],G.push(R),G.push(O);a&&G.push(t[2]);let le=B[2],ie=G[0].dims[G[0].dims.length-1];le<8&&ie<8?e.compute(du(G,r,i,B,s,n),{inputs:G}):e.compute(ns(G,r,i,B,s,n),{inputs:G});return}let x=!0,w=e.kernelCustomData.wT??e.compute(It(t[1],Ri),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=w);let y=[t[0],w];a&&y.push(t[2]);let k=s?h*m:_,S=s?_:h*m,I=c*p*l;e.compute(z_(y,r,i,k,S,I,a,x,n),{inputs:y})},Zc=(e,t)=>{let r=t.format==="NHWC",n=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&n.push(e.inputs[2]);let s=[0,t.pads[0],0,t.pads[1]],i=[1].concat(t.strides),a=[1].concat(t.dilations),o=[1].concat(t.kernelShape),u=Mi({...t,pads:s,strides:i,dilations:a,kernelShape:o},n);va(e,n,u,l=>r?[l[0],l[2],l[3]]:[l[0],l[1],l[3]])},Xc=(e,t,r)=>{let n=r.format==="NHWC"?"channelsLast":"channelsFirst",s=Mi(r,t),i=r.autoPad==="NOTSET"?r.pads:r.autoPad,a=O_(t[0].dims,t[1].dims,r.strides,r.dilations,i,!1,n);e.compute(A_(t,s,a.outShape,[a.filterDepth,a.filterHeight,a.filterWidth],[a.padInfo.front,a.padInfo.top,a.padInfo.left],n))},vo=(e,t)=>{if(Qc(e.inputs,t),e.inputs[0].dims.length===3)Zc(e,t);else if(e.inputs[0].dims.length===5)Xc(e,e.inputs,t);else{let r=Mi(t,e.inputs);va(e,e.inputs,r)}}}),B_,O1=K(()=>{ve(),mr(),Se(),Te(),B_=(e,t,r)=>{let n=e.length>2,s=t.outputShape,i=t.format==="NHWC",a=t.group,o=e[1].dims,u=o[2]/a,l=o[3],c=i?Ke(u):1,p=i&&l===1&&u>=4,h=p?Math.floor(u/4)*4:Math.floor(u/c)*c,m=u-h,_=i?Ke(l):1,b=i?l===1?c:_:1,x=M.size(s)/_,w=[Math.ceil(x/64),1,1];Ae("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${w}`);let y=["rank","rank"],k=[t.strides[0],t.strides[1]],S=[t.kernelShape[i?1:2],t.kernelShape[i?2:3]],I=[t.dilations[0],t.dilations[1]],z=[S[0]+(t.dilations[0]<=1?0:(t.kernelShape[i?1:2]-1)*(t.dilations[0]-1)),S[1]+(t.dilations[1]<=1?0:(t.kernelShape[i?2:3]-1)*(t.dilations[1]-1))],O=[z[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),z[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],R=[{type:12,data:x},{type:12,data:k},{type:12,data:S},{type:12,data:I},{type:12,data:z},{type:6,data:O},{type:12,data:h},{type:12,data:u},{type:12,data:l},...me(e[0].dims,e[1].dims)];n&&(R.push(...me(e[2].dims)),y.push("rank")),R.push(...me(s));let B=G=>{let le=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:k.length},{name:"filter_dims",type:"u32",length:S.length},{name:"dilations",type:"u32",length:S.length},{name:"effective_filter_dims",type:"u32",length:z.length},{name:"pads",type:"i32",length:O.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],ie=rt(e[0].dataType),ae=i?1:2,ke=i?2:3,be=i?3:1,X=U("W",e[1].dataType,e[1].dims.length,b),se=U("Dy",e[0].dataType,e[0].dims.length,c),Q=[se,X];n&&Q.push(U("bias",e[2].dataType,[s[be]].length,_));let ce=pe("result",e[0].dataType,s.length,_),Me=()=>{let J="";if(p)c===4?J+=`
        let xValue = ${se.getByOffset("x_offset")};
        let wValue = ${X.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:c===2?J+=`
          dotProd = dotProd + dot(vec4<${ie}>(${se.getByOffset("x_offset")}, ${se.getByOffset("x_offset + 1u")}), vec4<${ie}>(${X.getByOffset("w_offset")}, ${X.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:c===1&&(J+=`
          dotProd = dotProd + dot(vec4<${ie}>(${se.getByOffset("x_offset")}, ${se.getByOffset("x_offset + 1u")}, ${se.getByOffset("x_offset + 2u")}, ${se.getByOffset("x_offset + 3u")}), vec4<${ie}>(${X.getByOffset("w_offset")}, ${X.getByOffset("w_offset + 1u")}, ${X.getByOffset("w_offset + 2u")}, ${X.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(J+=`
                  let xValue = ${i?se.getByOffset(`${se.indicesToOffset(`${se.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c}`):se.get("batch","inputChannel","idyR","idyC")};
        `,c===1)J+=`
          let w_offset = ${X.indicesToOffset(`${X.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${X.getByOffset(`w_offset / ${b}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let _e=0;_e<c;_e++)J+=`
            let wValue${_e} = ${X.getByOffset(`${X.indicesToOffset(`${X.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${_e}, wOutChannel)`)} / ${b}`)};
            dotProd = dotProd + xValue[${_e}] * wValue${_e};`;return J},P=()=>{if(m===0)return"";if(!p)throw new Error(`packInputAs4 ${p} is not true.`);let J="";if(c===1){J+="dotProd = dotProd";for(let _e=0;_e<m;_e++)J+=`
            + ${se.getByOffset(`x_offset + ${_e}`)} * ${X.getByOffset(`w_offset + ${_e}`)}`;J+=";"}else if(c===2){if(m!==2)throw new Error(`Invalid inputChannelsRemainder ${m}.`);J+=`
          let xValue = ${se.getByOffset("x_offset")};
          let wValue = ${X.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return J},V=`
            let outputIndices = ${ce.offsetToIndices(`global_idx * ${_}`)};
            let batch = ${ce.indicesGet("outputIndices",0)};
            let d1 = ${ce.indicesGet("outputIndices",be)};
            let r = ${ce.indicesGet("outputIndices",ae)};
            let c = ${ce.indicesGet("outputIndices",ke)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${ce.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${ie}(dyRCorner) + ${ie}(wR)) / ${ie}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${ie}(uniforms.Dy_shape[${ae}]) || fract(dyR) > 0.0 ||
                  wRPerm < 0) {
                continue;
              }
              let idyR: u32 = u32(dyR);
              var wC: u32 = 0;
              if (uniforms.dilations.y == 1) {
                // Minimum wC >= 0 that satisfies (dyCCorner + wC) % (uniforms.strides.y) == 0
                wC = u32(((dyCCorner + i32(uniforms.strides.y) - 1) / i32(uniforms.strides.y)) * i32(uniforms.strides.y) - dyCCorner);
              }
              for (; wC < uniforms.effective_filter_dims.y; wC = wC + 1) {
                if (wC % uniforms.dilations.y != 0) {
                  continue;
                }
                let dyC = (${ie}(dyCCorner) + ${ie}(wC)) / ${ie}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${ie}(uniforms.Dy_shape[${ke}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${p?`
                var x_offset = ${se.indicesToOffset(`${se.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c};
                var w_offset = ${X.indicesToOffset(`${X.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${b};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${p?4:c}) {
                  ${Me()}
                  inputChannel = inputChannel + ${p?4:c};
                }
                ${P()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${n?` + bias[d1 / ${_}]`:""};
            ${ce.setByOffset("global_idx","value")};
          `;return`
    ${G.registerUniforms(le).declareVariables(...Q,ce)}
      ${G.mainStart()}
      ${G.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${V}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${c}${b}${_}${p}${m}`,inputDependencies:y},getRunData:()=>({dispatchGroup:{x:w[0],y:w[1],z:w[2]},outputs:[{dims:r?r(s):s,dataType:e[0].dataType}],programUniforms:R}),getShaderSource:B}}}),Yc,Jc,ep,$a,N_,tp,xa,rp,P_,A1=K(()=>{O1(),tn(),Br(),Yc=(e,t,r,n,s,i)=>(e-1)*t+r+(n-1)*s+1-i,Jc=(e,t,r,n,s)=>{let i=Math.floor(e/2);t==="SAME_UPPER"?(r[n]=i,r[s]=e-i):t==="SAME_LOWER"&&(r[n]=e-i,r[s]=i)},ep=(e,t,r,n,s,i,a,o,u,l)=>{let c=e.length-2,p=l.length===0;u.length<c&&u.push(...Array(c-u.length).fill(0));let h=e[0],m=t[o?3:1]*s;for(let _=0,b=e.length-c-(o?1:0);_<c;++_,++b){let x=e[b],w=p?x*a[_]:l[_],y=Yc(x,a[_],i[_],t[b],r[_],w);Jc(y,n,i,_,_+c),p&&l.push(a[_]*(x-1)+u[_]+(t[b]-1)*r[_]+1-i[_]-i[_+c])}l.splice(0,0,h),l.splice(o?3:1,0,m)},$a=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((p,h)=>p*h,1)===0){r.length=0;for(let p=2;p<t[1].dims.length;++p)r.push(t[1].dims[p])}let n=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(n?3:1,0,t[1].dims[1]);let s=e.pads.slice(),i=e.outputShape.slice(),a=e.outputPadding.slice(),o=t[0].dims,u=e.dilations.slice();if(u.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;u=new Array(p).fill(1)}let l=e.strides.slice();if(l.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;l=new Array(p).fill(1)}ep(o,r,u,e.autoPad,e.group,s,l,n,a,i);let c=Object.assign({},e);return Object.assign(c,{kernelShape:r,pads:s,outputPadding:a,outputShape:i,dilations:u,strides:l}),c},N_=e=>{let t=uu(e),r=e.format,n=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],s=e.dilations,i=e.group,a=e.kernelShape,o=e.pads,u=e.strides,l=e.wIsConst(),c=e.outputPadding,p=e.outputShape;return{autoPad:n,format:r,dilations:s,group:i,kernelShape:a,outputPadding:c,outputShape:p,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},tp=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],n=e[1].dims[0];if(r!==n)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let s=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==s))throw new Error("invalid bias");let i=e[0].dims.length-2;if(t.dilations.reduce((a,o)=>a+o,0)>0&&t.dilations.length!==i)throw new Error(`dilations should be ${i}D`);if(t.strides.reduce((a,o)=>a+o,0)>0&&t.strides.length!==i)throw new Error(`strides should be ${i}D`);if(t.pads.reduce((a,o)=>a+o,0)>0&&t.pads.length!==i*2)throw new Error(`pads should be ${i*2}D`);if(t.outputPadding.length!==i&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${i}D`);if(t.kernelShape.reduce((a,o)=>a+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},xa=(e,t,r,n)=>{let s=e.kernelCustomData.wT??e.compute(It(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=s);let i=[t[0],s];t.length===3&&i.push(t[2]),e.compute(B_(i,r,n),{inputs:i})},rp=(e,t)=>{let r=t.format==="NHWC",n=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&n.push(e.inputs[2]);let s=t.kernelShape;(s.length===0||s[0]===0)&&(s=[e.inputs[1].dims[2]]);let i=t.dilations;(i.length===0||i[0]===0)&&(i=[1]);let a=t.strides;(a.length===0||a[0]===0)&&(a=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],a=[1].concat(a),i=[1].concat(i),s=[1].concat(s);let u=t.outputPadding;u=[0].concat(u);let l=$a({...t,pads:o,strides:a,dilations:i,kernelShape:s,outputPadding:u},n);xa(e,n,l,c=>r?[c[0],c[2],c[3]]:[c[0],c[1],c[3]])},P_=(e,t)=>{if(tp(e.inputs,t),e.inputs[0].dims.length===3)rp(e,t);else{let r=$a(t,e.inputs);xa(e,e.inputs,r)}}}),np,D_,U_,R1=K(()=>{ve(),Se(),Ze(),Te(),np=(e,t,r,n)=>{let s=M.size(t),i=t.length,a=U("input",e,i),o=pe("output",e,i),u=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),l=M.normalizeAxis(u,i),c=p=>{let h=` i32(${a.indicesGet("inputIndices","uniforms.axis")}) `,m=fe("uniforms.input_shape","uniforms.axis",i),_=n.reverse?h+(n.exclusive?" + 1":""):"0",b=n.reverse?m:h+(n.exclusive?"":" + 1");return`
                ${p.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(a,o)}
                ${p.mainStart()}
                  ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${o.offsetToIndices("global_idx")};
                  var sum = ${o.type.value}(0);
                  let first : i32 = ${_};
                  let last : i32 = ${b};
                  for (var i : i32 = first; i < last; i++) {
                    ${a.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${a.getByIndices("inputIndices")};
                  }
                  ${o.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:n.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:[{type:12,data:s},{type:12,data:l},...me(t,t)]}),getShaderSource:c}},D_=(e,t)=>{let r=e.inputs[0].dims,n=e.inputs[0].dataType,s=e.inputs[1];e.compute(np(n,r,s,t),{inputs:[0]})},U_=e=>{let t=e.exclusive===1,r=e.reverse===1;return Pe({exclusive:t,reverse:r})}}),ip,sp,ap,W_,L_,M1=K(()=>{ve(),Se(),Ze(),Te(),ip=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},sp=(e,t,r,n)=>{let s=[];s.push(`fn perm(i: ${n.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let i=0;i<t;++i)s.push(r.indicesSet("a",e[i],`i[${i}]`));return s.push("return a;}"),s.join(`
`)},ap=(e,t)=>{let r,n,s,i,a,o,u=t.format==="NHWC",l=t.blocksize,c=t.mode==="DCR";u?([r,n,s,i]=e.dims,a=c?[r,n,s,l,l,i/l**2]:[r,n,s,i/l**2,l,l],o=c?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,n,s,i]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],a=c?[r,l,l,i/l**2,n,s]:[r,i/l**2,l,l,n,s],o=c?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let p=e.reshape(a),h=p.dims.length,m=e.dataType,_=U("a",m,h),b=pe("output",m,h),x=w=>`
  ${w.registerUniform("output_size","u32").declareVariables(_,b)}

  ${sp(o,h,_,b)}

  ${w.mainStart()}
    ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${b.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${b.setByOffset("global_idx",_.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:w=>{let y=u?[r,n*l,s*l,i/l**2]:[r,i/l**2,n*l,s*l],k=M.size(y),S=p.dims,I=M.sortBasedOnPerm(S,o);return{outputs:[{dims:y,dataType:w[0].dataType}],dispatchGroup:{x:Math.ceil(k/64)},programUniforms:[{type:12,data:k},...me(S,I)]}},getShaderSource:x}},W_=(e,t)=>{ip(e.inputs),e.compute(ap(e.inputs[0],t))},L_=e=>Pe({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Bi,Mn,Sa,op,up,lp,dp,ka,cp,q_,F_,B1=K(()=>{ve(),Se(),Ze(),Te(),Bi="[a-zA-Z]|\\.\\.\\.",Mn="("+Bi+")+",Sa="^"+Mn+"$",op="("+Mn+",)*"+Mn,up="^"+op+"$",lp=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},dp=class{constructor(e,t){var s;this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,n]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(up)))throw new Error("Invalid LHS term");if(r.split(",").forEach((i,a)=>{let o=e[a].dims.slice();if(!i.match(RegExp(Sa)))throw new Error("Invalid LHS term");let u=this.processTerm(i,!0,o,a);this.lhs.push(u)}),n==="")n+=[...this.symbolToInfo.entries()].filter(([i,a])=>a.count===1||i==="...").map(([i])=>i).join("");else if(!n.match(RegExp(Mn)))throw new Error("Invalid RHS");(s=n.match(RegExp(Bi,"g")))==null||s.forEach(i=>{if(i==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let a=this.symbolToInfo.get(i);if(a===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(a.dimValue)}}),this.rhs=this.processTerm(n,!1,this.outputDims)}addSymbol(e,t,r){let n=this.symbolToInfo.get(e);if(n!==void 0){if(n.dimValue!==t&&n.count!==1)throw new Error("Dimension mismatch");n.count++,n.inputIndices.push(r)}else n={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,n)}processTerm(e,t,r,n=-1){let s=r.length,i=!1,a=[],o=0;if(!e.match(RegExp(Sa))&&!t&&e!=="")throw new Error("Invalid LHS term");let u=e.match(RegExp(Bi,"g")),l=new lp(n);return u==null||u.forEach((c,p)=>{if(c==="..."){if(i)throw new Error("Only one ellipsis is allowed per input term");i=!0;let h=s-u.length+1;if(h<0)throw new Error("Ellipsis out of bounds");if(a=r.slice(o,o+h),this.hasEllipsis){if(this.ellipsisDims.length!==a.length||this.ellipsisDims.toString()!==a.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=a;else throw new Error("Ellipsis must be specified in the LHS");for(let m=0;m<a.length;m++){let _=String.fromCharCode(48+m);l.addSymbol(_,p+m),this.addSymbol(_,r[o++],n)}}else l.addSymbol(c,p+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(c,r[o++],n)}),l}},ka=e=>e+"_max",cp=(e,t,r,n)=>{let s=e.map(l=>l.length).map((l,c)=>U(`input${c}`,t,l)),i=M.size(n),a=pe("output",t,n.length),o=[...r.symbolToInfo.keys()].filter(l=>!r.rhs.symbolToIndices.has(l)),u=l=>{let c=[],p="var prod = 1.0;",h="var sum = 0.0;",m="sum += prod;",_=[],b=[],x=[],w=[],y=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((S,I)=>{var z;if(r.rhs.symbolToIndices.has(I)){let O=(z=r.rhs.symbolToIndices.get(I))==null?void 0:z[0];O!==void 0&&r.lhs.forEach((R,B)=>{if(S.inputIndices.includes(B)){let G=R.symbolToIndices.get(I);if(G===void 0)throw new Error("Invalid symbol error");G.forEach(le=>{c.push(`${s[B].indicesSet(`input${B}Indices`,le,a.indicesGet("outputIndices",O))}`)})}})}else r.lhs.forEach((O,R)=>{if(S.inputIndices.includes(R)){let B=O.symbolToIndices.get(I);if(B===void 0)throw new Error("Invalid symbol error");B.forEach(G=>{_.push(`${s[R].indicesSet(`input${R}Indices`,G,`${I}`)}`)}),w.push(`prod *= ${s[R].getByIndices(`input${R}Indices`)};`)}}),b.push(`for(var ${I}: u32 = 0; ${I} < uniforms.${ka(I)}; ${I}++) {`),x.push("}")});let k=y?[...c,`let sum = ${s.map((S,I)=>S.getByIndices(`input${I}Indices`)).join(" * ")};`]:[...c,h,...b,..._,p,...w,m,...x];return`
            ${l.registerUniforms(o.map(S=>({name:`${ka(S)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...s,a)}

            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${a.offsetToIndices("global_idx")};
            ${s.map((S,I)=>`var input${I}Indices: ${s[I].type.indices};`).join(`
`)}
            ${k.join(`
`)};
            ${a.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let l=o.filter(p=>r.symbolToInfo.has(p)).map(p=>{var h;return{type:12,data:((h=r.symbolToInfo.get(p))==null?void 0:h.dimValue)||0}});l.push({type:12,data:i});let c=e.map((p,h)=>[...me(p)]).reduce((p,h)=>p.concat(h),l);return c.push(...me(n)),{outputs:[{dims:n,dataType:t}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:c}},getShaderSource:u}},q_=(e,t)=>{let r=new dp(e.inputs,t.equation),n=r.outputDims,s=e.inputs.map((i,a)=>i.dims);e.compute(cp(s,e.inputs[0].dataType,r,n))},F_=e=>{let t=e.equation.replace(/\s+/g,"");return Pe({equation:t})}}),pp,Ta,fp,hp,V_,N1=K(()=>{ve(),Se(),Te(),pp=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),n=r.length<t.length?0:r.length-t.length,s=t.length<r.length?0:t.length-r.length;for(;n<r.length&&s<t.length;++n,++s)if(r[n]!==t[s]&&r[n]!==1&&t[s]!==1)throw new Error("Expand requires shape to be broadcastable to input")},Ta=(e,t)=>{let r=e.length-t.length,n=[];for(let s=0;s<r;++s)n.push(e[s]);for(let s=0;s<t.length;++s)n.push(t[s]===1?e[s+r]:t[s]);return n},fp=(e,t)=>e.length>t.length?Ta(e,t):Ta(t,e),hp=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),n=fp(t,r),s=e[0].dataType,i=s===9||M.size(t)===1,a=s===9||t.length>0&&t[t.length-1]%4===0?4:1,o=i||n.length>0&&n[n.length-1]%4===0?4:1,u=Math.ceil(M.size(n)/o),l=p=>{let h=U("input",s,t.length,a),m=pe("output",s,n.length,o),_;if(s===9){let b=(x,w,y="")=>`
          let outputIndices${w} = ${m.offsetToIndices(`outputOffset + ${w}u`)};
          let offset${w} = ${h.broadcastedIndicesToOffset(`outputIndices${w}`,m)};
          let index${w} = offset${w} / 4u;
          let component${w} = offset${w} % 4u;
          ${x}[${w}] = ${y}(${h.getByOffset(`index${w}`)}[component${w}]);
        `;_=`
        let outputOffset = global_idx * ${o};
        var data = vec4<u32>(0);
        ${b("data",0,"u32")}
        ${b("data",1,"u32")}
        ${b("data",2,"u32")}
        ${b("data",3,"u32")}
        ${m.setByOffset("global_idx","data")}
      }`}else _=`
        let outputIndices = ${m.offsetToIndices(`global_idx * ${o}`)};
        let inputOffset = ${h.broadcastedIndicesToOffset("outputIndices",m)};
        let data = ${m.type.value}(${h.getByOffset(`inputOffset / ${a}`)});
        ${m.setByOffset("global_idx","data")}
      }`;return`
    ${p.registerUniform("vec_size","u32").declareVariables(h,m)}
    ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${_}`},c=[{type:12,data:u},...me(t,n)];return{name:"Expand",shaderCache:{hint:`${n.length};${a}${o}`,inputDependencies:["rank"]},getShaderSource:l,getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:c})}},V_=e=>{pp(e.inputs),e.compute(hp(e.inputs),{inputs:[0]})}}),mp,H_,P1=K(()=>{ve(),Se(),Te(),ou(),mp=e=>{let t=e[0].dataType,r=M.size(e[0].dims),n=M.size(e[1].dims),s=n%4===0,i=a=>{let o=U("x",t,[1],4),u=U("bias",t,[1],4),l=pe("y",t,[1],4),c=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],p=m=>`
      let bias${m}_offset: u32 = (global_idx * 4 + ${m}) % uniforms.bias_size;
      let bias${m} = ${u.getByOffset(`bias${m}_offset / 4`)}[bias${m}_offset % 4];`,h=s?`
      let bias = ${u.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${p(0)}${p(1)}${p(2)}${p(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${a.registerUniforms(c).declareVariables(o,u,l)}

    ${go(ut(t))}

    ${a.mainStart(yn)}
      ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${h}
      let x_in = x + bias;
      ${l.setByOffset("global_idx",_o("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${s}`,inputDependencies:["type","type"]},getShaderSource:i,getRunData:a=>({outputs:[{dims:a[0].dims,dataType:a[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:n}],dispatchGroup:{x:Math.ceil(r/yn/4)}})}},H_=e=>{e.inputs.length<2||M.size(e.inputs[1].dims)===0?c_(e):e.compute(mp(e.inputs))}}),gp,_p,G_,j_,D1=K(()=>{ve(),Se(),Ze(),Te(),gp=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},_p=(e,t)=>{let r=e[0].dims,n=e[1].dims,s=r.length,i=M.normalizeAxis(t.axis,s),a=r.slice(0);a.splice(i,1,...n);let o=r[i],u=e[0].dataType===9?4:1,l=Math.ceil(M.size(a)/u),c=[{type:12,data:l},{type:6,data:o},{type:12,data:i},...me(e[0].dims,e[1].dims,a)],p=h=>{let m=U("data",e[0].dataType,e[0].dims.length,u),_=U("inputIndices",e[1].dataType,e[1].dims.length),b=pe("output",e[0].dataType,a.length,u),x=y=>{let k=n.length,S=`var indicesIndices${y}  = ${_.type.indices}(0);`;for(let I=0;I<k;I++)S+=`${k>1?`indicesIndices${y}[${I}]`:`indicesIndices${y}`} = ${a.length>1?`outputIndices${y}[uniforms.axis + ${I}]`:`outputIndices${y}`};`;S+=`
          var idx${y} = ${_.getByIndices(`indicesIndices${y}`)};
          if (idx${y} < 0) {
            idx${y} = idx${y} + uniforms.axisDimLimit;
          }
          var dataIndices${y} : ${m.type.indices};
        `;for(let I=0,z=0;I<s;I++)I===i?(S+=`${s>1?`dataIndices${y}[${I}]`:`dataIndices${y}`} = u32(idx${y});`,z+=k):(S+=`${s>1?`dataIndices${y}[${I}]`:`dataIndices${y}`} = ${a.length>1?`outputIndices${y}[${z}]`:`outputIndices${y}`};`,z++);return S},w;if(e[0].dataType===9){let y=(k,S,I="")=>`
          let outputIndices${S} = ${b.offsetToIndices(`outputOffset + ${S}u`)};
          ${x(S)};
          let offset${S} = ${m.indicesToOffset(`dataIndices${S}`)};
          let index${S} = offset${S} / 4u;
          let component${S} = offset${S} % 4u;
          ${k}[${S}] = ${I}(${m.getByOffset(`index${S}`)}[component${S}]);
        `;w=`
        let outputOffset = global_idx * ${u};
        var value = vec4<u32>(0);
        ${y("value",0,"u32")}
        ${y("value",1,"u32")}
        ${y("value",2,"u32")}
        ${y("value",3,"u32")}
        ${b.setByOffset("global_idx","value")}
      `}else w=`
      let outputIndices = ${b.offsetToIndices("global_idx")};
      ${x("")};
      let value = ${m.getByIndices("dataIndices")};
      ${b.setByOffset("global_idx","value")};
      `;return`
      ${h.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(m,_,b)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${w}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:c}),getShaderSource:p}},G_=e=>Pe({axis:e.axis}),j_=(e,t)=>{let r=e.inputs;gp(r),e.compute(_p(e.inputs,t))}}),bp,K_,Q_,U1=K(()=>{ve(),Se(),Te(),bp=(e,t,r,n,s,i,a,o,u)=>{let l=[{type:12,data:i},{type:12,data:n},{type:12,data:s},{type:12,data:r},{type:12,data:a},{type:12,data:o},{type:12,data:u}],c=[i];l.push(...me(t.dims,c));let p=h=>{let m=U("indices_data",t.dataType,t.dims.length),_=pe("input_slice_offsets_data",12,1,1),b=[m,_],x=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:s.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${h.registerUniforms(x).declareVariables(...b)}
  ${h.mainStart()}
    ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let batch_idx = global_idx / uniforms.num_slices_per_batch;
    let base_offset = batch_idx * uniforms.input_batch_stride;

    let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
    var relative_slice_offset = 0;
    for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
      var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
      let input_dim_idx = uniforms.batch_dims + dim_idx;
      if (index < 0) {
        ${s.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
      }
      ${r.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
    }

    input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${s.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:c,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:l}),getShaderSource:p},{inputs:[t],outputs:[-1]})[0]},K_=(e,t)=>{let r=e.inputs,n=r[0].dims,s=r[0].dataType,i=r[1].dims,a=i[i.length-1],o=M.sizeToDimension(i,i.length-1),u=M.sizeFromDimension(n,t.batchDims+a),l=M.sizeToDimension(n,t.batchDims),c=M.sizeFromDimension(n,t.batchDims),p=o/l,h=new Array(a),m=u;for(let S=0;S<a;++S)h[a-1-S]=m,m*=n[t.batchDims+a-1-S];let _=bp(e,r[1],h,t.batchDims,n,o,p,c,a),b=t.batchDims+a;if(b>n.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let x=i.slice(0,-1).concat(n.slice(b)),w=M.size(x),y=[{type:12,data:w},{type:12,data:u},...me(r[0].dims,_.dims,x)],k=S=>{let I=U("data",r[0].dataType,r[0].dims.length),z=U("slice_offsets",12,_.dims.length),O=pe("output",r[0].dataType,x.length);return`
          ${S.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(I,z,O)}
            ${S.mainStart()}
            ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:x,dataType:s}],dispatchGroup:{x:Math.ceil(w/64)},programUniforms:y}),getShaderSource:k},{inputs:[r[0],_]})},Q_=e=>({batchDims:e.batch_dims,cacheKey:""})}),yp,wp,Z_,X_,W1=K(()=>{ve(),Se(),Ze(),Te(),yp=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=M.normalizeAxis(t.quantizeAxis,e[0].dims.length),n=t.blockSize,s=e[0],i=e[2],a=e.length===4?e[3]:void 0;if(i.dims.length!==s.dims.length||!s.dims.map((o,u)=>u===r?Math.ceil(o/n)===i.dims[u]:o===i.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(a){if(a.dataType!==s.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(a.dims.length!==i.dims.length||!a.dims.map((o,u)=>o===i.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},wp=(e,t)=>{let r=e[0].dims,n=e[1].dims,s=r.length,i=M.normalizeAxis(t.gatherAxis,s),a=M.normalizeAxis(t.quantizeAxis,s),o=r.slice(0);o.splice(i,1,...n);let u=M.size(o),l=e[2].dataType,c=e[0].dataType===22,p=[{type:12,data:u},{type:12,data:a},{type:12,data:i},{type:12,data:t.blockSize},...me(...e.map((m,_)=>m.dims),o)],h=m=>{let _=U("data",e[0].dataType,e[0].dims.length),b=U("inputIndices",e[1].dataType,e[1].dims.length),x=U("scales",e[2].dataType,e[2].dims.length),w=e.length>3?U("zeroPoint",e[3].dataType,e[3].dims.length):void 0,y=pe("output",l,o.length),k=[_,b,x];w&&k.push(w);let S=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${m.registerUniforms(S).declareVariables(...k,y)}
        ${m.mainStart()}
        let output_indices = ${y.offsetToIndices("global_idx")};
        var indices_indices = ${b.type.indices}(0);
        ${n.length>1?`
          for (var i: u32 = 0; i < ${n.length}; i++) {
            let index = ${y.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${b.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${y.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${_.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${y.indicesGet("output_indices","i")};
          ${_.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${b.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[i]};
        }
        ${_.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${o.length}; i++) {
          let index = ${y.indicesGet("output_indices",`i + ${n.length} - 1`)};
          ${_.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${_.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${_.getByOffset("data_offset / 8")};
        let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
        let quantized_data_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
        let quantized_data = quantized_data_vec[data_index / 2];
        var scale_indices = data_indices;
        let quantize_axis_index = ${x.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
        ${x.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
        var scale = ${x.getByIndices("scale_indices")};
        ${w?`
              let zero_point_indices = scale_indices;
              let zero_point_offset = ${w.indicesToOffset("zero_point_indices")};
              let zero_point_index = zero_point_offset % 8;
              let packed_4bit_zero_points = ${w.getByOffset("zero_point_offset / 8")};
              let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
              let zero_point_vec = ${c?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
              let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
        let dequantized_data = ${ut(l)}(quantized_data - zero_point) * scale;
        ${y.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((m,_)=>_!==1).map(m=>m.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(m,_)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:l}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:p}),getShaderSource:h}},Z_=(e,t)=>{let r=e.inputs;yp(r,t),e.compute(wp(e.inputs,t))},X_=e=>Pe({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),vp,$p,Y_,J_,L1=K(()=>{ve(),Se(),Ze(),Te(),vp=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},$p=(e,t)=>{let r=e[0].dims,n=e[0].dataType,s=r.length,i=e[1].dims,a=e[1].dataType,o=M.normalizeAxis(t.axis,s),u=r[o],l=i.slice(0),c=M.size(l),p=U("input",n,s),h=U("indicesInput",a,i.length),m=pe("output",n,l.length),_=[{type:12,data:c},{type:6,data:u},{type:12,data:o}];return _.push(...me(r,i,l)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:l,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:_}),getShaderSource:b=>`
      ${b.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(p,h,m)}
      ${b.mainStart()}
      ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${m.offsetToIndices("global_idx")};

      var idx = ${h.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${p.type.indices}(outputIndices);
      ${p.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${p.getByIndices("inputIndices")};

      ${m.setByOffset("global_idx","value")};
  }`}},Y_=e=>Pe({axis:e.axis}),J_=(e,t)=>{let r=e.inputs;vp(r),e.compute($p(e.inputs,t))}}),xp,Sp,eb,tb,q1=K(()=>{ve(),Se(),Te(),xp=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},Sp=(e,t)=>{let r=e[0].dims.slice(),n=e[1].dims.slice(),[s,i,a]=Ym.getShapeOfGemmResult(r,t.transA,n,t.transB,e.length===3?e[2].dims:void 0),o=[s,i];if(!o)throw new Error("Can't use gemm on the given tensors");let u=16,l=Math.ceil(i/u),c=Math.ceil(s/u),p=!0,h=M.size(o),m=[{type:12,data:p?l:h},{type:12,data:s},{type:12,data:i},{type:12,data:a},{type:1,data:t.alpha},{type:1,data:t.beta}],_=["type","type"];e.length===3&&(m.push(...me(e[2].dims)),_.push("rank")),m.push(...me(o));let b=w=>{let y="";t.transA&&t.transB?y="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?y="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?y="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(y="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let k=t.alpha===1?"":"value *= uniforms.alpha;",S=U("a",e[0].dataType,e[0].dims),I=U("b",e[1].dataType,e[1].dims),z=S.type.value,O=null,R=[S,I];e.length===3&&(O=U("c",e[2].dataType,e[2].dims.length),R.push(O));let B=pe("output",e[0].dataType,o.length);R.push(B);let G=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${w.registerUniforms(G).declareVariables(...R)}

  ${w.mainStart()}
    ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${z}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${y}
    }

    ${k}
    ${O!=null?`let cOffset = ${O.broadcastedIndicesToOffset("vec2(m, n)",B)}; value += ${z}(uniforms.beta) * ${O.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},x=w=>{let y=U("a",e[0].dataType,e[0].dims),k=U("b",e[1].dataType,e[1].dims),S=null,I=[y,k];e.length===3&&(S=U("c",e[2].dataType,e[2].dims.length),I.push(S));let z=pe("output",e[0].dataType,o.length);I.push(z);let O=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],R="",B="";t.transA&&t.transB?(B=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${y.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(B=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${y.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(B=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${y.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(B=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${y.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let G=t.alpha===1?"":"value *= uniforms.alpha;";return`
  ${w.registerUniforms(O).declareVariables(...I)}
  var<workgroup> tile_a: array<array<${y.type.storage}, ${u}>, ${u}>;
  var<workgroup> tile_b: array<array<${k.type.storage}, ${u}>, ${u}>;
  ${w.mainStart([u,u,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${u};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${u};
    let num_tiles = (uniforms.K - 1) / ${u} + 1;
    var k_start = 0u;
    var value = ${z.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${B}
      k_start = k_start + ${u};
      workgroupBarrier();

      for (var k: u32 = 0u; k < ${u}; k++) {
        ${R}
      }
      workgroupBarrier();
    }

    ${G}
    let m = tile_row_start + local_id.y;
    let n = tile_col_start + local_id.x;
    ${S!=null?`let cOffset = ${S.broadcastedIndicesToOffset("vec2(m, n)",z)}; value += ${z.type.value}(uniforms.beta) * ${S.getByOffset("cOffset")};`:""}
    if (m < uniforms.M && n < uniforms.N) {
      output[m * uniforms.N + n] = value;
    }
  }`};return p?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:l*c},programUniforms:m}),getShaderSource:x}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:m}),getShaderSource:b}},eb=e=>{let t=e.transA,r=e.transB,n=e.alpha,s=e.beta;return{transA:t,transB:r,alpha:n,beta:s,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},tb=(e,t)=>{xp(e.inputs),e.compute(Sp(e.inputs,t))}}),Kt,ar,Dr,Ur,kp,Tp,Ep,Ip,Cp,zp,Op,Ap,rb,nb,F1=K(()=>{ve(),Se(),Ze(),Te(),[Kt,ar,Dr,Ur]=[0,1,2,3],kp=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},Tp=`
  fn gs_get_cubic_coeffs(x: f32) -> vec4<f32> {
    let cubic_alpha = -0.75f;
    let x_abs = abs(x);
    var coeffs: vec4<f32>;
    coeffs[0] = (((cubic_alpha * (x_abs + 1) - 5 * cubic_alpha) * (x_abs + 1) + 8 * cubic_alpha) * (x_abs + 1) - 4 * cubic_alpha);
    coeffs[1] = (((cubic_alpha + 2) * x_abs - (cubic_alpha + 3)) * x_abs * x_abs + 1);
    coeffs[2] = (((cubic_alpha + 2) * (1 - x_abs) - (cubic_alpha + 3)) * (1 - x_abs) * (1 - x_abs) + 1);
    coeffs[3] = (((cubic_alpha * (2 - x_abs) - 5 * cubic_alpha) * (2 - x_abs) + 8 * cubic_alpha) * (2 - x_abs) - 4 * cubic_alpha);
    return coeffs;
  }
`,Ep=e=>`
  fn gs_bicubic_interpolate(p: mat4x4<${e}>, x: f32, y: f32) -> ${e} {
    var v: vec4<f32>;
    var coeffs = gs_get_cubic_coeffs(x);
    for (var i = 0; i < 4; i++) {
      v[i] = coeffs[0] * p[i][0] + coeffs[1] * p[i][1] + coeffs[2] * p[i][2] + coeffs[3] * p[i][3];
    }
    coeffs = gs_get_cubic_coeffs(y);
    let pixel = ${e}(coeffs[0] * v[0] + coeffs[1] * v[1] + coeffs[2] * v[2] + coeffs[3] * v[3]);
    return pixel;
  }
`,Ip=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,Cp=e=>`
  ${e.paddingMode==="reflection"?`
      fn gs_reflect(x: i32, x_min: f32, x_max: f32) -> u32 {
        var dx = 0.0;
        var fx = f32(x);
        let range = x_max - x_min;
        if (fx < x_min) {
          dx = x_min - fx;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_min + r;
          } else {
            fx = x_max - r;
          }
        } else if (fx > x_max) {
          dx = fx - x_max;
          let n = u32(dx / range);
          let r = dx - f32(n) * range;
          if (n % 2 == 0) {
            fx = x_max - r;
          } else {
            fx = x_min + r;
          }
        }
        return u32(fx);
      }`:""}
`,zp=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${Kt}] = batch;
     indices[${ar}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${Dr}] = u32(r);
            indices[${Ur}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${Dr}] = u32(clamp(r, 0, H - 1));
          indices[${Ur}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${Dr}] = gs_reflect(r, border[1], border[3]);
          indices[${Ur}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,Op=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Kt}], indices[${ar}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Kt}], indices[${ar}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Kt}], indices[${ar}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Kt}], indices[${ar}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Kt}], indices[${ar}], border);

          let dx2 = ${t}(f32(x2) - x);
          let dx1 = ${t}(x - f32(x1));
          let dy2 = ${t}(f32(y2) - y);
          let dy1 = ${t}(y - f32(y1));
          let result = dy2 * (dx2 * p11 + dx1 * p12) + dy1 * (dx2 * p21 + dx1 * p22);
        `;case"bicubic":return`
          let x0 = i32(floor(x)) - 1;
          let y0 = i32(floor(y)) - 1;
          var p: mat4x4<${t}>;
          for (var h = 0; h < 4; h++) {
            for (var w = 0; w < 4; w++) {
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Kt}], indices[${ar}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,Ap=(e,t)=>{let r=U("x",e[0].dataType,e[0].dims.length),n=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],s=U("grid",e[1].dataType,n.length,2),i=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(i=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Kt,ar,Dr,Ur]=[0,3,1,2]);let a=pe("output",e[0].dataType,i.length),o=r.type.value,u=M.size(i),l=[{type:12,data:u},...me(e[0].dims,n,i)],c=p=>`
  ${p.registerUniform("output_size","u32").declareVariables(r,s,a)}
  ${Tp}
  ${Ep(o)}
  ${Ip(t)}
  ${Cp(t)}
  ${zp(r,o,t)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${Dr}]);
      let W_in = i32(uniforms.x_shape[${Ur}]);

      ${t.alignCorners===0?`
      let x_min = -0.5;
      let x_max = f32(W_in) - 0.5;
      let y_min = -0.5;
      let y_max = f32(H_in) - 0.5;
      `:`
      let x_min = 0.0;
      let x_max = f32(W_in) - 1.0;
      let y_min = 0.0;
      let y_max = f32(H_in) - 1.0;
      `};
      let border = vec4<f32>(x_min, y_min, x_max, y_max);

      let indices = ${a.offsetToIndices("global_idx")};
      var grid_indices = vec3<u32>(indices[${Kt}], indices[${Dr}], indices[${Ur}]);
      let nxy = ${s.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${Op(a,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:p=>{let h=M.size(i);return{outputs:[{dims:i,dataType:p[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:l}},getShaderSource:c}},rb=(e,t)=>{kp(e.inputs),e.compute(Ap(e.inputs,t))},nb=e=>Pe({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),ft,Rp,ib,Ea,Mp,Fn,sb,ab=K(()=>{ve(),Se(),Ze(),nu(),au(),Te(),Br(),ft=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Rp=(e,t)=>{let r=e[0],n=ft(e,1),s=ft(e,2),i=ft(e,3),a=ft(e,4),o=ft(e,5),u=ft(e,6),l=ft(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let c=r.dims[0],p=r.dims[1],h=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],m=p,_=0,b=0,x=Math.floor(h/t.numHeads);if(u&&l&&M.size(u.dims)&&M.size(l.dims)){if(u.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(u.dims[0]!==c||u.dims[1]!==t.numHeads||u.dims[3]!==x)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[0]!==c||l.dims[1]!==t.numHeads||l.dims[3]!==x)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(u.dims[2]!==l.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(l.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');_=u.dims[2],b=u.dims[2]}else if(u&&M.size(u.dims)||l&&M.size(l.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let w;if(n&&M.size(n.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(n.dims.length<3||n.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(n.dims.length===3){if(n.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');w=2,m=n.dims[1]}else if(n.dims.length===5){if(n.dims[2]!==t.numHeads||n.dims[3]!==2||n.dims[4]!==x)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(s)throw new Error('Expect "value" be none when "key" has packed kv format.');w=5,m=n.dims[1]}else{if(n.dims[1]!==t.numHeads||n.dims[3]!==x)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');w=0,m=n.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');w=3}if(i&&M.size(i.dims)>0){if(i.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(n&&n.dims.length===5&&n.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let y=_+m,k=0;if(a&&M.size(a.dims)>0){k=8;let O=a.dims;throw O.length===1?O[0]===c?k=1:O[0]===3*c+2&&(k=3):O.length===2&&O[0]===c&&O[1]===y&&(k=5),k===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let S=!1,I=h;if(s&&M.size(s.dims)>0){if(s.dims.length!==3&&s.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==s.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(s.dims.length===3){if(m!==s.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');I=s.dims[2]}else{if(m!==s.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');I=s.dims[1]*s.dims[3],S=!0}}let z=!1;if(a&&M.size(a.dims)>0)throw new Error("Key padding mask is not supported");if(o&&M.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==c||o.dims[1]!==t.numHeads||o.dims[2]!==p||o.dims[3]!==y)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:c,sequenceLength:p,pastSequenceLength:_,kvSequenceLength:m,totalSequenceLength:y,maxSequenceLength:b,inputHiddenSize:0,hiddenSize:h,vHiddenSize:I,headSize:x,vHeadSize:Math.floor(I/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:k,scale:t.scale,broadcastResPosBias:z,passPastInKv:S,qkvFormat:w}},ib=e=>Pe({...e}),Ea=Pe({perm:[0,2,1,3]}),Mp=(e,t,r,n,s,i,a)=>{let o=[n,s,i],u=M.size(o),l=[{type:12,data:u},{type:12,data:a},{type:12,data:i}],c=p=>{let h=pe("qkv_with_bias",t.dataType,o),m=U("qkv",t.dataType,o),_=U("bias",r.dataType,o),b=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${p.registerUniforms(b).declareVariables(m,_,h)}
  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:c},{inputs:[t,r],outputs:[-1]})[0]},Fn=(e,t,r,n,s,i,a,o)=>{let u=i;if(a&&M.size(a.dims)>0){if(n===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return u=Mp(e,i,a,t,n,r*s,o),u=u.reshape([t,n,r,s]),r===1||n===1?u:e.compute(It(u,Ea.perm),{inputs:[u],outputs:[-1]})[0]}else return i.dims.length===3&&(u=i.reshape([t,n,r,s])),r===1||n===1?u:e.compute(It(u,Ea.perm),{inputs:[u],outputs:[-1]})[0]},sb=(e,t)=>{let r=Rp(e.inputs,t),n=e.inputs[0],s=ft(e.inputs,1),i=ft(e.inputs,2),a=ft(e.inputs,3),o=ft(e.inputs,4),u=ft(e.inputs,5),l=ft(e.inputs,6),c=ft(e.inputs,7);if(n.dims.length===5)throw new Error("Packed QKV is not implemented");if((s==null?void 0:s.dims.length)===5)throw new Error("Packed KV is not implemented");let p=s&&i&&s.dims.length===4&&i.dims.length===4,h=Fn(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,n,a,0);if(p)return li(e,h,s,i,o,void 0,l,c,u,r);if(!s||!i)throw new Error("key and value must be provided");let m=Fn(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,s,a,r.hiddenSize),_=Fn(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,i,a,2*r.hiddenSize);li(e,h,m,_,o,void 0,l,c,u,r)}}),Bp,Np,Pp,Dp,$o,ob,ub,lb=K(()=>{ve(),Se(),Ze(),Te(),Bp=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Np=(e,t)=>{let r=[],n=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(s=>r.push(Number(s))),n=r.length),Pe({numOutputs:n,axis:t.axis,splitSizes:r})},Pp=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${fe("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Dp=e=>{let t=e.length,r=[];for(let n=0;n<t;++n){let s=e[n].setByIndices("indices","input[global_idx]");t===1?r.push(s):n===0?r.push(`if (output_number == ${n}u) { ${s} }`):n===t-1?r.push(`else { ${s} }`):r.push(`else if (output_number == ${n}) { ${s} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},$o=(e,t)=>{let r=e[0].dims,n=M.size(r),s=e[0].dataType,i=M.normalizeAxis(t.axis,r.length),a=new Array(t.numOutputs),o=U("input",s,r.length),u=new Array(t.numOutputs),l=[],c=[],p=0,h=[{type:12,data:n}];for(let _=0;_<t.numOutputs;_++){p+=t.splitSizes[_],u[_]=p;let b=r.slice();b[i]=t.splitSizes[_],c.push(b),a[_]=pe(`output${_}`,s,b.length),l.push({dims:c[_],dataType:e[0].dataType})}h.push({type:12,data:u},...me(r,...c));let m=_=>`
  ${_.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(o,...a)}
  ${Pp(u.length)}
  ${Dp(a)}

  ${_.mainStart()}
    ${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",i)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${fe("uniforms.size_in_split_axis","output_number - 1u",u.length)};
      ${o.indicesSet("indices",i,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:m,getRunData:()=>({outputs:l,dispatchGroup:{x:Math.ceil(n/64)},programUniforms:h})}},ob=(e,t)=>{Bp(e.inputs);let r=e.inputs.length===1?t:Np(e.inputs,t);e.compute($o(e.inputs,r),{inputs:[0]})},ub=e=>{let t=e.axis,r=e.splitSizes,n=e.numOutputs<0?r.length:e.numOutputs;if(n!==r.length)throw new Error("numOutputs and splitSizes lengh must be equal");return Pe({axis:t,numOutputs:n,splitSizes:r})}}),Up,is,db,cb=K(()=>{ve(),Se(),Ze(),Te(),Up=(e,t)=>{let[r,n,s,i]=e,{numHeads:a,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!M.areEqual(n.dims,[])&&!M.areEqual(n.dims,[1])&&n.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${n.dims.length}`);if(s.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${s.dims.length}`);if(i.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${i.dims.length}`);if(!M.areEqual(s.dims,i.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&a===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let u=r.dims[0],l=r.dims[r.dims.length-2],c=s.dims[0],p=M.sizeFromDimension(r.dims,1)/l,h=o===0?s.dims[1]*2:p/a;if(o>h)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(n.dims.length===2){if(u!==n.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${n.dims[0]}`);if(l!==n.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${n.dims[1]}`)}if(h/2!==s.dims[1]&&o/2!==s.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${s.dims[1]}`);if(l>c)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},is=(e,t)=>{let{interleaved:r,numHeads:n,rotaryEmbeddingDim:s,scale:i}=t,a=e[0].dims[0],o=M.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],l=o/u,c=e[2].dims[1],p=s===0?c*2:l/n,h=new Array(a,u,l/p,p-c),m=M.computeStrides(h),_=[{type:1,data:i},{type:12,data:h},{type:12,data:m},...e[0].dims.length===3?new Array({type:12,data:[o,l,p,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,p,u*p,1]}):[],...me(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],b=x=>{let w=U("input",e[0].dataType,e[0].dims.length),y=U("position_ids",e[1].dataType,e[1].dims.length),k=U("cos_cache",e[2].dataType,e[2].dims.length),S=U("sin_cache",e[3].dataType,e[3].dims.length),I=pe("output",e[0].dataType,e[0].dims.length);return x.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:h.length},{name:"global_strides",type:"u32",length:m.length},{name:"input_output_strides",type:"u32",length:m.length}]),`
        ${x.declareVariables(w,y,k,S,I)}

        ${x.mainStart(yn)}
          let half_rotary_emb_dim = uniforms.${k.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${y.broadcastedIndicesToOffset("bsnh.xy",pe("",y.type.tensor,2))};
            let position_id =
                u32(${y.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
            let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${r});
            let j = i + select(half_rotary_emb_dim, 1, ${r});
            let re = ${w.getByOffset("i")} * ${k.get("position_id","bsnh[3]")} -
                ${w.getByOffset("j")} * ${S.get("position_id","bsnh[3]")};
            ${I.setByOffset("i","re")}
            let im = ${w.getByOffset("i")} * ${S.get("position_id","bsnh[3]")} +
                ${w.getByOffset("j")} * ${k.get("position_id","bsnh[3]")};
            ${I.setByOffset("j","im")}
          } else {
            let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
            ${I.setByOffset("k",w.getByOffset("k"))}
          }
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:Pe({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(M.size(h)/yn)},programUniforms:_})}},db=(e,t)=>{Up(e.inputs,t),e.compute(is(e.inputs,t))}}),Wp,Lp,Ia,qp,pb,V1=K(()=>{Ze(),ve(),au(),ab(),lb(),Br(),cb(),Te(),Wp=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],n=e[1],s=e[2],i=e[3],a=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,u=r.dims[0],l=r.dims[1],c=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],p=l,h=0,m=!n||n.dims.length===0,_=Math.floor(m?c/(t.numHeads+2*t.kvNumHeads):c/t.numHeads);m&&(c=_*t.numHeads);let b=i&&i.dims.length!==0,x=a&&a.dims.length!==0;if(b&&i.dims.length===4&&i.dims[0]===u&&i.dims[1]!==t.kvNumHeads&&i.dims[2]===t.kvNumHeads&&i.dims[3]===_)throw new Error("BSNH pastKey/pastValue is not supported");if(b&&x){if(i.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(a.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');h=i.dims[2]}else if(b||x)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let w=1;if(n&&n.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(n.dims.length<3||n.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(n.dims.length===3){if(r.dims[2]%n.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');p=n.dims[1]}else if(n.dims.length===5){if(n.dims[2]!==t.numHeads||n.dims[3]!==2||n.dims[4]!==_)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(s)throw new Error('Expect "value" be none when "key" has packed kv format.');p=n.dims[1]}else{if(n.dims[1]!==t.numHeads||n.dims[3]!==_)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');p=n.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');w=3}let y=0,k=!1,S=t.kvNumHeads?_*t.kvNumHeads:c;if(s&&s.dims.length>0){if(s.dims.length!==3&&s.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==s.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(s.dims.length===3){if(p!==s.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');S=s.dims[2]}else{if(p!==s.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');S=s.dims[1]*s.dims[3],k=!0}}let I=e.length>4?e[5]:void 0;if(I&&I.dims.length!==1&&I.dims[0]!==u)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:u,sequenceLength:l,pastSequenceLength:h,kvSequenceLength:p,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:c,vHiddenSize:S,headSize:_,vHeadSize:Math.floor(S/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:y,scale:t.scale,broadcastResPosBias:!1,passPastInKv:k,qkvFormat:w}},Lp=Pe({perm:[0,2,1,3]}),Ia=(e,t,r)=>{let n=t,s=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(n=t.reshape([r.batchSize,r.kvSequenceLength,s,r.headSize]),n=e.compute(It(n,Lp.perm),{inputs:[n],outputs:[-1]})[0]),n},qp=(e,t,r,n)=>{let s=7,i=["type","type"],a=[e*t],o=e*t,u=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],l=c=>{let p=U("seq_lens",r.dataType,r.dims),h=U("total_seq_lens",n.dataType,n.dims),m=pe("pos_ids",s,a),_=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${c.registerUniforms(_).declareVariables(p,h,m)}
  ${c.mainStart()}
    ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let total_sequence_length = u32(${h.getByOffset("0")});
    let is_subsequent_prompt = uniforms.sequence_length > 1 && uniforms.sequence_length != total_sequence_length;
    let is_first_prompt = !is_subsequent_prompt && uniforms.sequence_length == total_sequence_length;
    let batch_idx = global_idx / uniforms.sequence_length;
    let sequence_idx = i32(global_idx % uniforms.sequence_length);
    var pos_id: i32 = 0;
    let seqlen = ${p.getByOffset("batch_idx")};
    let total_seqlen = seqlen + 1;
    if (is_first_prompt) {
      if (sequence_idx < total_seqlen) {
        pos_id = sequence_idx;
      } else {
        pos_id = 1;
      }
      ${m.setByOffset("global_idx","pos_id")}
    } else if (is_subsequent_prompt) {
      let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
      if (past_seqlen + sequence_idx < total_seqlen) {
        pos_id = past_seqlen + sequence_idx;
      } else {
        pos_id = 1;
      }
      ${m.setByOffset("global_idx","pos_id")}
    } else if (global_idx < uniforms.batch_size) {
      ${m.setByOffset("global_idx","seqlen")}
    };
  }
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:i},getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u}),getShaderSource:l}},pb=(e,t)=>{var S;let r=Wp(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(((S=e.inputs[1])==null?void 0:S.dims.length)===5)throw new Error("Packed KV is not implemented");let n=e.inputs[0],s=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,i=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,a=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,l=e.inputs.length>5?e.inputs[6]:void 0,c=r.kvNumHeads?r.kvNumHeads:r.numHeads,p=Pe({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,c*r.headSize,c*r.headSize]}),[h,m,_]=!s&&!i?e.compute($o([n],p),{inputs:[n],outputs:[-1,-1,-1]}):[n,s,i],b,x;if(t.doRotary){let I=e.compute(qp(r.batchSize,r.sequenceLength,u,l),{inputs:[u,l],outputs:[-1]})[0],z=e.inputs[7],O=e.inputs[8],R=Pe({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),B=[h,I,z,O],G=[-1];b=e.compute(is(B,R),{inputs:B,outputs:G})[0],B.splice(0,1,m);let le=Pe({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});x=e.compute(is(B,le),{inputs:B,outputs:G})[0]}let w=Fn(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?b:h,void 0,0),y=Ia(e,t.doRotary?x:m,r),k=Ia(e,_,r);li(e,w,y,k,void 0,void 0,a,o,void 0,r,u,l)}}),Ca,Fp,Vp,fb,H1=K(()=>{ve(),Se(),Br(),Te(),Ca=(e,t,r,n,s,i,a,o)=>{let u=Ke(i),l=u===1?"f32":`vec${u}f`,c=u===1?"vec2f":`mat2x${u}f`,p=s*a,h=64;p===1&&(h=256);let m=[s,a,i/u],_=[s,a,2],b=["rank","type","type"],x=[];x.push(...me(m,_));let w=y=>{let k=U("x",t.dataType,3,u),S=U("scale",r.dataType,r.dims),I=U("bias",n.dataType,n.dims),z=pe("output",1,3,2),O=[k,S,I,z];return`
  var<workgroup> workgroup_shared : array<${c}, ${h}>;
  const workgroup_size = ${h}u;
  ${y.declareVariables(...O)}
  ${y.mainStart(h)}
    let batch = workgroup_index / uniforms.x_shape[1];
    let channel = workgroup_index % uniforms.x_shape[1];
    let hight = uniforms.x_shape[2];
    // initialize workgroup memory
    var sum = ${l}(0);
    var squared_sum = ${l}(0);
    for (var h = local_idx; h < hight; h += workgroup_size) {
      let value = ${l}(${k.get("batch","channel","h")});
      sum += value;
      squared_sum += value * value;
    }
    workgroup_shared[local_idx] = ${c}(sum, squared_sum);
    workgroupBarrier();

    for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
      if (local_idx < currSize) {
        workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
      }
      workgroupBarrier();
    }
    if (local_idx == 0) {
      let sum_final = ${Or("workgroup_shared[0][0]",u)} / f32(hight * ${u});
      let squared_sum_final = ${Or("workgroup_shared[0][1]",u)} / f32(hight * ${u});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${o};${h}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:_,dataType:1}],dispatchGroup:{x:p},programUniforms:x}),getShaderSource:w},{inputs:[t,r,n],outputs:[-1]})[0]},Fp=(e,t,r)=>{let n=t[0].dims,s=n,i=2,a=n[0],o=n[1],u=M.sizeFromDimension(n,i),l=Ke(u),c=M.size(s)/l,p=Ca(e,t[0],t[1],t[2],a,u,o,r.epsilon),h=[a,o,u/l],m=[a,o],_=["type","none"],b=x=>{let w=U("x",t[0].dataType,h.length,l),y=U("scale_shift",1,m.length,2),k=pe("output",t[0].dataType,h.length,l),S=[w,y,k];return`
  ${x.registerUniform("output_size","u32").declareVariables(...S)}
  ${x.mainStart()}
  ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${k.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${y.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${w.getByOffset("global_idx")} * ${k.type.value}(scale_shift.x) + ${k.type.value}(scale_shift.y);
      ${k.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${l}`,inputDependencies:_},getRunData:()=>({outputs:[{dims:s,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:[{type:12,data:c},...me(h,m,h)]}),getShaderSource:b},{inputs:[t[0],p]})},Vp=(e,t,r)=>{let n=t[0].dims,s=n,i=n[0],a=n[n.length-1],o=M.sizeFromDimension(n,1)/a,u=Ke(a),l=M.size(s)/u,c=[{type:12,data:o},{type:12,data:Math.floor(a/u)}],p=["type","type"],h=!1,m=[0,n.length-1];for(let w=0;w<n.length-2;w++)h=h||n[w+1]!==1,m.push(w+1);h=h&&n[n.length-1]!==1;let _=h?e.compute(It(e.inputs[0],m),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:n.length},(w,y)=>n[m[y]])),b=Ca(e,_,t[1],t[2],i,o,a,r.epsilon),x=w=>{let y=rt(t[0].dataType),k=u===1?"vec2f":`mat${u}x2f`,S=O=>{let R=O===0?"x":"y",B=u===1?"f32":`vec${u}f`;switch(u){case 1:return`${y}(${B}(scale.${R}))`;case 2:return`vec2<${y}>(${B}(scale[0].${R}, scale[1].${R}))`;case 4:return`vec4<${y}>(${B}(scale[0].${R}, scale[1].${R}, scale[2].${R}, scale[3].${R}))`;default:throw new Error(`Not supported compoents ${u}`)}},I=U("input",t[0].dataType,t[0].dims,u),z=pe("output",t[0].dataType,s,u);return`
  @group(0) @binding(0) var<storage, read> input : array<${I.type.storage}>;
  @group(0) @binding(1) var<storage, read> scale_input : array<${k}>;
  @group(0) @binding(2) var<storage, read_write> output : array<${z.type.storage}>;
  struct Uniforms {H: u32, C : u32};
  @group(0) @binding(3) var<uniform> uniforms: Uniforms;

  ${w.mainStart()}
    let current_image_number = global_idx / (uniforms.C * uniforms.H);
    let current_channel_number = global_idx % uniforms.C;

    let scale_offset = current_image_number * uniforms.C + current_channel_number;
    let scale = scale_input[scale_offset];
    output[global_idx] = fma(input[global_idx], ${S(0)}, ${S(1)});
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${u}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:s,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:c}),getShaderSource:x},{inputs:[t[0],b]})},fb=(e,t)=>{t.format==="NHWC"?Vp(e,e.inputs,t):Fp(e,e.inputs,t)}}),Hp,Gp,hb,G1=K(()=>{ve(),Se(),Te(),Hp=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Gp=(e,t,r)=>{let n=t.simplified,s=e[0].dims,i=e[1],a=!n&&e[2],o=s,u=M.normalizeAxis(t.axis,s.length),l=M.sizeToDimension(s,u),c=M.sizeFromDimension(s,u),p=M.size(i.dims),h=a?M.size(a.dims):0;if(p!==c||a&&h!==c)throw new Error(`Size of X.shape()[axis:] == ${c}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${p} and bias size of ${h}`);let m=[];for(let I=0;I<s.length;++I)I<u?m.push(s[I]):m.push(1);let _=Ke(c),b=["type","type"],x=[{type:12,data:l},{type:1,data:c},{type:12,data:Math.floor(c/_)},{type:1,data:t.epsilon}];a&&b.push("type");let w=r>1,y=r>2,k=I=>{let z=rt(e[0].dataType),O=[U("x",e[0].dataType,e[0].dims,_),U("scale",i.dataType,i.dims,_)];a&&O.push(U("bias",a.dataType,a.dims,_)),O.push(pe("output",e[0].dataType,o,_)),w&&O.push(pe("mean_data_output",1,m)),y&&O.push(pe("inv_std_output",1,m));let R=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${I.registerUniforms(R).declareVariables(...O)}
  ${I.mainStart()}
    ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${fo("f32",_)};
    var mean_square_vector = ${fo("f32",_)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${dn(z,_,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${Or("mean_vector",_)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${Or("mean_square_vector",_)} / uniforms.norm_size ${n?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${dn(z,_,"x[j + offset]")};
      let f32scale = ${dn(z,_,"scale[j]")};
      output[j + offset] = ${O[0].type.value}((f32input ${n?"":"- mean"}) * inv_std_dev * f32scale
        ${a?`+ ${dn(z,_,"bias[j]")}`:""}
      );
    }

    ${w?"mean_data_output[global_idx] = mean":""};
    ${y?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},S=[{dims:o,dataType:e[0].dataType}];return w&&S.push({dims:m,dataType:1}),y&&S.push({dims:m,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${_};${r};${n}`,inputDependencies:b},getRunData:()=>({outputs:S,dispatchGroup:{x:Math.ceil(l/64)},programUniforms:x}),getShaderSource:k}},hb=(e,t)=>{Hp(e.inputs),e.compute(Gp(e.inputs,t,e.outputCount))}}),jp,mb,j1=K(()=>{Se(),cu(),pu(),jp=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},mb=e=>{jp(e.inputs);let t=bn.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],n=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&n<8)e.compute(du(e.inputs,{activation:""},t));else{let s=t[t.length-2],i=M.size(e.inputs[0].dims.slice(0,-2)),a=M.size(e.inputs[1].dims.slice(0,-2));if(i!==1&&s===1&&a===1){let o=e.inputs[0].reshape([1,i,n]),u=e.inputs[1].reshape([1,n,r]),l=[1,i,r],c=[o,u];e.compute(ns(c,{activation:""},t,l),{inputs:c})}else e.compute(ns(e.inputs,{activation:""},t))}}}),Kp,Qp,Zp,gb,_b,K1=K(()=>{ve(),Se(),Ze(),Te(),Kp=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],n=r.dims.length;if(r.dims[n-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let s=Math.floor((t.k+t.blockSize-1)/t.blockSize),i=t.blockSize/8*t.bits,a=e[1];if(!M.areEqual(a.dims,[t.n,s,i]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(M.size(o)!==t.n*s)throw new Error("scales input size error.");if(e.length===4){let u=e[3].dims,l=t.bits>4?t.n*s:t.n*Math.floor((s+1)/2);if(M.size(u)!==l)throw new Error("zeroPoints input size error.")}},Qp=(e,t)=>{let r=e[0].dims,n=r.length,s=r[n-2],i=t.k,a=t.n,o=r.slice(0,n-2),u=M.size(o),l=e[1].dims[2]/4,c=e[0].dataType,p=Ke(t.k),h=Ke(l),m=Ke(a),_=o.concat([s,a]),b=s>1&&a/m%2===0?2:1,x=M.size(_)/m/b,w=64,y=[],k=[u,s,i/p],S=M.convertShape(e[1].dims).slice();S.splice(-1,1,l/h),y.push(...me(k)),y.push(...me(S)),y.push(...me(e[2].dims)),e.length===4&&y.push(...me(M.convertShape(e[3].dims)));let I=[u,s,a/m];y.push(...me(I));let z=O=>{let R=k.length,B=U("a",e[0].dataType,R,p),G=U("b",12,S.length,h),le=U("scales",e[2].dataType,e[2].dims.length),ie=[B,G,le],ae=e.length===4?U("zero_points",12,e[3].dims.length):void 0;ae&&ie.push(ae);let ke=I.length,be=pe("output",e[0].dataType,ke,m),X=rt(e[0].dataType),se=(()=>{switch(p){case 1:return`array<${X}, 8>`;case 2:return`mat4x2<${X}>`;case 4:return`mat2x4<${X}>`;default:throw new Error(`${p}-component is not supported.`)}})(),Q=()=>{let P=`
          // reuse a data
            var input_offset = ${B.indicesToOffset(`${B.type.indices}(batch, row, word_offset)`)};
            var a_data: ${se};
            for (var j: u32 = 0; j < ${8/p}; j++) {
              a_data[j] = ${B.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let V=0;V<m*b;V++)P+=`
            b_value = ${h===1?`b${V}_data`:`b${V}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${se}(${Array.from({length:4},(J,_e)=>`${X}(b_value_lower[${_e}]), ${X}(b_value_upper[${_e}])`).join(", ")});
            b_dequantized_values = ${p===1?`${se}(${Array.from({length:8},(J,_e)=>`(b_quantized_values[${_e}] - ${ae?`zero_point${V}`:"zero_point"}) * scale${V}`).join(", ")});`:`(b_quantized_values - ${se}(${Array(8).fill(`${ae?`zero_point${V}`:"zero_point"}`).join(",")})) * scale${V};`};
            workgroup_shared[local_id.x * ${b} + ${Math.floor(V/m)}]${m>1?`[${V%m}]`:""} += ${Array.from({length:8/p},(J,_e)=>`${p===1?`a_data[${_e}] * b_dequantized_values[${_e}]`:`dot(a_data[${_e}], b_dequantized_values[${_e}])`}`).join(" + ")};
          `;return P},ce=()=>{let P=`
            var col_index = col * ${m};
            ${ae?`
            let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${X}(8);`}
            `;for(let V=0;V<m*b;V++)P+=`
            let scale${V} = ${le.getByOffset("col_index * nBlocksPerCol + block")};
            ${ae?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${ae.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${V} = ${X}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return P},Me=()=>{let P=`col_index = col * ${m};`;for(let V=0;V<m*b;V++)P+=`
            let b${V}_data = ${G.getByIndices(`${G.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return P+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${se};
            var b_dequantized_values: ${se};`,P};return`
        var<workgroup> workgroup_shared: array<${be.type.value}, ${b*w}>;
        ${O.declareVariables(...ie,be)}
        ${O.mainStart([w,1,1])}
          let output_indices = ${be.offsetToIndices(`(global_idx / ${w}) * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${w}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/p};
            ${ce()}
            for (var word: u32 = 0; word < ${l}; word += ${h}) {
              ${Me()}
              for (var i: u32 = 0; i < ${h}; i++) {
                ${Q()}
                word_offset += ${8/p};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${b}) {
            var output_value: ${be.type.value} = ${be.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${w}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${b};
            }
            ${be.setByIndices(`${be.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${p};${h};${m};${b};${w}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:_,dataType:c}],dispatchGroup:{x},programUniforms:y}),getShaderSource:z}},Zp=(e,t)=>{let r=e[0].dims,n=r.length,s=r[n-2],i=t.k,a=t.n,o=r.slice(0,n-2),u=M.size(o),l=e[1].dims[2]/4,c=e[0].dataType,p=Ke(t.k),h=Ke(l),m=o.concat([s,a]),_=128,b=a%8===0?8:a%4===0?4:1,x=_/b,w=x*h*8,y=w/p,k=w/t.blockSize,S=M.size(m)/b,I=[],z=[u,s,i/p],O=M.convertShape(e[1].dims).slice();O.splice(-1,1,l/h),I.push(...me(z)),I.push(...me(O)),I.push(...me(e[2].dims)),e.length===4&&I.push(...me(M.convertShape(e[3].dims)));let R=[u,s,a];I.push(...me(R));let B=G=>{let le=z.length,ie=U("a",e[0].dataType,le,p),ae=U("b",12,O.length,h),ke=U("scales",e[2].dataType,e[2].dims.length),be=[ie,ae,ke],X=e.length===4?U("zero_points",12,e[3].dims.length):void 0;X&&be.push(X);let se=R.length,Q=pe("output",e[0].dataType,se),ce=rt(e[0].dataType),Me=()=>{switch(p){case 1:return`
          let a_data0 = vec4<${ce}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${ce}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${ce}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${ce}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${p}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${ie.type.value}, ${y}>;
        var<workgroup> inter_results: array<array<${Q.type.value}, ${x}>, ${b}>;
        ${G.declareVariables(...be,Q)}
        ${G.mainStart([x,b,1])}
          let output_indices = ${Q.offsetToIndices(`workgroup_index * ${b}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${k} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${y};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${y}; a_offset += ${_})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${ie.getByIndices(`${ie.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${ie.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${k} + local_id.x;
            ${X?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${X.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${ce}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${ce}(8);`}
            let scale = ${ke.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${ae.getByIndices(`${ae.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/p};
            for (var i: u32 = 0; i < ${h}; i++) {
              ${Me()}
              let b_value = ${h===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${ce}>(${Array.from({length:4},(P,V)=>`${ce}(b_value_lower[${V}]), ${ce}(b_value_upper[${V}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${ce}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(P,V)=>`${`dot(a_data${V}, b_dequantized_values[${V}])`}`).join(" + ")};
              word_offset += ${8/p};
            }
            workgroupBarrier();
          }

          if (local_idx < ${b}) {
            var output_value: ${Q.type.value} = ${Q.type.value}(0);
            for (var b = 0u; b < ${x}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${Q.setByIndices(`${Q.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${p};${h};${x};${b}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:c}],dispatchGroup:{x:S},programUniforms:I}),getShaderSource:B}},gb=(e,t)=>{Kp(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(Zp(e.inputs,t)):e.compute(Qp(e.inputs,t))},_b=e=>Pe(e)}),Xp,Yp,Jp,ef,tf,rf,nf,sf,bb,Q1=K(()=>{ve(),Se(),Te(),Xp=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Yp=(e,t,r)=>{let n="";for(let s=t-1;s>=0;--s)n+=`
            k = i32(${e.indicesGet("indices",s)}) - ${fe("uniforms.pads",s,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${fe("uniforms.x_shape",s,t)})) {
              break;
            }
            offset += k * i32(${fe("uniforms.x_strides",s,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${n}
            value = x[offset];
          }
      `},Jp=(e,t,r)=>{let n="";for(let s=t-1;s>=0;--s)n+=`
                k = i32(${e.indicesGet("indices",s)}) - ${fe("uniforms.pads",s,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${fe("uniforms.x_shape",s,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${fe("uniforms.x_shape",s,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${fe("uniforms.x_strides",s,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},ef=(e,t,r)=>{let n="";for(let s=t-1;s>=0;--s)n+=`
                k = i32(${e.indicesGet("indices",s)}) - ${fe("uniforms.pads",s,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${fe("uniforms.x_shape",s,t)})) {
                  k = i32(${fe("uniforms.x_shape",s,t)}) - 1;
                }
                offset += k * i32(${fe("uniforms.x_strides",s,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},tf=(e,t,r)=>{let n="";for(let s=t-1;s>=0;--s)n+=`
                k = i32(${e.indicesGet("indices",s)}) - ${fe("uniforms.pads",s,r)};
                if (k < 0)  {
                  k += i32(${fe("uniforms.x_shape",s,t)}]);
                }
                if (k >= i32(${fe("uniforms.x_shape",s,t)})) {
                  k -= i32(${fe("uniforms.x_shape",s,t)});
                }
                offset += k * i32(${fe("uniforms.x_strides",s,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},rf=(e,t,r)=>{switch(r.mode){case 0:return Yp(e,t,r.pads.length);case 1:return Jp(e,t,r.pads.length);case 2:return ef(e,t,r.pads.length);case 3:return tf(e,t,r.pads.length);default:throw new Error("Invalid mode")}},nf=(e,t)=>{let r=M.padShape(e[0].dims.slice(),t.pads),n=e[0].dims,s=M.size(r),i=[{type:12,data:s},{type:6,data:t.pads}],a=e.length>=3&&e[2].data;t.mode===0&&i.push({type:a?e[2].dataType:1,data:t.value}),i.push(...me(e[0].dims,r));let o=["rank"],u=l=>{let c=pe("output",e[0].dataType,r.length),p=U("x",e[0].dataType,n.length),h=p.type.value,m=rf(c,n.length,t),_=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&_.push({name:"constant_value",type:a?h:"f32"}),`
            ${l.registerUniforms(_).declareVariables(p,c)}
            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${c.offsetToIndices("global_idx")};

            var value = ${h}(0);
            ${m}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${a}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(M.size(r)/64)},programUniforms:i}),getShaderSource:u}},sf=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),n=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,s=e[0].dims.length,i=new Int32Array(2*s).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let u=0;u<o.length;u++)i[Number(o[u])]=Number(r[u]),i[Number(o[u])+s]=Number(r[u+o.length])}else r.forEach((o,u)=>i[Number(u)]=Number(o));let a=[];return i.forEach(o=>a.push(o)),{mode:t.mode,value:n,pads:a}}else return t},bb=(e,t)=>{Xp(e.inputs);let r=sf(e.inputs,t);e.compute(nf(e.inputs,r),{inputs:[0]})}}),Bn,za,Oa,Aa,Ra,af,of,Ma,Ba,yb,wb,Na,vb,$b,Pa,xb,Sb,kb,Tb,Z1=K(()=>{Ft(),ve(),Se(),Te(),Bn=e=>{if(He.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},za=(e,t,r)=>{let n=t.format==="NHWC",s=e.dims.slice();n&&s.splice(1,0,s.pop());let i=Object.hasOwnProperty.call(t,"dilations"),a=t.kernelShape.slice(),o=t.strides.slice(),u=i?t.dilations.slice():[],l=t.pads.slice();ts.adjustPoolAttributes(r,s,a,o,u,l);let c=ts.computePoolOutputShape(r,s,o,u,a,l,t.autoPad),p=Object.assign({},t);i?Object.assign(p,{kernelShape:a,strides:o,pads:l,dilations:u,cacheKey:t.cacheKey}):Object.assign(p,{kernelShape:a,strides:o,pads:l,cacheKey:t.cacheKey});let h=c.slice();return h.push(h.splice(1,1)[0]),[p,n?h:c]},Oa=(e,t)=>{let r=t.format==="NHWC",n=M.size(e),s=M.size(t.kernelShape),i=[{type:12,data:n},{type:12,data:s}],a=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],u=t.strides[t.strides.length-1],l=t.pads[t.pads.length/2-1],c=t.pads[t.pads.length-1],p=!!(l+c);i.push({type:12,data:o},{type:12,data:u},{type:12,data:l},{type:12,data:c}),a.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let h=!1;if(t.kernelShape.length===2){let m=t.kernelShape[t.kernelShape.length-2],_=t.strides[t.strides.length-2],b=t.pads[t.pads.length/2-2],x=t.pads[t.pads.length-2];h=!!(b+x),i.push({type:12,data:m},{type:12,data:_},{type:12,data:b},{type:12,data:x}),a.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[i,a,!0,p,h]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=M.computeStrides(t.kernelShape);i.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),a.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let u=t.pads.reduce((l,c)=>l+c);return[i,a,!!u,!1,!1]}},Aa=(e,t,r,n,s,i,a,o,u,l,c,p)=>{let h=s.format==="NHWC",m=t.type.value,_=pe("output",t.type.tensor,n);if(s.kernelShape.length<=2){let b="",x="",w="",y=r-(h?2:1);if(c?b=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${y}] = indices[${y}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${y}] < 0 || xIndices[${y}]
                      >= uniforms.x_shape[${y}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${i}
                }`:b=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${y}] = indices[${y}] * uniforms.sw - uniforms.pwStart + i;
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${i}
                }`,s.kernelShape.length===2){let k=r-(h?3:2);p?x=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${k}] = indices[${k}] * uniforms.sh - uniforms.phStart + j;
                  if (xIndices[${k}] < 0 || xIndices[${k}] >= uniforms.x_shape[${k}]) {
                    pad += i32(uniforms.kw);
                    continue;
                  }
              `:x=`
                for (var j: u32 = 0u; j < uniforms.kh; j++) {
                  xIndices[${k}] = indices[${k}] * uniforms.sh - uniforms.phStart + j;
                `,w=`
              }
            `}return`
            ${e.registerUniforms(u).declareVariables(t,_)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${_.offsetToIndices("global_idx")};
              var xIndices = ${_.offsetToIndices("global_idx")};

              var value = ${m}(${o});
              var pad = 0;
              ${x}
              ${b}
              ${w}
              ${a}

              output[global_idx] = value;
            }`}else{if(h)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let b=s.kernelShape.length,x=s.pads.length,w="";return l?w=`
                if (xIndices[j] >= uniforms.x_shape[j]) {
                  pad++;
                  isPad = true;
                  break;
                }
              }
              if (!isPad) {
                let x_val = x[${t.indicesToOffset("xIndices")}];
                ${i}
              }`:w=`
              }
              let x_val = x[${t.indicesToOffset("xIndices")}];
              ${i}
            `,`
            ${e.registerUniforms(u).declareVariables(t,_)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${_.offsetToIndices("global_idx")};
              var xIndices = ${_.offsetToIndices("global_idx")};

              var offsets: array<u32, ${b}>;

              var value = ${m}(${o});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${b-1}u; j++) {
                  offsets[j] = offset / ${fe("uniforms.kernelStrides","j",b)};
                  offset -= offsets[j] * ${fe("uniforms.kernelStrides","j",b)};
                }
                offsets[${b-1}] = offset;

                isPad = false;
                for (var j = ${r-b}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${fe("uniforms.strides",`j - ${r-b}u`,b)}
                    + offsets[j - ${r-b}u] - ${fe("uniforms.pads","j - 2u",x)};
                  ${w}
              }
              ${a}

              output[global_idx] = value;
            }`}},Ra=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,af=e=>`${Ra(e)};${e.countIncludePad}`,of=e=>`${Ra(e)};${e.storageOrder};${e.dilations}`,Ma=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),Ba=(e,t,r,n)=>{let[s,i]=za(t,n,r),a=U("x",t.dataType,t.dims.length),o=a.type.value,u="value += x_val;",l="";s.countIncludePad?l+=`value /= ${o}(uniforms.kernelSize);`:l+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[c,p,h,m,_]=Oa(i,s);c.push(...me(t.dims,i));let b=["rank"];return{name:e,shaderCache:{hint:`${n.cacheKey};${h};${m};${_}`,inputDependencies:b},getRunData:()=>({outputs:[{dims:i,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(M.size(i)/64)},programUniforms:c}),getShaderSource:x=>Aa(x,a,t.dims.length,i.length,s,u,l,0,p,h,m,_)}},yb=e=>{let t=e.count_include_pad!==0,r=Ma(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let n={countIncludePad:t,...r,cacheKey:""};return{...n,cacheKey:af(n)}},wb=(e,t)=>{Bn(e.inputs),e.compute(Ba("AveragePool",e.inputs[0],!1,t))},Na={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},vb=e=>{let t=e.format;return{format:t,...Na,cacheKey:t}},$b=(e,t)=>{Bn(e.inputs),e.compute(Ba("GlobalAveragePool",e.inputs[0],!0,t))},Pa=(e,t,r,n)=>{let[s,i]=za(t,n,r),a=`
      value = max(x_val, value);
    `,o="",u=U("x",t.dataType,t.dims.length),l=["rank"],[c,p,h,m,_]=Oa(i,s);return c.push(...me(t.dims,i)),{name:e,shaderCache:{hint:`${n.cacheKey};${h};${m};${_}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:i,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(M.size(i)/64)},programUniforms:c}),getShaderSource:b=>Aa(b,u,t.dims.length,i.length,s,a,o,t.dataType===10?-65504:-1e5,p,h,m,_)}},xb=(e,t)=>{Bn(e.inputs),e.compute(Pa("MaxPool",e.inputs[0],!1,t))},Sb=e=>{let t=e.storage_order,r=e.dilations,n=Ma(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(n.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let s={storageOrder:t,dilations:r,...n,cacheKey:""};return{...s,cacheKey:of(s)}},kb=e=>{let t=e.format;return{format:t,...Na,cacheKey:t}},Tb=(e,t)=>{Bn(e.inputs),e.compute(Pa("GlobalMaxPool",e.inputs[0],!0,t))}}),uf,lf,Eb,Ib,X1=K(()=>{ve(),Se(),Ze(),Te(),uf=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,n)=>r===e[2].dims[n]).reduce((r,n)=>r&&n,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((s,i)=>i===t.axis||s===e[0].dims[i]).reduce((s,i)=>s&&i,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],n=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/n)||t.blockSize>Math.ceil(r/(n-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},lf=(e,t)=>{let r=M.normalizeAxis(t.axis,e[0].dims.length),n=e[0].dataType,s=n===3,i=e[0].dims,a=e[1].dataType,o=M.size(i),u=n===3||n===2,l=u?[Math.ceil(M.size(e[0].dims)/4)]:e[0].dims,c=e[1].dims,p=e.length>2?e[2]:void 0,h=p?u?[Math.ceil(M.size(p.dims)/4)]:p.dims:void 0,m=c.length===0||c.length===1&&c[0]===1,_=m===!1&&c.length===1,b=Ke(o),x=m&&(!u||b===4),w=x?b:1,y=x&&!u?b:1,k=U("input",u?12:n,l.length,y),S=U("scale",a,c.length),I=p?U("zero_point",u?12:n,h.length):void 0,z=pe("output",a,i.length,w),O=[k,S];I&&O.push(I);let R=[l,c];p&&R.push(h);let B=[{type:12,data:o/w},{type:12,data:r},{type:12,data:t.blockSize},...me(...R,i)],G=le=>{let ie=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${le.registerUniforms(ie).declareVariables(...O,z)}
      ${le.mainStart()}
          ${le.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${z.offsetToIndices("global_idx")};

          // Set input x
          ${u?`
            let input = ${k.getByOffset("global_idx / 4")};
            let x_vec = ${s?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${w===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${k.getByOffset("global_idx")};`};

          // Set scale input
          ${m?`let scale_value= ${S.getByOffset("0")}`:_?`
            let scale_index = ${z.indicesGet("output_indices","uniforms.axis")};
            let scale_value= ${S.getByOffset("scale_index")};`:`
            var scale_indices: ${S.type.indices} = output_indices;
            let index = ${S.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
            ${S.indicesSet("scale_indices","uniforms.axis","index")};
            let scale_value= ${S.getByIndices("scale_indices")};`};

          // Set zero-point input
          ${I?m?u?`
                let zero_point_input = ${I.getByOffset("0")};
                let zero_point_vec =  ${s?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${I.getByOffset("0")}`:_?u?`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_input = ${I.getByOffset("zero_point_index / 4")};
                let zero_point_vec =  ${s?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
                let zero_point_index = ${z.indicesGet("output_indices","uniforms.axis")};
                let zero_point_value = ${I.getByOffset("zero_point_index")};`:u?`
                let zero_point_offset = ${S.indicesToOffset("scale_indices")};
                let zero_point_input = ${I.getByOffset("zero_point_offset / 4")};
                let zero_point_vec = ${s?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
                let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${I.getByIndices("scale_indices")};`:`let zero_point_value = ${u?s?"i32":"u32":k.type.value}(0);`};
      // Compute and write output
      ${z.setByOffset("global_idx",`${z.type.value}(x_value - zero_point_value) * scale_value`)};
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:I?["rank","rank","rank"]:["rank","rank"]},getShaderSource:G,getRunData:()=>({outputs:[{dims:i,dataType:a}],dispatchGroup:{x:Math.ceil(o/w/64),y:1,z:1},programUniforms:B})}},Eb=(e,t)=>{uf(e.inputs,t),e.compute(lf(e.inputs,t))},Ib=e=>Pe({axis:e.axis,blockSize:e.blockSize})}),df,cf,Cb,Y1=K(()=>{Ft(),ve(),Te(),df=(e,t,r)=>{let n=e===t,s=e<t&&r<0,i=e>t&&r>0;if(n||s||i)throw new Error("Range these inputs' contents are invalid.")},cf=(e,t,r,n)=>{let s=Math.abs(Math.ceil((t-e)/r)),i=[s],a=s,o=[{type:12,data:a},{type:n,data:e},{type:n,data:r},...me(i)],u=l=>{let c=pe("output",n,i.length),p=c.type.value,h=[{name:"outputSize",type:"u32"},{name:"start",type:p},{name:"delta",type:p}];return`
        ${l.registerUniforms(h).declareVariables(c)}
        ${l.mainStart()}
        ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${p}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${n}`},getShaderSource:u,getRunData:()=>({outputs:[{dims:i,dataType:n}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:o})}},Cb=e=>{let t=0,r=0,n=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],n=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],n=e.inputs[2].getFloat32Array()[0]),He.webgpu.validateInputContent&&df(t,r,n),e.compute(cf(t,r,n,e.inputs[0].dataType),{inputs:[]})}}),pf,Da,Ua,ff,zb,Ob,J1=K(()=>{ve(),Se(),Ze(),Te(),pf=(e,t,r,n)=>{if(e!=="none"&&n!=="i32"&&n!=="u32"&&n!=="f32")throw new Error(`Input ${n} is not supported with reduction ${e}.`);let s=`{
                var oldValue = 0;
                loop {
                  let newValueF32 =`,i=`;
                  let newValue = bitcast<i32>(newValueF32);
                  let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
                  if res.exchanged {
                    break;
                  }
                  oldValue = res.old_value;
                }
              }`;switch(e){case"none":return`${t}=${r};`;case"add":return n==="i32"||n==="u32"?`atomicAdd(&${t}, bitcast<${n}>(${r}));`:`
              ${s}bitcast<${n}>(oldValue) + (${r})${i}`;case"max":return n==="i32"||n==="u32"?`atomicMax(&${t}, bitcast<${n}>(${r}));`:`
                ${s}max(bitcast<f32>(oldValue), (${r}))${i}`;case"min":return n==="i32"||n==="u32"?`atomicMin(&${t}, bitcast<${n}>(${r}));`:`${s}min(bitcast<${n}>(oldValue), (${r}))${i}`;case"mul":return`${s}(bitcast<${n}>(oldValue) * (${r}))${i}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Da=(e,t)=>`${e===1?`
    let element_count_dim = uniforms.output_strides;
    let dim_value = uniforms.output_shape;`:`
    let element_count_dim = uniforms.output_strides[${t?"i - indices_start":"i"}];
    let dim_value = uniforms.output_shape[${t?"i - indices_start":"i"} + uniforms.last_index_dimension];`}
    
    if (index >= 0) {
      if (index >= i32(dim_value)) {
        index = i32(dim_value - 1);
      }
    } else {
      if (index < -i32(dim_value)) {
        index = 0;
      } else {
        index += i32(dim_value);
      }
    }
    data_offset += u32((u32(index) * element_count_dim));`,Ua=(e,t,r)=>`for (var i = 0u; i < uniforms.num_updates_elements; i++) {
        let value = updates[uniforms.num_updates_elements * ${r?"global_idx":"idx"} + i];
        ${pf(e.reduction,"output[data_offset + i]","value",t)}
      }`,ff=(e,t)=>{let r=e[0].dims,n=e[1].dims,s=r,i=1,a=Math.ceil(M.size(n)/i),o=n[n.length-1],u=M.sizeFromDimension(r,o),l=M.sizeFromDimension(n,0)/o,c=[{type:12,data:a},{type:12,data:o},{type:12,data:u},...me(e[1].dims,e[2].dims,s)],p=h=>{let m=U("indices",e[1].dataType,e[1].dims.length),_=U("updates",e[2].dataType,e[2].dims.length,i),b=t.reduction!=="none"&&t.reduction!==""?sg("output",e[0].dataType,s.length):pe("output",e[0].dataType,s.length,i);return`
      ${h.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(m,_,b)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
  var hasDuplicates = false;
  if (${t.reduction==="none"}) {
    for (var i = 0; i < ${l}; i = i + 1) {
      for (var j = i + 1; j < ${l}; j = j + 1) {
        var index_i = i32(indices[i].x);
        var index_j = i32(indices[j].x);
        if (index_i == index_j) {
          hasDuplicates = true;
          break;
        }
      }
      if (hasDuplicates) {
        break;
      }
    }
  }

  if (${t.reduction==="none"} && hasDuplicates) {
    if (global_idx != 0u) {
      return;
    }
    // Process each index-update pair individually when duplicates exist
    for (var idx = 0u; idx < ${l}u; idx++) {
      var data_offset = 0u;
      for (var i = 0u; i < uniforms.last_index_dimension; i++) {
        var index = i32(indices[idx * uniforms.last_index_dimension + i].x);
        ${Da(r.length,!1)}
      }
      ${Ua(t,b.type.value,!1)}
    }
    return;
  }

  var data_offset = 0u;
  var indices_start = uniforms.last_index_dimension * global_idx;
  var indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${Da(r.length,!0)}
  }
  ${Ua(t,b.type.value,!0)}
  }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:c}),getShaderSource:p}},zb=e=>Pe({reduction:e.reduction}),Ob=(e,t)=>{e.compute(ff(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),hf,mf,gf,Wa,_f,bf,yf,wf,vf,$f,xf,Sf,La,kf,Tf,Ef,If,Cf,Ab,Rb,ex=K(()=>{ve(),Se(),Ze(),Te(),hf=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},mf=(e,t,r)=>{t.every(s=>s>=0&&s<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let n=new Array(r).fill(1);return t.forEach((s,i)=>n[s]=e[i]),n},gf=(e,t,r,n,s,i)=>{let[a,o,u]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],l=e[0].dims.length;if(a>0&&e.length>a&&e[a].dims.length>0)e[a].getFloat32Array().forEach(c=>i.push(c));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(c=>n.push(c)),n.length!==0&&n.length!==l&&r>=18&&n.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");hf(n,t),t.axes.length>0&&mf(n,t.axes,l).forEach((c,p)=>n[p]=c)}if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(c=>s.push(Number(c))),s.length!==0&&s.length!==l&&r>=18&&s.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(n.length!==0&&n.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(s.length!==0&&s.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof n<"u"&&typeof s<"u"&&n.length>0&&s.length>l)throw new Error("Resize requires only of scales or sizes to be specified")},Wa=(e,t,r,n)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${n}(big / (${r}));
  let fract = ${n}(big % (${r})) / ${n}(${r});
  return whole + fract;
`,_f=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${Wa("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${Wa("xResized","lengthOriginal - 1","lengthResized - 1",t)}
                  }`;case"tf_crop_and_resize":return`if (lengthResized > 1) {
                    return ${t}(roiStart) * ${t}(lengthOriginal - 1) +
                        (${t}(xResized) * ${t}(roiEnd - roiStart) * ${t}(lengthOriginal - 1)) /
                        ${t}(lengthResized - 1);
                  } else {
                    return 0.5 * ${t}(roiStart + roiEnd) * ${t}(lengthOriginal - 1);
                  }`;case"half_pixel_symmetric":return`const outputWidth = ${t}xScale * ${t}(lengthResized);
                  const adjustment = ${t}(lengthResized) / outputWidth;
                  const center = ${t}(lengthOriginal) / 2;
                  const offset = center * (1 - adjustment);
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",bf=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",yf=(e,t,r)=>{let n=new Array(r).fill(0).concat(new Array(r).fill(1)),s=e.length===0?n:e.slice();return t.length>0?(t.forEach((i,a)=>{n[i]=s[a],n[a+r]=s[t.length+a]}),n):s},wf=(e,t,r,n)=>{let s=[];if(r.length>0)if(n.length>0){if(e.forEach(i=>s.push(i)),Math.max(...n)>e.length)throw new Error("axes is out of bound");n.forEach((i,a)=>s[i]=r[a])}else r.forEach(i=>s.push(i));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");s=e.map((i,a)=>Math.round(i*t[a]))}return s},vf=(e,t,r)=>{let n=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(i=>t[i]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(i=>t[i]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let s=e.slice();return r.axes.length>0?(r.axes.forEach(i=>t[i]=n),r.axes.forEach(i=>s[i]=Math.round(e[i]*t[i]))):(t.fill(n,0,t.length),s.forEach((i,a)=>s[a]=Math.round(i*t[a]))),s},$f=(e,t,r,n,s)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${fe("uniforms.scales","i",n)};
        var roi_low = ${fe("uniforms.roi","i",s)};
        var roi_hi = ${fe("uniforms.roi",`i + ${t.length}`,s)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${fe("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${fe("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,xf=(e,t,r,n,s,i,a)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${n.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${fe("uniforms.scales","i",s)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${fe("uniforms.roi","i",i)};
          var roi_hi = ${fe("uniforms.roi",`i + ${r.length}`,i)};
          var input_shape_i = ${fe("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${fe("uniforms.output_shape","i",n.length)};
          var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                        input_shape_i, roi_low, roi_hi);
          if (!${a} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
            if (original_idx < 0) {
              input_index = 0;
            } else if (original_idx > ${t.type.value}(input_shape_i - 1)) {
              input_index = input_shape_i - 1;
            } else {
              input_index = u32(getNearestPixelFromOriginal(original_idx, scale < 1));
            }
          } else {
            input_index = u32(original_idx);
          }
        }
        ${e.indicesSet("input_indices","i","input_index")}
      }
      return input_indices;
    }`,Sf=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${fe("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,La=(e,t,r,n)=>e.rank>n?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",kf=(e,t,r,n,s)=>{let[i,a,o,u]=r.length===2?[-1,0,1,-1]:[0,2,3,1],l=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${l} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",a,`max(0, min(row, ${r[a]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${La(e,u,i,2)}
      return ${e.getByIndices("input_indices")};
    }

    fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${l} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var row:${l} = originalIndices[${a}];
      var col:${l} = originalIndices[${o}];
      ${n?`if (row < 0 || row > (${r[a]} - 1) || col < 0 || col > (${r[o]} - 1)) {
        return ${s};
      }`:""};
      row = max(0, min(row, ${r[a]} - 1));
      col = max(0, min(col, ${r[o]} - 1));
      var row1: u32 = u32(row);
      var col1: u32 = u32(col);
      var row2: u32 = u32(row + 1);
      var col2: u32 = u32(col + 1);
      var channel: u32 = ${r.length>2?`u32(originalIndices[${u}])`:"0"};
      var batch: u32 =  ${r.length>2?`u32(originalIndices[${i}])`:"0"};
      var x11: ${l} = getInputValue(batch, channel, row1, col1);
      var x12: ${l} = getInputValue(batch, channel, row1, col2);
      var x21: ${l} = getInputValue(batch, channel, row2, col1);
      var x22: ${l} = getInputValue(batch, channel, row2, col2);
      var dx1: ${l} = abs(row - ${l}(row1));
      var dx2: ${l} = abs(${l}(row2) - row);
      var dy1: ${l} = abs(col - ${l}(col1));
      var dy2: ${l} = abs(${l}(col2) - col);
      if (row1 == row2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (col1 == col2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      return (x11 * dx2 * dy2 + x12 * dx2 * dy1 + x21 * dx1 * dy2 + x22 * dx1 * dy1);
    }`},Tf=(e,t,r,n,s,i,a,o,u,l)=>{let c=r.length===2,[p,h]=c?[0,1]:[2,3],m=e.type.value,_=b=>{let x=b===p?"row":"col";return`
      fn ${x}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${m} {
        var output_index = ${t.indicesGet("output_indices",b)};
        var originalIdx: ${m} = getOriginalCoordinateFromResizedCoordinate(output_index, ${s[b]},
        ${n[b]}, ${r[b]}, ${i[b]}, ${i[b]} + ${r.length});
        var fractOriginalIdx: ${m} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[b]} - 1))) {
          return ${u};
        }
        var data: array<${m}, 4> = array<${m}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${x}: ${m} = originalIdx + ${m}(i);
          if (${x} < 0 || ${x} >= ${r[b]}) {
            ${l?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${u};`:`${x} = max(0, min(${x}, ${r[b]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",b,`u32(${x})`)};
          data[i + 1] = ${b===p?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${_(p)};
    ${_(h)};
  fn getCubicInterpolationCoefs(s: ${m}) -> array<${m}, 4> {
    var absS = abs(s);
    var coeffs: array<${m}, 4> = array<${m}, 4>(0.0, 0.0, 0.0, 0.0);
    var oneMinusAbsS: ${m} = 1.0 - absS;
    var twoMinusAbsS: ${m} = 2.0 - absS;
    var onePlusAbsS: ${m} = 1.0 + absS;
    coeffs[0] = ((${a} * onePlusAbsS - 5 * ${a}) * onePlusAbsS + 8 * ${a}) * onePlusAbsS - 4 * ${a};
    coeffs[1] = ((${a} + 2) * absS - (${a} + 3)) * absS * absS + 1;
    coeffs[2] = ((${a} + 2) * oneMinusAbsS - (${a} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
    coeffs[3] = ((${a} * twoMinusAbsS - 5 * ${a}) * twoMinusAbsS + 8 * ${a}) * twoMinusAbsS - 4 * ${a};
    return coeffs;
  }

  fn cubicInterpolation1D(x: array<${m}, 4>, coefs: array<${m}, 4>) -> ${m} {
    var coefsSum: ${m} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
    return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
  }

  fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${m} {
    var input_indices: ${e.type.indices} = output_indices;
    return colCubicInterpolation(input_indices, output_indices);
  }
    `},Ef=(e,t,r,n,s)=>{let[i,a,o,u,l]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],c=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${c} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",a,`max(0, min(depth, ${r[a]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(width, ${r[u]} - 1))`)};
      ${La(e,l,i,3)}
      return ${e.getByIndices("input_indices")};
    }

    fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${c} {
      var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
      var depth:${c} = originalIndices[${a}];
      var height:${c} = originalIndices[${o}];
      var width:${c} = originalIndices[${u}];
      ${n?`if (depth < 0 || depth > (${r[a]} - 1) || height < 0 || height > (${r[o]} - 1) || width < 0 || (width > ${r[u]} - 1)) {
      return ${s};
        }`:""};

    depth = max(0, min(depth, ${r[a]} - 1));
      height = max(0, min(height, ${r[o]} - 1));
      width = max(0, min(width, ${r[u]} - 1));
      var depth1: u32 = u32(depth);
      var height1: u32 = u32(height);
      var width1: u32 = u32(width);
      var depth2: u32 = u32(depth + 1);
      var height2: u32 = u32(height + 1);
      var width2: u32 = u32(width + 1);
      var channel: u32 = ${r.length>3?`u32(originalIndices[${l}])`:"0"};
      var batch: u32 =  ${r.length>3?`u32(originalIndices[${i}])`:"0"};

      var x111: ${c} = getInputValue(batch, channel, depth1, height1, width1);
      var x112: ${c} = getInputValue(batch, channel, depth1, height1, width2);
      var x121: ${c} = getInputValue(batch, channel, depth1, height2, width1);
      var x122: ${c} = getInputValue(batch, channel, depth1, height2, width2);
      var x211: ${c} = getInputValue(batch, channel, depth2, height1, width1);
      var x212: ${c} = getInputValue(batch, channel, depth2, height1, width2);
      var x221: ${c} = getInputValue(batch, channel, depth2, height2, width1);
      var x222: ${c} = getInputValue(batch, channel, depth2, height2, width2);
      var dx1: ${c} = abs(depth - ${c}(depth1));
      var dx2: ${c} = abs(${c}(depth2) - depth);
      var dy1: ${c} = abs(height - ${c}(height1));
      var dy2: ${c} = abs(${c}(height2) - height);
      var dz1: ${c} = abs(width - ${c}(width1));
      var dz2: ${c} = abs(${c}(width2) - width);
      if (depth1 == depth2) {
        dx1 = 0.5;
        dx2 = 0.5;
      }
      if (height1 == height2) {
        dy1 = 0.5;
        dy2 = 0.5;
      }
      if (width1 == width2) {
        dz1 = 0.5;
        dz2 = 0.5;
      }
      return (x111 * dx2 * dy2 * dz2 + x112 * dx2 * dy2 * dz1 + x121 * dx2 * dy1 *dz2 + x122 * dx2 * dy1 * dz1 +
              x211 * dx1 * dy2 * dz2 + x212 * dx1 * dy2 * dz1 + x221 * dx1 * dy1 *dz2 + x222 * dx1 * dy1 * dz1);
    }`},If=(e,t,r,n,s,i)=>{let a=e.dims,o=yf(i,t.axes,a.length),u=wf(a,n,s,t.axes),l=n.slice();n.length===0&&(l=a.map((y,k)=>y===0?1:u[k]/y),t.keepAspectRatioPolicy!=="stretch"&&(u=vf(a,l,t)));let c=pe("output",e.dataType,u.length),p=U("input",e.dataType,a.length),h=M.size(u),m=a.length===u.length&&a.every((y,k)=>y===u[k]),_=t.coordinateTransformMode==="tf_crop_and_resize",b=t.extrapolationValue,x=p.type.value,w=y=>`
      ${m?"":`
      ${_f(t.coordinateTransformMode,x)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${Sf(p,a)};
              ${bf(t.nearestMode,r,x)};
              ${xf(p,c,a,u,l.length,o.length,_)};
              `;case"linear":return`
              ${$f(c,a,u,l.length,o.length)};
              ${(()=>{if(a.length===2||a.length===4)return`${kf(p,c,a,_,b)}`;if(a.length===3||a.length===5)return`${Ef(p,c,a,_,b)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(a.length===2||a.length===4)return`${Tf(p,c,a,u,l,o,t.cubicCoeffA,_,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${y.registerUniform("output_size","u32").registerUniform("scales","f32",l.length).registerUniform("roi","f32",o.length).declareVariables(p,c)}
      ${y.mainStart()}
        ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
        ${m?"output[global_idx] = input[global_idx];":`
        let output_indices = ${c.offsetToIndices("global_idx")};
        var input_indices: ${p.type.indices};
        ${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
                if (checkInputIndices(input_indices)) {
                  output[global_idx] = ${p.getByIndices("input_indices")};
                } else {
                  output[global_idx] = ${t.extrapolationValue};
                }`;case"linear":return`output[global_idx] = ${a.length===2||a.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${l.length>0?t.mode==="cubic"?l:l.length:""}|${s.length>0?s:""}|${o.length>0?o:""}|${m}|${t.mode==="nearest"?a.length:a}`,inputDependencies:["rank"]},getShaderSource:w,getRunData:()=>({outputs:[{dims:u,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:[{type:12,data:h},{type:1,data:l},{type:1,data:o},...me(a,u)]})}},Cf=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},Ab=(e,t)=>{let r=[],n=[],s=[],i=Cf(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");gf(e.inputs,t,i,r,n,s),e.compute(If(e.inputs[0],t,i,r,n,s),{inputs:[0]})},Rb=e=>{let t=e.antialias,r=e.axes,n=e.coordinateTransformMode,s=e.cubicCoeffA,i=e.excludeOutside!==0,a=e.extrapolationValue,o=e.keepAspectRatioPolicy,u=e.mode,l=e.nearestMode===""?"simple":e.nearestMode;return Pe({antialias:t,axes:r,coordinateTransformMode:n,cubicCoeffA:s,excludeOutside:i,extrapolationValue:a,keepAspectRatioPolicy:o,mode:u,nearestMode:l})}}),zf,Of,Mb,tx=K(()=>{ve(),Se(),Te(),zf=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],n=e[2];if(t.dataType!==r.dataType||t.dataType!==n.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let s=t.dims[t.dims.length-1],i=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==s)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==i)throw new Error("Skip must have the same sequence length as input");if(n.dims.length!==1)throw new Error("Gamma must be 1D");if(n.dims[n.dims.length-1]!==s)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let a=e[3];if(a.dims.length!==1)throw new Error("Beta must be 1D");if(a.dims[a.dims.length-1]!==s)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let a=e[4];if(a.dims.length!==1)throw new Error("Bias must be 1D");if(a.dims[a.dims.length-1]!==s)throw new Error("Bias must have the same hidden size as input")}},Of=(e,t,r,n)=>{let s=t.simplified,i=e[0].dims,a=M.size(i),o=i,u=a,l=i.slice(-1)[0],c=n?i.slice(0,-1).concat(1):[],p=!s&&e.length>3,h=e.length>4,m=n&&r>1,_=n&&r>2,b=r>3,x=64,w=Ke(l),y=[{type:12,data:u},{type:12,data:w},{type:12,data:l},{type:1,data:t.epsilon}],k=I=>{let z=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],O=[U("x",e[0].dataType,e[0].dims,w),U("skip",e[1].dataType,e[1].dims,w),U("gamma",e[2].dataType,e[2].dims,w)];p&&O.push(U("beta",e[3].dataType,e[3].dims,w)),h&&O.push(U("bias",e[4].dataType,e[4].dims,w)),O.push(pe("output",e[0].dataType,o,w)),m&&O.push(pe("mean_output",1,c)),_&&O.push(pe("inv_std_output",1,c)),b&&O.push(pe("input_skip_bias_sum",e[0].dataType,o,w));let R=rt(e[0].dataType),B=rt(1,w);return`

      ${I.registerUniforms(z).declareVariables(...O)}
      var<workgroup> sum_shared : array<${B}, ${x}>;
      var<workgroup> sum_squared_shared : array<${B}, ${x}>;

      ${I.mainStart([x,1,1])}
        let ix = local_id.x;
        let iy = global_id.x / ${x};

        let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
        var stride = hidden_size_vectorized / ${x};
        let offset = ix * stride + iy * hidden_size_vectorized;
        let offset1d = stride * ix;
        if (ix == ${x-1}) {
          stride = hidden_size_vectorized - stride * ix;
        }
        for (var i: u32 = 0; i < stride; i++) {
          let skip_value = skip[offset + i];
          let bias_value = ${h?"bias[offset1d + i]":R+"(0.0)"};
          let input_value = x[offset + i];
          let value = input_value + skip_value + bias_value;
          ${b?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${dn(R,w,"value")};
          sum_shared[ix] += f32_value;
          sum_squared_shared[ix] += f32_value * f32_value;
        }
        workgroupBarrier();

        var reduce_size : u32 = ${x};
        for (var curr_size = reduce_size >> 1;  curr_size > 0; curr_size = reduce_size >> 1) {
          reduce_size = curr_size + (reduce_size & 1);
          if (ix < curr_size) {
            sum_shared[ix] += sum_shared[ix + reduce_size];
            sum_squared_shared[ix] += sum_squared_shared[ix + reduce_size];
          }
          workgroupBarrier();
        }

        let sum = sum_shared[0];
        let square_sum = sum_squared_shared[0];
        let mean = ${Or("sum",w)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${Or("square_sum",w)} / f32(uniforms.hidden_size) ${s?"":"- mean * mean"} + uniforms.epsilon);
        ${m?"mean_output[global_idx] = mean;":""}
        ${_?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${s?"":`- ${R}(mean)`}) *
            ${R}(inv_std_dev) * gamma[offset1d + i]
            ${p?"+ beta[offset1d + i]":""};
        }
      }`},S=[{dims:o,dataType:e[0].dataType}];return r>1&&S.push({dims:c,dataType:1}),r>2&&S.push({dims:c,dataType:1}),r>3&&S.push({dims:i,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${w};${m};${_};${b}`,inputDependencies:e.map((I,z)=>"type")},getShaderSource:k,getRunData:()=>({outputs:S,dispatchGroup:{x:Math.ceil(u/l)},programUniforms:y})}},Mb=(e,t)=>{zf(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(Of(e.inputs,t,e.outputCount,!1),{outputs:r})}}),Af,Nn,Rf,qa,Mf,Bf,Bb,Nb,rx=K(()=>{ve(),Se(),Ze(),Te(),Af=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,n)=>{if(e[n+1].dataType!==6&&e[n+1].dataType!==7)throw new Error(`Input ${n} must be an array of int32 or int64`)})},Nn=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(n=>r.push(Number(n)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(n=>r.push(Number(n)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},Rf=(e,t)=>{if(e.length>1){let r=Nn(e,1),n=Nn(e,2),s=Nn(e,3);return s.length===0&&(s=[...Array(e[0].dims.length).keys()]),Pe({starts:r,ends:n,axes:s})}else return t},qa=(e,t,r,n,s)=>{let i=e;return e<0&&(i+=r[n[t]]),s[t]<0?Math.max(0,Math.min(i,r[n[t]]-1)):Math.max(0,Math.min(i,r[n[t]]))},Mf=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length}; i >= 0; i--) {
            let input_shape_i = ${fe("uniforms.input_shape","i",r.length)};
            let steps_i = ${fe("uniforms.steps","i",r.length)};
            let signs_i = ${fe("uniforms.signs","i",r.length)};
            let starts_i = ${fe("uniforms.starts","i",r.length)};
            var output_index = ${t.indicesGet("output_indices","i")};
            var input_index = output_index * steps_i + starts_i + carry;
            carry = input_index / input_shape_i;
            input_index = input_index % input_shape_i;
            if (signs_i < 0) {
              input_index = input_shape_i - input_index - 1u + starts_i;
            }
            ${e.indicesSet("input_indices","i","input_index")};
          }
          return input_indices;
      }`,Bf=(e,t)=>{let r=e[0].dims,n=M.size(r),s=t.axes.length>0?M.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],i=Nn(e,4);i.forEach(w=>w!==0||(()=>{throw new Error("step cannot be 0")})),i.length===0&&(i=Array(s.length).fill(1));let a=t.starts.map((w,y)=>qa(w,y,r,s,i)),o=t.ends.map((w,y)=>qa(w,y,r,s,i));if(s.length!==a.length||s.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(s.length!==r.length)for(let w=0;w<r.length;++w)s.includes(w)||(a.splice(w,0,0),o.splice(w,0,r[w]),i.splice(w,0,1));let u=i.map(w=>Math.sign(w));i.forEach((w,y,k)=>{if(w<0){let S=(o[y]-a[y])/w,I=a[y],z=I+S*i[y];a[y]=z,o[y]=I,k[y]=-w}});let l=r.slice(0);s.forEach((w,y)=>{l[w]=Math.ceil((o[w]-a[w])/i[w])});let c={dims:l,dataType:e[0].dataType},p=pe("output",e[0].dataType,l.length),h=U("input",e[0].dataType,e[0].dims.length),m=M.size(l),_=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:a.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:i.length}],b=[{type:12,data:m},{type:12,data:a},{type:6,data:u},{type:12,data:i},...me(e[0].dims,l)],x=w=>`
      ${w.registerUniforms(_).declareVariables(h,p)}
        ${Mf(h,p,r)}
        ${w.mainStart()}
          ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${p.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${p.setByOffset("global_idx",h.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${u.length}_${a.length}_${i.length}`,inputDependencies:["rank"]},getShaderSource:x,getRunData:()=>({outputs:[c],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:b})}},Bb=(e,t)=>{Af(e.inputs,t);let r=Rf(e.inputs,t);e.compute(Bf(e.inputs,r),{inputs:[0]})},Nb=e=>{let t=e.starts,r=e.ends,n=e.axes;return Pe({starts:t,ends:r,axes:n})}}),Nf,Pf,Pb,Db,nx=K(()=>{ve(),Se(),Ze(),Br(),Te(),Nf=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},Pf=(e,t)=>{let r=e.inputs[0],n=r.dims,s=M.size(n),i=n.length,a=M.normalizeAxis(t.axis,i),o=a<n.length-1,u,l=[];o?(l=Array.from({length:i},(O,R)=>R),l[a]=i-1,l[i-1]=a,u=e.compute(It(r,l),{inputs:[r],outputs:[-1]})[0]):u=r;let c=u.dims,p=c[i-1],h=s/p,m=Ke(p),_=p/m,b=64;h===1&&(b=256);let x=(O,R)=>R===4?`max(max(${O}.x, ${O}.y), max(${O}.z, ${O}.w))`:R===2?`max(${O}.x, ${O}.y)`:R===3?`max(max(${O}.x, ${O}.y), ${O}.z)`:O,w=U("x",u.dataType,u.dims,m),y=pe("result",u.dataType,u.dims,m),k=w.type.value,S=rt(u.dataType)==="f32"?`var threadMax = ${k}(-3.402823e+38f);`:`var threadMax = ${k}(-65504.0h);`,I=O=>`
      var<workgroup> rowMaxShared : ${k};
      var<workgroup> rowSumShared : ${k};
      var<workgroup> threadShared : array<${k}, ${b}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${k} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${k}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${O.registerUniform("packedCols","i32").declareVariables(w,y)}
      ${O.mainStart(b)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${b};
        let row = gindex / wg;
        let cols = uniforms.packedCols;
        let row_stride : i32 = uniforms.packedCols;

        // find the rows max
        ${S}
        for (var col = lindex; col < cols; col += wg) {
          let value = getValue(row, col, row_stride);
          threadMax = max(threadMax, value);
        }
        if (lindex < cols) {
          threadShared[lindex] = threadMax;
        }
        workgroupBarrier();

        var reduceSize = min(cols, wg);
        for (var currSize = reduceSize >> 1;  currSize > 0; currSize = reduceSize >> 1) {
          reduceSize = currSize + (reduceSize & 1);
          if (lindex < currSize) {
            threadShared[lindex] = max(threadShared[lindex], threadShared[lindex + reduceSize]);
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowMaxShared = ${k}(${x("threadShared[0]",m)});
        }
        workgroupBarrier();

        // find the rows sum
        var threadSum = ${k}(0.0);
        for (var col = lindex; col < cols; col += wg) {
          let subExp = exp(getValue(row, col, row_stride) - rowMaxShared);
          threadSum += subExp;
        }
        threadShared[lindex] = threadSum;
        workgroupBarrier();

        for (var currSize = wg >> 1;  currSize > 0; currSize = currSize >> 1) {
          if (lindex < currSize) {
            threadShared[lindex] = threadShared[lindex] + threadShared[lindex + currSize];
          }
          workgroupBarrier();
        }
        if (lindex == 0) {
          rowSumShared = ${k}(${Or("threadShared[0]",m)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          let value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          setValue(row, col, row_stride, value);
        }
      }`,z=e.compute({name:"Softmax",shaderCache:{hint:`${m};${b}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:c,dataType:u.dataType}],dispatchGroup:{x:h},programUniforms:[{type:6,data:_}]}),getShaderSource:I},{inputs:[u],outputs:[o?-1:0]})[0];o&&e.compute(It(z,l),{inputs:[z]})},Pb=(e,t)=>{Nf(e.inputs),Pf(e,t)},Db=e=>Pe({axis:e.axis})}),Fa,Df,Uf,Wf,Ub,ix=K(()=>{ve(),Se(),Te(),Fa=e=>Array.from(e.getBigInt64Array(),Number),Df=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Fa(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},Uf=(e,t)=>{let r=[];for(let n=0;n<e.length;++n)r.push(e[n]*t[n]);return r},Wf=(e,t)=>{let r=e[0].dims,n=t??Fa(e[1]),s=Uf(r,n),i=M.size(s),a=e[0].dataType,o=U("input",a,r.length),u=pe("output",a,s.length),l=c=>`
      const inputShape = ${o.indices(...r)};
      ${c.registerUniform("output_size","u32").declareVariables(o,u)}
      ${c.mainStart()}
      ${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let output_indices = ${u.offsetToIndices("global_idx")};
      var input_indices: ${o.type.indices};
      for (var i = 0; i < ${r.length}; i++) {
        let input_dim_i = ${o.indicesGet("uniforms.input_shape","i")};
        let input_dim_value = ${u.indicesGet("output_indices","i")}  % input_dim_i;

        ${o.indicesSet("input_indices","i","input_dim_value")}
      }
      ${u.setByOffset("global_idx",o.getByIndices("input_indices"))}
    }`;return{name:"Tile",shaderCache:{hint:`${n}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:[{type:12,data:i},...me(e[0].dims,s)]}),getShaderSource:l}},Ub=e=>{Df(e.inputs),e.compute(Wf(e.inputs),{inputs:[0]})}}),Lf,qf,Wb,sx=K(()=>{ve(),Se(),Te(),Lf=(e,t,r,n,s)=>{let i=pe("output_data",s,r.length,4),a=U("a_data",t[1].dataType,t[1].dims.length,4),o=U("b_data",t[2].dataType,t[2].dims.length,4),u=U("c_data",t[0].dataType,t[0].dims.length,4),l,c=(p,h,m)=>`select(${h}, ${p}, ${m})`;if(!n)l=i.setByOffset("global_idx",c(a.getByOffset("global_idx"),o.getByOffset("global_idx"),u.getByOffset("global_idx")));else{let p=(h,m,_="")=>{let b=`a_data[index_a${m}][component_a${m}]`,x=`b_data[index_b${m}][component_b${m}]`,w=`bool(c_data[index_c${m}] & (0xffu << (component_c${m} * 8)))`;return`
            let output_indices${m} = ${i.offsetToIndices(`global_idx * 4u + ${m}u`)};
            let offset_a${m} = ${a.broadcastedIndicesToOffset(`output_indices${m}`,i)};
            let offset_b${m} = ${o.broadcastedIndicesToOffset(`output_indices${m}`,i)};
            let offset_c${m} = ${u.broadcastedIndicesToOffset(`output_indices${m}`,i)};
            let index_a${m} = offset_a${m} / 4u;
            let index_b${m} = offset_b${m} / 4u;
            let index_c${m} = offset_c${m} / 4u;
            let component_a${m} = offset_a${m} % 4u;
            let component_b${m} = offset_b${m} % 4u;
            let component_c${m} = offset_c${m} % 4u;
            ${h}[${m}] = ${_}(${c(b,x,w)});
          `};s===9?l=`
            var data = vec4<u32>(0);
            ${p("data",0,"u32")}
            ${p("data",1,"u32")}
            ${p("data",2,"u32")}
            ${p("data",3,"u32")}
            output_data[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:l=`
            ${p("output_data[global_idx]",0)}
            ${p("output_data[global_idx]",1)}
            ${p("output_data[global_idx]",2)}
            ${p("output_data[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(u,a,o,i)}
        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${l}
      }`},qf=e=>{let t=e[1].dims,r=e[2].dims,n=e[0].dims,s=e[1].dataType,i=!(M.areEqual(t,r)&&M.areEqual(r,n)),a=t,o=M.size(t);if(i){let l=bn.calcShape(bn.calcShape(t,r,!1),n,!1);if(!l)throw new Error("Can't perform where op on the given tensors");a=l,o=M.size(a)}let u=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:l=>Lf(l,e,a,i,s),getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:u},...me(n,t,r,a)]})}},Wb=e=>{e.compute(qf(e.inputs))}}),Lb,ax=K(()=>{w1(),au(),v1(),$1(),x1(),S1(),k1(),z1(),A1(),R1(),M1(),B1(),N1(),P1(),D1(),U1(),W1(),L1(),q1(),F1(),V1(),H1(),G1(),j1(),K1(),ab(),Q1(),Z1(),X1(),Y1(),J1(),su(),ex(),cb(),tx(),rx(),nx(),lb(),ix(),Br(),ou(),sx(),Lb=new Map([["Abs",[Mg]],["Acos",[Bg]],["Acosh",[Ng]],["Add",[g_]],["ArgMax",[zg,mo]],["ArgMin",[Cg,mo]],["Asin",[Pg]],["Asinh",[Dg]],["Atan",[Ug]],["Atanh",[Wg]],["Attention",[Og]],["AveragePool",[wb,yb]],["BatchNormalization",[Ag]],["BiasAdd",[Rg]],["BiasSplitGelu",[m_]],["Cast",[qg,Lg]],["Ceil",[Vg]],["Clip",[Fg]],["Concat",[T_,E_]],["Conv",[vo,wo]],["ConvTranspose",[P_,N_]],["Cos",[Hg]],["Cosh",[Gg]],["CumSum",[D_,U_]],["DepthToSpace",[W_,L_]],["DequantizeLinear",[Eb,Ib]],["Div",[__]],["Einsum",[q_,F_]],["Elu",[jg,qn]],["Equal",[b_]],["Erf",[Kg]],["Exp",[Qg]],["Expand",[V_]],["FastGelu",[H_]],["Floor",[Zg]],["FusedConv",[vo,wo]],["Gather",[j_,G_]],["GatherElements",[J_,Y_]],["GatherBlockQuantized",[Z_,X_]],["GatherND",[K_,Q_]],["Gelu",[Xg]],["Gemm",[tb,eb]],["GlobalAveragePool",[$b,vb]],["GlobalMaxPool",[Tb,kb]],["Greater",[$_]],["GreaterOrEqual",[S_]],["GridSample",[rb,nb]],["GroupQueryAttention",[pb]],["HardSigmoid",[s_,i_]],["InstanceNormalization",[fb]],["LayerNormalization",[hb]],["LeakyRelu",[Yg,qn]],["Less",[x_]],["LessOrEqual",[k_]],["Log",[f_]],["MatMul",[mb]],["MatMulNBits",[gb,_b]],["MaxPool",[xb,Sb]],["Mul",[y_]],["MultiHeadAttention",[sb,ib]],["Neg",[e_]],["Not",[Jg]],["Pad",[bb]],["Pow",[w_]],["QuickGelu",[h_,qn]],["Range",[Cb]],["Reciprocal",[t_]],["ReduceMin",[Sg]],["ReduceMean",[yg]],["ReduceMax",[xg]],["ReduceSum",[Tg]],["ReduceProd",[kg]],["ReduceL1",[wg]],["ReduceL2",[vg]],["ReduceLogSum",[Ig]],["ReduceLogSumExp",[$g]],["ReduceSumSquare",[Eg]],["Relu",[r_]],["Resize",[Ab,Rb]],["RotaryEmbedding",[db]],["ScatterND",[Ob,zb]],["Sigmoid",[n_]],["Sin",[a_]],["Sinh",[o_]],["Slice",[Bb,Nb]],["SkipLayerNormalization",[Mb]],["Split",[ob,ub]],["Sqrt",[u_]],["Softmax",[Pb,Db]],["Sub",[v_]],["Tan",[l_]],["Tanh",[d_]],["ThresholdedRelu",[p_,qn]],["Tile",[Ub]],["Transpose",[og,ug]],["Where",[Wb]]])}),qb,ox=K(()=>{Ft(),mr(),Te(),qb=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,n,s){tr(e.programInfo.name);let i=this.backend.device,a=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let l of t)o.push({binding:o.length,resource:{buffer:l.buffer}});for(let l of r)o.push({binding:o.length,resource:{buffer:l.buffer}});s&&o.push({binding:o.length,resource:s});let u=i.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let l={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:u,dispatchGroup:n};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(l)}a.setPipeline(e.computePipeline),a.setBindGroup(0,u),a.dispatchWorkgroups(...n),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),Lt(e.programInfo.name)}dispose(){}build(e,t){tr(e.name);let r=this.backend.device,n=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(l=>{r.features.has(l.feature)&&n.push(`enable ${l.extension};`)});let s=ag(t,this.backend.device.limits),i=e.getShaderSource(s),a=`${n.join(`
`)}
${s.additionalImplementations}
${i}`,o=r.createShaderModule({code:a,label:e.name});Ae("verbose",()=>`[WebGPU] ${e.name} shader code: ${a}`);let u=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return Lt(e.name),{programInfo:e,computePipeline:u,uniformVariablesInfo:s.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,n=typeof e=="number"?1:e.z||1,s=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=s&&r<=s&&n<=s)return[t,r,n];let i=t*r*n,a=Math.ceil(Math.sqrt(i));if(a>s){if(a=Math.ceil(Math.cbrt(i)),a>s)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[a,a,a]}else return[a,a,1]}}}),Fb={};wn(Fb,{WebGpuBackend:()=>Vb});var Ff,Vf,Hf,Vb,ux=K(()=>{Ft(),ve(),mr(),tg(),b1(),ax(),ox(),Ff=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let n=0;n<e.length;++n){let s=e[n].dataType;switch(t[n]){case"none":{r.push("");break}case"type":{r.push(`${s}`);break}case"rank":{let i=e[n].dims.length;r.push(`${s};${i}`);break}case"dims":{let i=e[n].dims.join(",");r.push(`${s};${i}`);break}default:throw new Error(`unsupported input dependency: ${t[n]}`)}}return r.join("|")},Vf=(e,t,r)=>{var s,i;let n=e.name;return(s=e.shaderCache)!=null&&s.hint&&(n+="["+e.shaderCache.hint+"]"),n+=":"+r+`:${Ff(t,((i=e.shaderCache)==null?void 0:i.inputDependencies)??new Array(t.length).fill("dims"))}`,n},Hf=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},Vb=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],n={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},s=i=>t.features.has(i)&&r.push(i)&&!0;s("chromium-experimental-timestamp-query-inside-passes")||s("timestamp-query"),s("shader-f16"),s("subgroups"),this.device=await t.requestDevice(n),this.adapterInfo=new Hf(t.info||await t.requestAdapterInfo()),this.gpuDataManager=ig(this),this.programManager=new qb(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,tu(e.logLevel,!!e.debug),this.device.onuncapturederror=i=>{i.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${i.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;tr(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{var n;let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let s=0;s<t.length/2;s++){let i=r[s],a=i.kernelId,o=this.kernels.get(a),u=o.kernelType,l=o.kernelName,c=i.programName,p=i.inputTensorViews,h=i.outputTensorViews,m=t[s*2],_=t[s*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=m);let b=Number(m-this.queryTimeBase),x=Number(_-this.queryTimeBase);if(!Number.isSafeInteger(b)||!Number.isSafeInteger(x))throw new RangeError("incorrect timestamp range");if((n=this.env.webgpu.profiling)!=null&&n.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:p.map(w=>({dims:w.dims,dataType:pr(w.dataType)})),outputsMetadata:h.map(w=>({dims:w.dims,dataType:pr(w.dataType)})),kernelId:a,kernelType:u,kernelName:l,programName:c,startTime:b,endTime:x});else{let w="";p.forEach((k,S)=>{w+=`input[${S}]: [${k.dims}] | ${pr(k.dataType)}, `});let y="";h.forEach((k,S)=>{y+=`output[${S}]: [${k.dims}] | ${pr(k.dataType)}, `}),console.log(`[profiling] kernel "${a}|${u}|${l}|${c}" ${w}${y}execution time: ${x-b} ns`)}Yi("GPU",`${c}::${m}::${_}`)}e.unmap(),this.pendingQueries.delete(e)}),Lt()}run(e,t,r,n,s,i){tr(e.name);let a=[];for(let y=0;y<t.length;++y){let k=t[y].data;if(k===0)continue;let S=this.gpuDataManager.get(k);if(!S)throw new Error(`no GPU data for input: ${k}`);a.push(S)}let{outputs:o,dispatchGroup:u,programUniforms:l}=e.getRunData(t),c=r.length===0?o.map((y,k)=>k):r;if(c.length!==o.length)throw new Error(`Output size ${c.length} must be equal to ${o.length}.`);let p=[],h=[];for(let y=0;y<o.length;++y){if(!Number.isInteger(c[y])||c[y]<-3||c[y]>=i)throw new Error(`Invalid output index: ${c[y]}`);if(c[y]===-3)continue;let k=c[y]===-1,S=c[y]===-2,I=k||S?s(o[y].dataType,o[y].dims):n(c[y],o[y].dataType,o[y].dims);if(p.push(I),I.data===0)continue;let z=this.gpuDataManager.get(I.data);if(!z)throw new Error(`no GPU data for output: ${I.data}`);if(k&&this.temporaryData.push(z),S){let O=this.kernelPersistentData.get(this.currentKernelId);O||(O=[],this.kernelPersistentData.set(this.currentKernelId,O)),O.push(z)}h.push(z)}if(a.length!==t.length||h.length!==p.length){if(h.length===0)return Lt(e.name),p;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let m;if(l){let y=0,k=[];l.forEach(O=>{let R=typeof O.data=="number"?[O.data]:O.data;if(R.length===0)return;let B=O.type===10?2:4,G,le;O.type===10?(le=R.length>4?16:R.length>2?8:R.length*B,G=R.length>4?16:B*R.length):(le=R.length<=2?R.length*B:16,G=16),y=Math.ceil(y/le)*le,k.push(y);let ie=O.type===10?8:4;y+=R.length>4?Math.ceil(R.length/ie)*G:R.length*B});let S=16;y=Math.ceil(y/S)*S;let I=new ArrayBuffer(y);l.forEach((O,R)=>{let B=k[R],G=typeof O.data=="number"?[O.data]:O.data;if(O.type===6)new Int32Array(I,B,G.length).set(G);else if(O.type===12)new Uint32Array(I,B,G.length).set(G);else if(O.type===10)new Uint16Array(I,B,G.length).set(G);else if(O.type===1)new Float32Array(I,B,G.length).set(G);else throw new Error(`Unsupported uniform type: ${pr(O.type)}`)});let z=this.gpuDataManager.create(y,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(z.buffer,0,I,0,y),this.gpuDataManager.release(z.id),m={offset:0,size:y,buffer:z.buffer}}let _=this.programManager.normalizeDispatchGroupSize(u),b=_[1]===1&&_[2]===1,x=Vf(e,t,b),w=this.programManager.getArtifact(x);if(w||(w=this.programManager.build(e,_),this.programManager.setArtifact(x,w),Ae("info",()=>`[artifact] key: ${x}, programName: ${e.name}`)),l&&w.uniformVariablesInfo){if(l.length!==w.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${w.uniformVariablesInfo.length}, got ${l.length} in program "${w.programInfo.name}".`);for(let y=0;y<l.length;y++){let k=l[y],S=k.type,I=typeof k.data=="number"?1:k.data.length,[z,O]=w.uniformVariablesInfo[y];if(S!==z||I!==O)throw new Error(`Uniform variable ${y} mismatch: expect type ${z} with size ${O}, got type ${S} with size ${I} in program "${w.programInfo.name}".`)}}if(Ae("info",()=>`[ProgramManager] run "${e.name}" (key=${x}) with ${_[0]}x${_[1]}x${_[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let y={kernelId:this.currentKernelId,programName:w.programInfo.name,inputTensorViews:t,outputTensorViews:p};this.pendingKernels.push(y),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(y)}return this.programManager.run(w,a,h,_,m),Lt(e.name),p}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,n){let s=Lb.get(e);if(!s)throw new Error(`kernel not implemented: ${e}`);let i={kernelType:e,kernelName:n,kernelEntry:s[0],attributes:[s[1],r]};this.kernels.set(t,i)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let n=this.kernels.get(e);if(!n)throw new Error(`kernel not created: ${e}`);let s=n.kernelType,i=n.kernelName,a=n.kernelEntry,o=n.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${s}] ${i}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),Ae("info",()=>`[WebGPU] Start to run kernel "[${s}] ${i}"...`);let u=this.env.debug;this.temporaryData=[];try{return u&&this.device.pushErrorScope("validation"),a(t,o[1]),0}catch(l){return r.push(Promise.resolve(`[WebGPU] Kernel "[${s}] ${i}" failed. ${l}`)),1}finally{u&&r.push(this.device.popErrorScope().then(l=>l?`GPU validation error for kernel "[${s}] ${i}": ${l.message}`:null));for(let l of this.temporaryData)this.gpuDataManager.release(l.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,n){let s=this.sessionExternalDataMapping.get(e);s||(s=new Map,this.sessionExternalDataMapping.set(e,s));let i=s.get(t),a=this.gpuDataManager.registerExternalBuffer(r,n,i);return s.set(t,[a,r]),a}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let n=await po(this,e,t);return ru(n.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){var e;this.queryType="none",(((e=this.env.webgpu.profiling)==null?void 0:e.mode)==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){Ae("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){Ae("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){Ae("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let n=0;n<r;n++){let s=this.getComputePassEncoder(),i=e[n];this.writeTimestamp(this.pendingDispatchNumber*2),s.setPipeline(i.computePipeline),s.setBindGroup(0,i.bindGroup),s.dispatchWorkgroups(...i.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[n]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),Hb={};wn(Hb,{init:()=>Gb});var Ni,Gf,Gb,lx=K(()=>{ve(),mr(),Se(),_1(),Ni=class jb{constructor(t,r,n,s){this.module=t,this.dataType=r,this.data=n,this.dims=s}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=M.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=M.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=M.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=M.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(M.size(t)!==M.size(this.dims))throw new Error("Invalid new shape");return new jb(this.module,this.dataType,this.data,t)}},Gf=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let n=e.PTR_SIZE,s=r/e.PTR_SIZE,i=n===4?"i32":"i64";this.opKernelContext=Number(e.getValue(n*s++,i));let a=Number(e.getValue(n*s++,i));this.outputCount=Number(e.getValue(n*s++,i)),this.customDataOffset=Number(e.getValue(n*s++,"*")),this.customDataSize=Number(e.getValue(n*s++,i));let o=[];for(let u=0;u<a;u++){let l=Number(e.getValue(n*s++,i)),c=Number(e.getValue(n*s++,"*")),p=Number(e.getValue(n*s++,i)),h=[];for(let m=0;m<p;m++)h.push(Number(e.getValue(n*s++,i)));o.push(new Ni(e,l,c,h))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){var a;let r=((a=t==null?void 0:t.inputs)==null?void 0:a.map(o=>typeof o=="number"?this.inputs[o]:o))??this.inputs,n=(t==null?void 0:t.outputs)??[],s=(o,u,l)=>new Ni(this.module,u,this.output(o,l),l),i=(o,u)=>{let l=Hr(o,u);if(!l)throw new Error(`Unsupported data type: ${o}`);let c=l>0?this.backend.gpuDataManager.create(l).id:0;return new Ni(this.module,o,c,u)};return this.backend.run(e,r,n,s,i,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let n=this.module.PTR_SIZE,s=n===4?"i32":"i64",i=this.module.stackAlloc((1+t.length)*n);this.module.setValue(i,t.length,s);for(let a=0;a<t.length;a++)this.module.setValue(i+n*(a+1),t[a],s);return this.module._JsepOutput(this.opKernelContext,e,i)}catch(n){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${n}`)}finally{this.module.stackRestore(r)}}},Gb=async(e,t,r,n)=>{let s=t.jsepInit;if(!s)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let i=(ux(),ui(Fb)).WebGpuBackend,a=new i;await a.initialize(r,n),s("webgpu",[a,o=>a.alloc(Number(o)),o=>a.free(o),(o,u,l,c=!1)=>{if(c)Ae("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(u)}, size=${Number(l)}`),a.memcpy(Number(o),Number(u));else{Ae("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(u)}, size=${Number(l)}`);let p=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(l));a.upload(Number(u),p)}},async(o,u,l)=>{Ae("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${u}, size=${l}`),await a.download(Number(o),()=>t.HEAPU8.subarray(Number(u)>>>0,Number(u+l)>>>0))},(o,u,l)=>a.createKernel(o,Number(u),l,t.UTF8ToString(t._JsepGetNodeName(Number(u)))),o=>a.releaseKernel(o),(o,u,l,c)=>{Ae("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${l}, kernel=${o}, contextDataOffset=${u}`);let p=new Gf(t,a,Number(u));return a.computeKernel(Number(o),p,c)},()=>a.captureBegin(),()=>a.captureEnd(),()=>a.replay()])}else{let i=new ng(r);s("webnn",[i,()=>i.reserveTensorId(),a=>i.releaseTensorId(a),async(a,o,u,l,c)=>i.ensureTensor(a,o,u,l,c),(a,o)=>{i.uploadTensor(a,o)},async(a,o)=>i.downloadTensor(a,o)])}}}),jf,fu,hu,vr,Kf,Va,ss,mu,gu,Ha,_u,bu,yu,Kb=K(()=>{h1(),m1(),ve(),en(),Xo(),Xm(),jf=(e,t)=>{Fe()._OrtInit(e,t)!==0&&De("Can't initialize onnxruntime.")},fu=async e=>{jf(e.wasm.numThreads,es(e.logLevel))},hu=async(e,t)=>{var r,n;(n=(r=Fe()).asyncInit)==null||n.call(r);{let s=(lx(),ui(Hb)).init;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");let i=e.webgpu.adapter;if(i){if(typeof i.limits!="object"||typeof i.features!="object"||typeof i.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let a=e.webgpu.powerPreference;if(a!==void 0&&a!=="low-power"&&a!=="high-performance")throw new Error(`Invalid powerPreference setting: "${a}"`);let o=e.webgpu.forceFallbackAdapter;if(o!==void 0&&typeof o!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${o}"`);if(i=await navigator.gpu.requestAdapter({powerPreference:a,forceFallbackAdapter:o}),!i)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}await s("webgpu",Fe(),e,i)}if(t==="webnn"){if(typeof navigator>"u"||!navigator.ml)throw new Error("WebNN is not supported in current environment");await s("webnn",Fe(),e)}}},vr=new Map,Kf=e=>{let t=Fe(),r=t.stackSave();try{let n=t.PTR_SIZE,s=t.stackAlloc(2*n);t._OrtGetInputOutputCount(e,s,s+n)!==0&&De("Can't get session input/output count.");let i=n===4?"i32":"i64";return[Number(t.getValue(s,i)),Number(t.getValue(s+n,i))]}finally{t.stackRestore(r)}},Va=(e,t)=>{let r=Fe(),n=r.stackSave(),s=0;try{let i=r.PTR_SIZE,a=r.stackAlloc(2*i);r._OrtGetInputOutputMetadata(e,t,a,a+i)!==0&&De("Can't get session input/output metadata.");let o=Number(r.getValue(a,"*"));s=Number(r.getValue(a+i,"*"));let u=r.HEAP32[s/4];if(u===0)return[o,0];let l=r.HEAPU32[s/4+1],c=[];for(let p=0;p<l;p++){let h=Number(r.getValue(s+8+p*i,"*"));c.push(h!==0?r.UTF8ToString(h):Number(r.getValue(s+8+(p+l)*i,"*")))}return[o,u,c]}finally{r.stackRestore(n),s!==0&&r._OrtFree(s)}},ss=e=>{let t=Fe(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},mu=async(e,t)=>{var p,h,m,_;let r,n,s=Fe();Array.isArray(e)?[r,n]=e:e.buffer===s.HEAPU8.buffer?[r,n]=[e.byteOffset,e.byteLength]:[r,n]=ss(e);let i=0,a=0,o=0,u=[],l=[],c=[];try{if([a,u]=await Zm(t),(t==null?void 0:t.externalData)&&s.mountExternalData){let R=[];for(let B of t.externalData){let G=typeof B=="string"?B:B.path;R.push(eu(typeof B=="string"?B:B.data).then(le=>{s.mountExternalData(G,le)}))}await Promise.all(R)}for(let R of(t==null?void 0:t.executionProviders)??[])if((typeof R=="string"?R:R.name)==="webnn"){if(s.shouldTransferToMLTensor=!1,typeof R!="string"){let B=R,G=B==null?void 0:B.context,le=B==null?void 0:B.gpuDevice,ie=B==null?void 0:B.deviceType,ae=B==null?void 0:B.powerPreference;G?s.currentContext=G:le?s.currentContext=await s.webnnCreateMLContext(le):s.currentContext=await s.webnnCreateMLContext({deviceType:ie,powerPreference:ae})}else s.currentContext=await s.webnnCreateMLContext();break}i=await s._OrtCreateSession(r,n,a),(p=s.webgpuOnCreateSession)==null||p.call(s,i),i===0&&De("Can't create a session."),(h=s.jsepOnCreateSession)==null||h.call(s),s.currentContext&&(s.webnnRegisterMLContext(i,s.currentContext),s.currentContext=void 0,s.shouldTransferToMLTensor=!0);let[b,x]=Kf(i),w=!!(t!=null&&t.enableGraphCapture),y=[],k=[],S=[],I=[],z=[];for(let R=0;R<b;R++){let[B,G,le]=Va(i,R);B===0&&De("Can't get an input name."),l.push(B);let ie=s.UTF8ToString(B);y.push(ie),S.push(G===0?{name:ie,isTensor:!1}:{name:ie,isTensor:!0,type:pr(G),shape:le})}for(let R=0;R<x;R++){let[B,G,le]=Va(i,R+b);B===0&&De("Can't get an output name."),c.push(B);let ie=s.UTF8ToString(B);k.push(ie),I.push(G===0?{name:ie,isTensor:!1}:{name:ie,isTensor:!0,type:pr(G),shape:le});{if(w&&(t==null?void 0:t.preferredOutputLocation)===void 0){z.push("gpu-buffer");continue}let ae=typeof(t==null?void 0:t.preferredOutputLocation)=="string"?t.preferredOutputLocation:((m=t==null?void 0:t.preferredOutputLocation)==null?void 0:m[ie])??"cpu",ke=s.webnnIsGraphOutput;if(ae==="cpu"&&ke&&ke(i,ie)){z.push("ml-tensor-cpu-output");continue}if(ae!=="cpu"&&ae!=="cpu-pinned"&&ae!=="gpu-buffer"&&ae!=="ml-tensor")throw new Error(`Not supported preferred output location: ${ae}.`);if(w&&ae!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${ae}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);z.push(ae)}}let O=null;return z.some(R=>R==="gpu-buffer"||R==="ml-tensor"||R==="ml-tensor-cpu-output")&&(o=s._OrtCreateBinding(i),o===0&&De("Can't create IO binding."),O={handle:o,outputPreferredLocations:z,outputPreferredLocationsEncoded:z.map(R=>R==="ml-tensor-cpu-output"?"ml-tensor":R).map(R=>lo(R))}),vr.set(i,[i,l,c,O,w,!1]),[i,y,k,S,I]}catch(b){throw l.forEach(x=>s._OrtFree(x)),c.forEach(x=>s._OrtFree(x)),o!==0&&s._OrtReleaseBinding(o)!==0&&De("Can't release IO binding."),i!==0&&s._OrtReleaseSession(i)!==0&&De("Can't release session."),b}finally{s._free(r),a!==0&&s._OrtReleaseSessionOptions(a)!==0&&De("Can't release session options."),u.forEach(b=>s._free(b)),(_=s.unmountExternalData)==null||_.call(s)}},gu=e=>{var u,l,c;let t=Fe(),r=vr.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[n,s,i,a,o]=r;a&&(o&&t._OrtClearBoundOutputs(a.handle)!==0&&De("Can't clear bound outputs."),t._OrtReleaseBinding(a.handle)!==0&&De("Can't release IO binding.")),(u=t.jsepOnReleaseSession)==null||u.call(t,e),(l=t.webnnOnReleaseSession)==null||l.call(t,e),(c=t.webgpuOnReleaseSession)==null||c.call(t,e),s.forEach(p=>t._OrtFree(p)),i.forEach(p=>t._OrtFree(p)),t._OrtReleaseSession(n)!==0&&De("Can't release session."),vr.delete(e)},Ha=async(e,t,r,n,s,i,a=!1)=>{if(!e){t.push(0);return}let o=Fe(),u=o.PTR_SIZE,l=e[0],c=e[1],p=e[3],h=p,m,_;if(l==="string"&&(p==="gpu-buffer"||p==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(a&&p!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${i} when enableGraphCapture is true.`);if(p==="gpu-buffer"){let w=e[2].gpuBuffer;_=Hr(Vr(l),c);{let y=o.jsepRegisterBuffer;if(!y)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');m=y(n,i,w,_)}}else if(p==="ml-tensor"){let w=e[2].mlTensor;_=Hr(Vr(l),c);let y=o.webnnRegisterMLTensor;if(!y)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');m=y(n,w,Vr(l),c)}else{let w=e[2];if(Array.isArray(w)){_=u*w.length,m=o._malloc(_),r.push(m);for(let y=0;y<w.length;y++){if(typeof w[y]!="string")throw new TypeError(`tensor data at index ${y} is not a string`);o.setValue(m+y*u,Pt(w[y],r),"*")}}else{let y=o.webnnIsGraphInput,k=o.webnnIsGraphOutput;if(l!=="string"&&y&&k){let S=o.UTF8ToString(s);if(y(n,S)||k(n,S)){let I=Vr(l);_=Hr(I,c),h="ml-tensor";let z=o.webnnCreateTemporaryTensor,O=o.webnnUploadTensor;if(!z||!O)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let R=await z(n,I,c);O(R,new Uint8Array(w.buffer,w.byteOffset,w.byteLength)),m=R}else _=w.byteLength,m=o._malloc(_),r.push(m),o.HEAPU8.set(new Uint8Array(w.buffer,w.byteOffset,_),m)}else _=w.byteLength,m=o._malloc(_),r.push(m),o.HEAPU8.set(new Uint8Array(w.buffer,w.byteOffset,_),m)}}let b=o.stackSave(),x=o.stackAlloc(4*c.length);try{c.forEach((y,k)=>o.setValue(x+k*u,y,u===4?"i32":"i64"));let w=o._OrtCreateTensor(Vr(l),m,_,x,c.length,lo(h));w===0&&De(`Can't create tensor for input/output. session=${n}, index=${i}.`),t.push(w)}finally{o.stackRestore(b)}},_u=async(e,t,r,n,s,i)=>{var le,ie,ae,ke;let a=Fe(),o=a.PTR_SIZE,u=vr.get(e);if(!u)throw new Error(`cannot run inference. invalid session id: ${e}`);let l=u[0],c=u[1],p=u[2],h=u[3],m=u[4],_=u[5],b=t.length,x=n.length,w=0,y=[],k=[],S=[],I=[],z=a.stackSave(),O=a.stackAlloc(b*o),R=a.stackAlloc(b*o),B=a.stackAlloc(x*o),G=a.stackAlloc(x*o);try{[w,y]=Qm(i);for(let Q=0;Q<b;Q++)await Ha(r[Q],k,I,e,c[t[Q]],t[Q],m);for(let Q=0;Q<x;Q++)await Ha(s[Q],S,I,e,p[n[Q]],b+n[Q],m);for(let Q=0;Q<b;Q++)a.setValue(O+Q*o,k[Q],"*"),a.setValue(R+Q*o,c[t[Q]],"*");for(let Q=0;Q<x;Q++)a.setValue(B+Q*o,S[Q],"*"),a.setValue(G+Q*o,p[n[Q]],"*");if(h&&!_){let{handle:Q,outputPreferredLocations:ce,outputPreferredLocationsEncoded:Me}=h;if(c.length!==b)throw new Error(`input count from feeds (${b}) is expected to be always equal to model's input count (${c.length}).`);for(let P=0;P<b;P++){let V=t[P];await a._OrtBindInput(Q,c[V],k[P])!==0&&De(`Can't bind input[${P}] for session=${e}.`)}for(let P=0;P<x;P++){let V=n[P];(le=s[P])!=null&&le[3]?a._OrtBindOutput(Q,p[V],S[P],0)!==0&&De(`Can't bind pre-allocated output[${P}] for session=${e}.`):a._OrtBindOutput(Q,p[V],0,Me[V])!==0&&De(`Can't bind output[${P}] to ${ce[P]} for session=${e}.`)}vr.set(e,[l,c,p,h,m,!0])}(ie=a.jsepOnRunStart)==null||ie.call(a,l),(ae=a.webnnOnRunStart)==null||ae.call(a,l);let be;h?be=await a._OrtRunWithBinding(l,h.handle,x,B,w):be=await a._OrtRun(l,R,O,b,G,x,B,w),be!==0&&De("failed to call OrtRun().");let X=[],se=[];for(let Q=0;Q<x;Q++){let ce=Number(a.getValue(B+Q*o,"*"));if(ce===S[Q]){X.push(s[Q]);continue}let Me=a.stackSave(),P=a.stackAlloc(4*o),V=!1,J,_e=0;try{a._OrtGetTensorData(ce,P,P+o,P+2*o,P+3*o)!==0&&De(`Can't access output tensor data on index ${Q}.`);let Xe=o===4?"i32":"i64",W=Number(a.getValue(P,Xe));_e=a.getValue(P+o,"*");let N=a.getValue(P+o*2,"*"),oe=Number(a.getValue(P+o*3,Xe)),Y=[];for(let T=0;T<oe;T++)Y.push(Number(a.getValue(N+T*o,Xe)));a._OrtFree(N)!==0&&De("Can't free memory for tensor dims.");let de=Y.reduce((T,E)=>T*E,1);J=pr(W);let ze=h==null?void 0:h.outputPreferredLocations[n[Q]];if(J==="string"){if(ze==="gpu-buffer"||ze==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let T=[];for(let E=0;E<de;E++){let A=a.getValue(_e+E*o,"*"),L=a.getValue(_e+(E+1)*o,"*"),q=E===de-1?void 0:L-A;T.push(a.UTF8ToString(A,q))}X.push([J,Y,T,"cpu"])}else if(ze==="gpu-buffer"&&de>0){let T=a.jsepGetBuffer;if(!T)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let E=T(_e),A=Hr(W,de);if(A===void 0||!Yo(J))throw new Error(`Unsupported data type: ${J}`);V=!0,X.push([J,Y,{gpuBuffer:E,download:a.jsepCreateDownloader(E,A,J),dispose:()=>{a._OrtReleaseTensor(ce)!==0&&De("Can't release tensor.")}},"gpu-buffer"])}else if(ze==="ml-tensor"&&de>0){let T=a.webnnEnsureTensor,E=a.webnnIsGraphInputOutputTypeSupported;if(!T||!E)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Hr(W,de)===void 0||!Jo(J))throw new Error(`Unsupported data type: ${J}`);if(!E(e,J,!1))throw new Error(`preferredLocation "ml-tensor" for ${J} output is not supported by current WebNN Context.`);let A=await T(e,_e,W,Y,!1);V=!0,X.push([J,Y,{mlTensor:A,download:a.webnnCreateMLTensorDownloader(_e,J),dispose:()=>{a.webnnReleaseTensorId(_e),a._OrtReleaseTensor(ce)}},"ml-tensor"])}else if(ze==="ml-tensor-cpu-output"&&de>0){let T=a.webnnCreateMLTensorDownloader(_e,J)(),E=X.length;V=!0,se.push((async()=>{let A=[E,await T];return a.webnnReleaseTensorId(_e),a._OrtReleaseTensor(ce),A})()),X.push([J,Y,[],"cpu"])}else{let T=gs(J),E=new T(de);new Uint8Array(E.buffer,E.byteOffset,E.byteLength).set(a.HEAPU8.subarray(_e,_e+E.byteLength)),X.push([J,Y,E,"cpu"])}}finally{a.stackRestore(Me),J==="string"&&_e&&a._free(_e),V||a._OrtReleaseTensor(ce)}}h&&!m&&(a._OrtClearBoundOutputs(h.handle)!==0&&De("Can't clear bound outputs."),vr.set(e,[l,c,p,h,m,!1]));for(let[Q,ce]of await Promise.all(se))X[Q][2]=ce;return X}finally{(ke=a.webnnOnRunEnd)==null||ke.call(a,l),a.stackRestore(z),k.forEach(be=>a._OrtReleaseTensor(be)),S.forEach(be=>a._OrtReleaseTensor(be)),I.forEach(be=>a._free(be)),w!==0&&a._OrtReleaseRunOptions(w),y.forEach(be=>a._free(be))}},bu=e=>{let t=Fe(),r=vr.get(e);if(!r)throw new Error("invalid session id");let n=r[0],s=t._OrtEndProfiling(n);s===0&&De("Can't get an profile file name."),t._OrtFree(s)},yu=e=>{let t=[];for(let r of e){let n=r[2];!Array.isArray(n)&&"buffer"in n&&t.push(n.buffer)}return t}}),$r,wt,an,Pn,Dn,Pi,Ga,Di,Wr,Lr,Qf,Qb,Zb,Xb,Yb,Jb,ey,ty,ry=K(()=>{Ft(),Kb(),en(),Qo(),$r=()=>!!He.wasm.proxy&&typeof document<"u",an=!1,Pn=!1,Dn=!1,Di=new Map,Wr=(e,t)=>{let r=Di.get(e);r?r.push(t):Di.set(e,[t])},Lr=()=>{if(an||!Pn||Dn||!wt)throw new Error("worker not ready")},Qf=e=>{switch(e.data.type){case"init-wasm":an=!1,e.data.err?(Dn=!0,Ga[1](e.data.err)):(Pn=!0,Ga[0]()),Pi&&(URL.revokeObjectURL(Pi),Pi=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Di.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},Qb=async()=>{if(!Pn){if(an)throw new Error("multiple calls to 'initWasm()' detected.");if(Dn)throw new Error("previous call to 'initWasm()' failed.");if(an=!0,$r())return new Promise((e,t)=>{wt==null||wt.terminate(),jm().then(([r,n])=>{try{wt=n,wt.onerror=i=>t(i),wt.onmessage=Qf,Ga=[e,t];let s={type:"init-wasm",in:He};!s.in.wasm.wasmPaths&&(r||uo)&&(s.in.wasm.wasmPaths={wasm:new URL("/assets/ort-wasm-simd-threaded.jsep-CLPRrI3A.wasm",import.meta.url).href}),wt.postMessage(s),Pi=r}catch(s){t(s)}},t)});try{await Zo(He.wasm),await fu(He),Pn=!0}catch(e){throw Dn=!0,e}finally{an=!1}}},Zb=async e=>{if($r())return Lr(),new Promise((t,r)=>{Wr("init-ep",[t,r]);let n={type:"init-ep",in:{epName:e,env:He}};wt.postMessage(n)});await hu(He,e)},Xb=async e=>$r()?(Lr(),new Promise((t,r)=>{Wr("copy-from",[t,r]);let n={type:"copy-from",in:{buffer:e}};wt.postMessage(n,[e.buffer])})):ss(e),Yb=async(e,t)=>{if($r()){if(t!=null&&t.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Lr(),new Promise((r,n)=>{Wr("create",[r,n]);let s={type:"create",in:{model:e,options:{...t}}},i=[];e instanceof Uint8Array&&i.push(e.buffer),wt.postMessage(s,i)})}else return mu(e,t)},Jb=async e=>{if($r())return Lr(),new Promise((t,r)=>{Wr("release",[t,r]);let n={type:"release",in:e};wt.postMessage(n)});gu(e)},ey=async(e,t,r,n,s,i)=>{if($r()){if(r.some(a=>a[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(s.some(a=>a))throw new Error("pre-allocated output tensor is not supported for proxy.");return Lr(),new Promise((a,o)=>{Wr("run",[a,o]);let u=r,l={type:"run",in:{sessionId:e,inputIndices:t,inputs:u,outputIndices:n,options:i}};wt.postMessage(l,yu(u))})}else return _u(e,t,r,n,s,i)},ty=async e=>{if($r())return Lr(),new Promise((t,r)=>{Wr("end-profiling",[t,r]);let n={type:"end-profiling",in:e};wt.postMessage(n)});bu(e)}}),ja,Zf,ny,dx=K(()=>{Ft(),ry(),ve(),Ko(),Xm(),ja=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Zf=e=>{switch(e[3]){case"cpu":return new Xt(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Yo(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:n,dispose:s}=e[2];return Xt.fromGpuBuffer(r,{dataType:t,dims:e[1],download:n,dispose:s})}case"ml-tensor":{let t=e[0];if(!Jo(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:n,dispose:s}=e[2];return Xt.fromMLTensor(r,{dataType:t,dims:e[1],download:n,dispose:s})}default:throw new Error(`invalid data location: ${e[3]}`)}},ny=class{async fetchModelAndCopyToWasmMemory(e){return Xb(await eu(e))}async loadModel(e,t){tr();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Yb(r,t),Lt()}async dispose(){return Jb(this.sessionId)}async run(e,t,r){tr();let n=[],s=[];Object.entries(e).forEach(p=>{let h=p[0],m=p[1],_=this.inputNames.indexOf(h);if(_===-1)throw new Error(`invalid input '${h}'`);n.push(m),s.push(_)});let i=[],a=[];Object.entries(t).forEach(p=>{let h=p[0],m=p[1],_=this.outputNames.indexOf(h);if(_===-1)throw new Error(`invalid output '${h}'`);i.push(m),a.push(_)});let o=n.map((p,h)=>ja(p,()=>`input "${this.inputNames[s[h]]}"`)),u=i.map((p,h)=>p?ja(p,()=>`output "${this.outputNames[a[h]]}"`):null),l=await ey(this.sessionId,s,o,a,u,r),c={};for(let p=0;p<l.length;p++)c[this.outputNames[a[p]]]=i[p]??Zf(l[p]);return Lt(),c}startProfiling(){}endProfiling(){ty(this.sessionId)}}}),iy={};wn(iy,{OnnxruntimeWebAssemblyBackend:()=>So,initializeFlags:()=>xo,wasmBackend:()=>sy});var xo,So,sy,cx=K(()=>{Ft(),ry(),dx(),xo=()=>{(typeof He.wasm.initTimeout!="number"||He.wasm.initTimeout<0)&&(He.wasm.initTimeout=0);let e=He.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),He.wasm.simd=!1),typeof He.wasm.proxy!="boolean"&&(He.wasm.proxy=!1),typeof He.wasm.trace!="boolean"&&(He.wasm.trace=!1),typeof He.wasm.numThreads!="number"||!Number.isInteger(He.wasm.numThreads)||He.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)He.wasm.numThreads=1;else{let t=typeof navigator>"u"?Z$("node:os").cpus().length:navigator.hardwareConcurrency;He.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},So=class{async init(e){xo(),await Qb(),await Zb(e)}async createInferenceSessionHandler(e,t){let r=new ny;return await r.loadModel(e,t),r}},sy=new So});Ft();Ft();Ft();var px="1.22.0";{let e=(cx(),ui(iy)).wasmBackend;ln("webgpu",e,5),ln("webnn",e,5),ln("cpu",e,10),ln("wasm",e,10)}Object.defineProperty(He.versions,"web",{value:px,enumerable:!0});/**
* @license
* Copyright 2021 Google LLC. All Rights Reserved.
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
* =============================================================================
*//**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 *//**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */const fx=async()=>WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])),hx=()=>(async e=>{try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(e)}catch{return!1}})(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11])),mx={"Amazon Silk":"amazon_silk","Android Browser":"android",Bada:"bada",BlackBerry:"blackberry",Chrome:"chrome",Chromium:"chromium",Electron:"electron",Epiphany:"epiphany",Firefox:"firefox",Focus:"focus",Generic:"generic","Google Search":"google_search",Googlebot:"googlebot","Internet Explorer":"ie","K-Meleon":"k_meleon",Maxthon:"maxthon","Microsoft Edge":"edge","MZ Browser":"mz","NAVER Whale Browser":"naver",Opera:"opera","Opera Coast":"opera_coast",PhantomJS:"phantomjs",Puffin:"puffin",QupZilla:"qupzilla",QQ:"qq",QQLite:"qqlite",Safari:"safari",Sailfish:"sailfish","Samsung Internet for Android":"samsung_internet",SeaMonkey:"seamonkey",Sleipnir:"sleipnir",Swing:"swing",Tizen:"tizen","UC Browser":"uc",Vivaldi:"vivaldi","WebOS Browser":"webos",WeChat:"wechat","Yandex Browser":"yandex",Roku:"roku"},ay={amazon_silk:"Amazon Silk",android:"Android Browser",bada:"Bada",blackberry:"BlackBerry",chrome:"Chrome",chromium:"Chromium",electron:"Electron",epiphany:"Epiphany",firefox:"Firefox",focus:"Focus",generic:"Generic",googlebot:"Googlebot",google_search:"Google Search",ie:"Internet Explorer",k_meleon:"K-Meleon",maxthon:"Maxthon",edge:"Microsoft Edge",mz:"MZ Browser",naver:"NAVER Whale Browser",opera:"Opera",opera_coast:"Opera Coast",phantomjs:"PhantomJS",puffin:"Puffin",qupzilla:"QupZilla",qq:"QQ Browser",qqlite:"QQ Browser Lite",safari:"Safari",sailfish:"Sailfish",samsung_internet:"Samsung Internet for Android",seamonkey:"SeaMonkey",sleipnir:"Sleipnir",swing:"Swing",tizen:"Tizen",uc:"UC Browser",vivaldi:"Vivaldi",webos:"WebOS Browser",wechat:"WeChat",yandex:"Yandex Browser"},et={tablet:"tablet",mobile:"mobile",desktop:"desktop",tv:"tv"},mt={WindowsPhone:"Windows Phone",Windows:"Windows",MacOS:"macOS",iOS:"iOS",Android:"Android",WebOS:"WebOS",BlackBerry:"BlackBerry",Bada:"Bada",Tizen:"Tizen",Linux:"Linux",ChromeOS:"Chrome OS",PlayStation4:"PlayStation 4",Roku:"Roku"},Sr={EdgeHTML:"EdgeHTML",Blink:"Blink",Trident:"Trident",Presto:"Presto",Gecko:"Gecko",WebKit:"WebKit"};class H{static getFirstMatch(t,r){const n=r.match(t);return n&&n.length>0&&n[1]||""}static getSecondMatch(t,r){const n=r.match(t);return n&&n.length>1&&n[2]||""}static matchAndReturnConst(t,r,n){if(t.test(r))return n}static getWindowsVersionName(t){switch(t){case"NT":return"NT";case"XP":return"XP";case"NT 5.0":return"2000";case"NT 5.1":return"XP";case"NT 5.2":return"2003";case"NT 6.0":return"Vista";case"NT 6.1":return"7";case"NT 6.2":return"8";case"NT 6.3":return"8.1";case"NT 10.0":return"10";default:return}}static getMacOSVersionName(t){const r=t.split(".").splice(0,2).map(n=>parseInt(n,10)||0);if(r.push(0),r[0]===10)switch(r[1]){case 5:return"Leopard";case 6:return"Snow Leopard";case 7:return"Lion";case 8:return"Mountain Lion";case 9:return"Mavericks";case 10:return"Yosemite";case 11:return"El Capitan";case 12:return"Sierra";case 13:return"High Sierra";case 14:return"Mojave";case 15:return"Catalina";default:return}}static getAndroidVersionName(t){const r=t.split(".").splice(0,2).map(n=>parseInt(n,10)||0);if(r.push(0),!(r[0]===1&&r[1]<5)){if(r[0]===1&&r[1]<6)return"Cupcake";if(r[0]===1&&r[1]>=6)return"Donut";if(r[0]===2&&r[1]<2)return"Eclair";if(r[0]===2&&r[1]===2)return"Froyo";if(r[0]===2&&r[1]>2)return"Gingerbread";if(r[0]===3)return"Honeycomb";if(r[0]===4&&r[1]<1)return"Ice Cream Sandwich";if(r[0]===4&&r[1]<4)return"Jelly Bean";if(r[0]===4&&r[1]>=4)return"KitKat";if(r[0]===5)return"Lollipop";if(r[0]===6)return"Marshmallow";if(r[0]===7)return"Nougat";if(r[0]===8)return"Oreo";if(r[0]===9)return"Pie"}}static getVersionPrecision(t){return t.split(".").length}static compareVersions(t,r,n=!1){const s=H.getVersionPrecision(t),i=H.getVersionPrecision(r);let a=Math.max(s,i),o=0;const u=H.map([t,r],l=>{const c=a-H.getVersionPrecision(l),p=l+new Array(c+1).join(".0");return H.map(p.split("."),h=>new Array(20-h.length).join("0")+h).reverse()});for(n&&(o=a-Math.min(s,i)),a-=1;a>=o;){if(u[0][a]>u[1][a])return 1;if(u[0][a]===u[1][a]){if(a===o)return 0;a-=1}else if(u[0][a]<u[1][a])return-1}}static map(t,r){const n=[];let s;if(Array.prototype.map)return Array.prototype.map.call(t,r);for(s=0;s<t.length;s+=1)n.push(r(t[s]));return n}static find(t,r){let n,s;if(Array.prototype.find)return Array.prototype.find.call(t,r);for(n=0,s=t.length;n<s;n+=1){const i=t[n];if(r(i,n))return i}}static assign(t,...r){const n=t;let s,i;if(Object.assign)return Object.assign(t,...r);for(s=0,i=r.length;s<i;s+=1){const a=r[s];typeof a=="object"&&a!==null&&Object.keys(a).forEach(u=>{n[u]=a[u]})}return t}static getBrowserAlias(t){return mx[t]}static getBrowserTypeByAlias(t){return ay[t]||""}}const Ve=/version\/(\d+(\.?_?\d+)+)/i,gx=[{test:[/googlebot/i],describe(e){const t={name:"Googlebot"},r=H.getFirstMatch(/googlebot\/(\d+(\.\d+))/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/opera/i],describe(e){const t={name:"Opera"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:opera)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/opr\/|opios/i],describe(e){const t={name:"Opera"},r=H.getFirstMatch(/(?:opr|opios)[\s/](\S+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/SamsungBrowser/i],describe(e){const t={name:"Samsung Internet for Android"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:SamsungBrowser)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/Whale/i],describe(e){const t={name:"NAVER Whale Browser"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:whale)[\s/](\d+(?:\.\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/MZBrowser/i],describe(e){const t={name:"MZ Browser"},r=H.getFirstMatch(/(?:MZBrowser)[\s/](\d+(?:\.\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/focus/i],describe(e){const t={name:"Focus"},r=H.getFirstMatch(/(?:focus)[\s/](\d+(?:\.\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/swing/i],describe(e){const t={name:"Swing"},r=H.getFirstMatch(/(?:swing)[\s/](\d+(?:\.\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/coast/i],describe(e){const t={name:"Opera Coast"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:coast)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/opt\/\d+(?:.?_?\d+)+/i],describe(e){const t={name:"Opera Touch"},r=H.getFirstMatch(/(?:opt)[\s/](\d+(\.?_?\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/yabrowser/i],describe(e){const t={name:"Yandex Browser"},r=H.getFirstMatch(/(?:yabrowser)[\s/](\d+(\.?_?\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/ucbrowser/i],describe(e){const t={name:"UC Browser"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:ucbrowser)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/Maxthon|mxios/i],describe(e){const t={name:"Maxthon"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:Maxthon|mxios)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/epiphany/i],describe(e){const t={name:"Epiphany"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:epiphany)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/puffin/i],describe(e){const t={name:"Puffin"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:puffin)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/sleipnir/i],describe(e){const t={name:"Sleipnir"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:sleipnir)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/k-meleon/i],describe(e){const t={name:"K-Meleon"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/(?:k-meleon)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/micromessenger/i],describe(e){const t={name:"WeChat"},r=H.getFirstMatch(/(?:micromessenger)[\s/](\d+(\.?_?\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/qqbrowser/i],describe(e){const t={name:/qqbrowserlite/i.test(e)?"QQ Browser Lite":"QQ Browser"},r=H.getFirstMatch(/(?:qqbrowserlite|qqbrowser)[/](\d+(\.?_?\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/msie|trident/i],describe(e){const t={name:"Internet Explorer"},r=H.getFirstMatch(/(?:msie |rv:)(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/\sedg\//i],describe(e){const t={name:"Microsoft Edge"},r=H.getFirstMatch(/\sedg\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/edg([ea]|ios)/i],describe(e){const t={name:"Microsoft Edge"},r=H.getSecondMatch(/edg([ea]|ios)\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/vivaldi/i],describe(e){const t={name:"Vivaldi"},r=H.getFirstMatch(/vivaldi\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/seamonkey/i],describe(e){const t={name:"SeaMonkey"},r=H.getFirstMatch(/seamonkey\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/sailfish/i],describe(e){const t={name:"Sailfish"},r=H.getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i,e);return r&&(t.version=r),t}},{test:[/silk/i],describe(e){const t={name:"Amazon Silk"},r=H.getFirstMatch(/silk\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/phantom/i],describe(e){const t={name:"PhantomJS"},r=H.getFirstMatch(/phantomjs\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/slimerjs/i],describe(e){const t={name:"SlimerJS"},r=H.getFirstMatch(/slimerjs\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/blackberry|\bbb\d+/i,/rim\stablet/i],describe(e){const t={name:"BlackBerry"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/blackberry[\d]+\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/(web|hpw)[o0]s/i],describe(e){const t={name:"WebOS Browser"},r=H.getFirstMatch(Ve,e)||H.getFirstMatch(/w(?:eb)?[o0]sbrowser\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/bada/i],describe(e){const t={name:"Bada"},r=H.getFirstMatch(/dolfin\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/tizen/i],describe(e){const t={name:"Tizen"},r=H.getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.?_?\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/qupzilla/i],describe(e){const t={name:"QupZilla"},r=H.getFirstMatch(/(?:qupzilla)[\s/](\d+(\.?_?\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/firefox|iceweasel|fxios/i],describe(e){const t={name:"Firefox"},r=H.getFirstMatch(/(?:firefox|iceweasel|fxios)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/electron/i],describe(e){const t={name:"Electron"},r=H.getFirstMatch(/(?:electron)\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/MiuiBrowser/i],describe(e){const t={name:"Miui"},r=H.getFirstMatch(/(?:MiuiBrowser)[\s/](\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/chromium/i],describe(e){const t={name:"Chromium"},r=H.getFirstMatch(/(?:chromium)[\s/](\d+(\.?_?\d+)+)/i,e)||H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/chrome|crios|crmo/i],describe(e){const t={name:"Chrome"},r=H.getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/GSA/i],describe(e){const t={name:"Google Search"},r=H.getFirstMatch(/(?:GSA)\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test(e){const t=!e.test(/like android/i),r=e.test(/android/i);return t&&r},describe(e){const t={name:"Android Browser"},r=H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/playstation 4/i],describe(e){const t={name:"PlayStation 4"},r=H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/safari|applewebkit/i],describe(e){const t={name:"Safari"},r=H.getFirstMatch(Ve,e);return r&&(t.version=r),t}},{test:[/.*/i],describe(e){const t=/^(.*)\/(.*) /,r=/^(.*)\/(.*)[ \t]\((.*)/,s=e.search("\\(")!==-1?r:t;return{name:H.getFirstMatch(s,e),version:H.getSecondMatch(s,e)}}}],_x=[{test:[/Roku\/DVP/],describe(e){const t=H.getFirstMatch(/Roku\/DVP-(\d+\.\d+)/i,e);return{name:mt.Roku,version:t}}},{test:[/windows phone/i],describe(e){const t=H.getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i,e);return{name:mt.WindowsPhone,version:t}}},{test:[/windows /i],describe(e){const t=H.getFirstMatch(/Windows ((NT|XP)( \d\d?.\d)?)/i,e),r=H.getWindowsVersionName(t);return{name:mt.Windows,version:t,versionName:r}}},{test:[/Macintosh(.*?) FxiOS(.*?)\//],describe(e){const t={name:mt.iOS},r=H.getSecondMatch(/(Version\/)(\d[\d.]+)/,e);return r&&(t.version=r),t}},{test:[/macintosh/i],describe(e){const t=H.getFirstMatch(/mac os x (\d+(\.?_?\d+)+)/i,e).replace(/[_\s]/g,"."),r=H.getMacOSVersionName(t),n={name:mt.MacOS,version:t};return r&&(n.versionName=r),n}},{test:[/(ipod|iphone|ipad)/i],describe(e){const t=H.getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i,e).replace(/[_\s]/g,".");return{name:mt.iOS,version:t}}},{test(e){const t=!e.test(/like android/i),r=e.test(/android/i);return t&&r},describe(e){const t=H.getFirstMatch(/android[\s/-](\d+(\.\d+)*)/i,e),r=H.getAndroidVersionName(t),n={name:mt.Android,version:t};return r&&(n.versionName=r),n}},{test:[/(web|hpw)[o0]s/i],describe(e){const t=H.getFirstMatch(/(?:web|hpw)[o0]s\/(\d+(\.\d+)*)/i,e),r={name:mt.WebOS};return t&&t.length&&(r.version=t),r}},{test:[/blackberry|\bbb\d+/i,/rim\stablet/i],describe(e){const t=H.getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i,e)||H.getFirstMatch(/blackberry\d+\/(\d+([_\s]\d+)*)/i,e)||H.getFirstMatch(/\bbb(\d+)/i,e);return{name:mt.BlackBerry,version:t}}},{test:[/bada/i],describe(e){const t=H.getFirstMatch(/bada\/(\d+(\.\d+)*)/i,e);return{name:mt.Bada,version:t}}},{test:[/tizen/i],describe(e){const t=H.getFirstMatch(/tizen[/\s](\d+(\.\d+)*)/i,e);return{name:mt.Tizen,version:t}}},{test:[/linux/i],describe(){return{name:mt.Linux}}},{test:[/CrOS/],describe(){return{name:mt.ChromeOS}}},{test:[/PlayStation 4/],describe(e){const t=H.getFirstMatch(/PlayStation 4[/\s](\d+(\.\d+)*)/i,e);return{name:mt.PlayStation4,version:t}}}],bx=[{test:[/googlebot/i],describe(){return{type:"bot",vendor:"Google"}}},{test:[/huawei/i],describe(e){const t=H.getFirstMatch(/(can-l01)/i,e)&&"Nova",r={type:et.mobile,vendor:"Huawei"};return t&&(r.model=t),r}},{test:[/nexus\s*(?:7|8|9|10).*/i],describe(){return{type:et.tablet,vendor:"Nexus"}}},{test:[/ipad/i],describe(){return{type:et.tablet,vendor:"Apple",model:"iPad"}}},{test:[/Macintosh(.*?) FxiOS(.*?)\//],describe(){return{type:et.tablet,vendor:"Apple",model:"iPad"}}},{test:[/kftt build/i],describe(){return{type:et.tablet,vendor:"Amazon",model:"Kindle Fire HD 7"}}},{test:[/silk/i],describe(){return{type:et.tablet,vendor:"Amazon"}}},{test:[/tablet(?! pc)/i],describe(){return{type:et.tablet}}},{test(e){const t=e.test(/ipod|iphone/i),r=e.test(/like (ipod|iphone)/i);return t&&!r},describe(e){const t=H.getFirstMatch(/(ipod|iphone)/i,e);return{type:et.mobile,vendor:"Apple",model:t}}},{test:[/nexus\s*[0-6].*/i,/galaxy nexus/i],describe(){return{type:et.mobile,vendor:"Nexus"}}},{test:[/[^-]mobi/i],describe(){return{type:et.mobile}}},{test(e){return e.getBrowserName(!0)==="blackberry"},describe(){return{type:et.mobile,vendor:"BlackBerry"}}},{test(e){return e.getBrowserName(!0)==="bada"},describe(){return{type:et.mobile}}},{test(e){return e.getBrowserName()==="windows phone"},describe(){return{type:et.mobile,vendor:"Microsoft"}}},{test(e){const t=Number(String(e.getOSVersion()).split(".")[0]);return e.getOSName(!0)==="android"&&t>=3},describe(){return{type:et.tablet}}},{test(e){return e.getOSName(!0)==="android"},describe(){return{type:et.mobile}}},{test(e){return e.getOSName(!0)==="macos"},describe(){return{type:et.desktop,vendor:"Apple"}}},{test(e){return e.getOSName(!0)==="windows"},describe(){return{type:et.desktop}}},{test(e){return e.getOSName(!0)==="linux"},describe(){return{type:et.desktop}}},{test(e){return e.getOSName(!0)==="playstation 4"},describe(){return{type:et.tv}}},{test(e){return e.getOSName(!0)==="roku"},describe(){return{type:et.tv}}}],yx=[{test(e){return e.getBrowserName(!0)==="microsoft edge"},describe(e){if(/\sedg\//i.test(e))return{name:Sr.Blink};const r=H.getFirstMatch(/edge\/(\d+(\.?_?\d+)+)/i,e);return{name:Sr.EdgeHTML,version:r}}},{test:[/trident/i],describe(e){const t={name:Sr.Trident},r=H.getFirstMatch(/trident\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test(e){return e.test(/presto/i)},describe(e){const t={name:Sr.Presto},r=H.getFirstMatch(/presto\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test(e){const t=e.test(/gecko/i),r=e.test(/like gecko/i);return t&&!r},describe(e){const t={name:Sr.Gecko},r=H.getFirstMatch(/gecko\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}},{test:[/(apple)?webkit\/537\.36/i],describe(){return{name:Sr.Blink}}},{test:[/(apple)?webkit/i],describe(e){const t={name:Sr.WebKit},r=H.getFirstMatch(/webkit\/(\d+(\.?_?\d+)+)/i,e);return r&&(t.version=r),t}}];class Xf{constructor(t,r=!1){if(t==null||t==="")throw new Error("UserAgent parameter can't be empty");this._ua=t,this.parsedResult={},r!==!0&&this.parse()}getUA(){return this._ua}test(t){return t.test(this._ua)}parseBrowser(){this.parsedResult.browser={};const t=H.find(gx,r=>{if(typeof r.test=="function")return r.test(this);if(r.test instanceof Array)return r.test.some(n=>this.test(n));throw new Error("Browser's test function is not valid")});return t&&(this.parsedResult.browser=t.describe(this.getUA())),this.parsedResult.browser}getBrowser(){return this.parsedResult.browser?this.parsedResult.browser:this.parseBrowser()}getBrowserName(t){return t?String(this.getBrowser().name).toLowerCase()||"":this.getBrowser().name||""}getBrowserVersion(){return this.getBrowser().version}getOS(){return this.parsedResult.os?this.parsedResult.os:this.parseOS()}parseOS(){this.parsedResult.os={};const t=H.find(_x,r=>{if(typeof r.test=="function")return r.test(this);if(r.test instanceof Array)return r.test.some(n=>this.test(n));throw new Error("Browser's test function is not valid")});return t&&(this.parsedResult.os=t.describe(this.getUA())),this.parsedResult.os}getOSName(t){const{name:r}=this.getOS();return t?String(r).toLowerCase()||"":r||""}getOSVersion(){return this.getOS().version}getPlatform(){return this.parsedResult.platform?this.parsedResult.platform:this.parsePlatform()}getPlatformType(t=!1){const{type:r}=this.getPlatform();return t?String(r).toLowerCase()||"":r||""}parsePlatform(){this.parsedResult.platform={};const t=H.find(bx,r=>{if(typeof r.test=="function")return r.test(this);if(r.test instanceof Array)return r.test.some(n=>this.test(n));throw new Error("Browser's test function is not valid")});return t&&(this.parsedResult.platform=t.describe(this.getUA())),this.parsedResult.platform}getEngine(){return this.parsedResult.engine?this.parsedResult.engine:this.parseEngine()}getEngineName(t){return t?String(this.getEngine().name).toLowerCase()||"":this.getEngine().name||""}parseEngine(){this.parsedResult.engine={};const t=H.find(yx,r=>{if(typeof r.test=="function")return r.test(this);if(r.test instanceof Array)return r.test.some(n=>this.test(n));throw new Error("Browser's test function is not valid")});return t&&(this.parsedResult.engine=t.describe(this.getUA())),this.parsedResult.engine}parse(){return this.parseBrowser(),this.parseOS(),this.parsePlatform(),this.parseEngine(),this}getResult(){return H.assign({},this.parsedResult)}satisfies(t){const r={};let n=0;const s={};let i=0;if(Object.keys(t).forEach(o=>{const u=t[o];typeof u=="string"?(s[o]=u,i+=1):typeof u=="object"&&(r[o]=u,n+=1)}),n>0){const o=Object.keys(r),u=H.find(o,c=>this.isOS(c));if(u){const c=this.satisfies(r[u]);if(c!==void 0)return c}const l=H.find(o,c=>this.isPlatform(c));if(l){const c=this.satisfies(r[l]);if(c!==void 0)return c}}if(i>0){const o=Object.keys(s),u=H.find(o,l=>this.isBrowser(l,!0));if(u!==void 0)return this.compareVersion(s[u])}}isBrowser(t,r=!1){const n=this.getBrowserName().toLowerCase();let s=t.toLowerCase();const i=H.getBrowserTypeByAlias(s);return r&&i&&(s=i.toLowerCase()),s===n}compareVersion(t){let r=[0],n=t,s=!1;const i=this.getBrowserVersion();if(typeof i=="string")return t[0]===">"||t[0]==="<"?(n=t.substr(1),t[1]==="="?(s=!0,n=t.substr(2)):r=[],t[0]===">"?r.push(1):r.push(-1)):t[0]==="="?n=t.substr(1):t[0]==="~"&&(s=!0,n=t.substr(1)),r.indexOf(H.compareVersions(i,n,s))>-1}isOS(t){return this.getOSName(!0)===String(t).toLowerCase()}isPlatform(t){return this.getPlatformType(!0)===String(t).toLowerCase()}isEngine(t){return this.getEngineName(!0)===String(t).toLowerCase()}is(t,r=!1){return this.isBrowser(t,r)||this.isOS(t)||this.isPlatform(t)}some(t=[]){return t.some(r=>this.is(r))}}/*!
 * Bowser - a browser detector
 * https://github.com/lancedikson/bowser
 * MIT License | (c) Dustin Diaz 2012-2015
 * MIT License | (c) Denis Demchenko 2015-2019
 */class wx{static getParser(t,r=!1){if(typeof t!="string")throw new Error("UserAgent should be a string");return new Xf(t,r)}static parse(t){return new Xf(t).getResult()}static get BROWSER_MAP(){return ay}static get ENGINE_MAP(){return Sr}static get OS_MAP(){return mt}static get PLATFORMS_MAP(){return et}}const vx={key:0,style:{color:"red"}},$x={key:1,class:"spinner"},xx={__name:"HomeView",setup(e){const t=or(null),r=or(null),n=or(null),s=or(null),i=or(null),a=or(null),o=or(!1),u=or(""),l=new Worker(new URL("/assets/inferenceWorker-CaHSTqq2.js",import.meta.url),{type:"module"});l.onmessage=b=>{const{type:x,data:w}=b.data;x==="inferenceComplete"?(t.value=`${w.inferenceTime.toFixed(2)} ms`,o.value=!1,console.log("Inference results:",w.results),_(w.results,w.images,w.imgWidth,w.imgHeight)):x==="sessionCreated"&&(r.value=`${w.sessionTime.toFixed(2)} ms`,o.value=!1,console.log("Session created in:",r.value),m())};function c(){const b=wx.getParser(window.navigator.userAgent);a.value={name:b.getBrowserName(),version:b.getBrowserVersion(),os:b.getOSName(),osVersion:b.getOSVersion()}}async function p(){s.value=await hx(),i.value=await fx(),s.value||(console.warn("WebAssembly threads are not supported. Multi-threading will be disabled."),He.wasm.numThreads=1),i.value||console.warn("WebAssembly SIMD is not supported. Performance may be reduced.")}async function h(){o.value=!0,u.value="Creating session...",l.postMessage({type:"createSession"})}async function m(){o.value=!0,u.value="Inferencing...",l.postMessage({type:"runInference"})}Bh(async()=>{c(),await p(),await h()});function _(b,x,w,y){const k=document.createElement("canvas");k.width=w*2,k.height=y,document.body.appendChild(k);const S=k.getContext("2d");S.drawImage(x[0],0,0,w,y),S.drawImage(x[1],w,0,w,y);for(let I=0;I<Math.min(20,b.matches.dims[0]);I++){const z=I*b.matches.dims[1],O=Number(b.matches.cpuData[z+1]),R=Number(b.matches.cpuData[z+2]),B=Number(b.keypoints.cpuData[O*2]),G=Number(b.keypoints.cpuData[O*2+1]),le=Number(b.keypoints.cpuData[(R+b.keypoints.dims[1])*2])+w,ie=Number(b.keypoints.cpuData[(R+b.keypoints.dims[1])*2+1]);S.strokeStyle="red",S.beginPath(),S.moveTo(B,G),S.lineTo(le,ie),S.stroke()}}return(b,x)=>(Xn(),qs("main",null,[x[1]||(x[1]=im(" Hello World ")),ur("p",null,"Inference Time: "+xr(t.value),1),ur("p",null,"Session Time: "+xr(r.value),1),ur("p",null,"WebAssembly Threads Supported: "+xr(s.value),1),ur("p",null,"WebAssembly SIMD Supported: "+xr(i.value),1),ur("p",null,"Browser Info: "+xr(a.value),1),n.value?(Xn(),qs("p",vx,"Error: "+xr(n.value),1)):Wl("",!0),o.value?(Xn(),qs("div",$x,[ur("p",null,xr(u.value),1),x[0]||(x[0]=ur("div",{class:"spinner-icon"},null,-1))])):Wl("",!0)]))}},Sx=V$({history:w$("/"),routes:[{path:"/",name:"home",component:xx}]}),oy=Lv(G$);console.log("a change4");oy.use(Sx);oy.mount("#app");
