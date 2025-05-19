var mb=Object.defineProperty;var gb=(e,t,r)=>t in e?mb(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var yl=(e,t,r)=>gb(e,typeof t!="symbol"?t+"":t,r);/**
* @vue/shared v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**//*! #__NO_SIDE_EFFECTS__ */function mo(e){const t=Object.create(null);for(const r of e.split(","))t[r]=1;return r=>r in t}const Fe={},tn=[],Zt=()=>{},_b=()=>!1,Xi=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&(e.charCodeAt(2)>122||e.charCodeAt(2)<97),go=e=>e.startsWith("onUpdate:"),ut=Object.assign,_o=(e,t)=>{const r=e.indexOf(t);r>-1&&e.splice(r,1)},yb=Object.prototype.hasOwnProperty,We=(e,t)=>yb.call(e,t),Ee=Array.isArray,rn=e=>Yi(e)==="[object Map]",Lf=e=>Yi(e)==="[object Set]",Ie=e=>typeof e=="function",et=e=>typeof e=="string",Sr=e=>typeof e=="symbol",je=e=>e!==null&&typeof e=="object",Vf=e=>(je(e)||Ie(e))&&Ie(e.then)&&Ie(e.catch),Hf=Object.prototype.toString,Yi=e=>Hf.call(e),bb=e=>Yi(e).slice(8,-1),Ff=e=>Yi(e)==="[object Object]",yo=e=>et(e)&&e!=="NaN"&&e[0]!=="-"&&""+parseInt(e,10)===e,Mn=mo(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),Ji=e=>{const t=Object.create(null);return r=>t[r]||(t[r]=e(r))},wb=/-(\w)/g,vr=Ji(e=>e.replace(wb,(t,r)=>r?r.toUpperCase():"")),$b=/\B([A-Z])/g,Hr=Ji(e=>e.replace($b,"-$1").toLowerCase()),Gf=Ji(e=>e.charAt(0).toUpperCase()+e.slice(1)),Ss=Ji(e=>e?`on${Gf(e)}`:""),$r=(e,t)=>!Object.is(e,t),ks=(e,...t)=>{for(let r=0;r<e.length;r++)e[r](...t)},jf=(e,t,r,n=!1)=>{Object.defineProperty(e,t,{configurable:!0,enumerable:!1,writable:n,value:r})},vb=e=>{const t=parseFloat(e);return isNaN(t)?e:t};let bl;const es=()=>bl||(bl=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function bo(e){if(Ee(e)){const t={};for(let r=0;r<e.length;r++){const n=e[r],s=et(n)?Tb(n):bo(n);if(s)for(const i in s)t[i]=s[i]}return t}else if(et(e)||je(e))return e}const xb=/;(?![^(]*\))/g,Sb=/:([^]+)/,kb=/\/\*[^]*?\*\//g;function Tb(e){const t={};return e.replace(kb,"").split(xb).forEach(r=>{if(r){const n=r.split(Sb);n.length>1&&(t[n[0].trim()]=n[1].trim())}}),t}function wo(e){let t="";if(et(e))t=e;else if(Ee(e))for(let r=0;r<e.length;r++){const n=wo(e[r]);n&&(t+=n+" ")}else if(je(e))for(const r in e)e[r]&&(t+=r+" ");return t.trim()}const Eb="itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",Ib=mo(Eb);function Kf(e){return!!e||e===""}const Zf=e=>!!(e&&e.__v_isRef===!0),Qf=e=>et(e)?e:e==null?"":Ee(e)||je(e)&&(e.toString===Hf||!Ie(e.toString))?Zf(e)?Qf(e.value):JSON.stringify(e,Xf,2):String(e),Xf=(e,t)=>Zf(t)?Xf(e,t.value):rn(t)?{[`Map(${t.size})`]:[...t.entries()].reduce((r,[n,s],i)=>(r[Ts(n,i)+" =>"]=s,r),{})}:Lf(t)?{[`Set(${t.size})`]:[...t.values()].map(r=>Ts(r))}:Sr(t)?Ts(t):je(t)&&!Ee(t)&&!Ff(t)?String(t):t,Ts=(e,t="")=>{var r;return Sr(e)?`Symbol(${(r=e.description)!=null?r:t})`:e};/**
* @vue/reactivity v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let wt;class Cb{constructor(t=!1){this.detached=t,this._active=!0,this.effects=[],this.cleanups=[],this._isPaused=!1,this.parent=wt,!t&&wt&&(this.index=(wt.scopes||(wt.scopes=[])).push(this)-1)}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let t,r;if(this.scopes)for(t=0,r=this.scopes.length;t<r;t++)this.scopes[t].pause();for(t=0,r=this.effects.length;t<r;t++)this.effects[t].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let t,r;if(this.scopes)for(t=0,r=this.scopes.length;t<r;t++)this.scopes[t].resume();for(t=0,r=this.effects.length;t<r;t++)this.effects[t].resume()}}run(t){if(this._active){const r=wt;try{return wt=this,t()}finally{wt=r}}}on(){wt=this}off(){wt=this.parent}stop(t){if(this._active){this._active=!1;let r,n;for(r=0,n=this.effects.length;r<n;r++)this.effects[r].stop();for(this.effects.length=0,r=0,n=this.cleanups.length;r<n;r++)this.cleanups[r]();if(this.cleanups.length=0,this.scopes){for(r=0,n=this.scopes.length;r<n;r++)this.scopes[r].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!t){const s=this.parent.scopes.pop();s&&s!==this&&(this.parent.scopes[this.index]=s,s.index=this.index)}this.parent=void 0}}}function zb(){return wt}let He;const Es=new WeakSet;class Yf{constructor(t){this.fn=t,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,wt&&wt.active&&wt.effects.push(this)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,Es.has(this)&&(Es.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||eh(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,wl(this),th(this);const t=He,r=Nt;He=this,Nt=!0;try{return this.fn()}finally{rh(this),He=t,Nt=r,this.flags&=-3}}stop(){if(this.flags&1){for(let t=this.deps;t;t=t.nextDep)xo(t);this.deps=this.depsTail=void 0,wl(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?Es.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){Da(this)&&this.run()}get dirty(){return Da(this)}}let Jf=0,Nn,Pn;function eh(e,t=!1){if(e.flags|=8,t){e.next=Pn,Pn=e;return}e.next=Nn,Nn=e}function $o(){Jf++}function vo(){if(--Jf>0)return;if(Pn){let t=Pn;for(Pn=void 0;t;){const r=t.next;t.next=void 0,t.flags&=-9,t=r}}let e;for(;Nn;){let t=Nn;for(Nn=void 0;t;){const r=t.next;if(t.next=void 0,t.flags&=-9,t.flags&1)try{t.trigger()}catch(n){e||(e=n)}t=r}}if(e)throw e}function th(e){for(let t=e.deps;t;t=t.nextDep)t.version=-1,t.prevActiveLink=t.dep.activeLink,t.dep.activeLink=t}function rh(e){let t,r=e.depsTail,n=r;for(;n;){const s=n.prevDep;n.version===-1?(n===r&&(r=s),xo(n),Ob(n)):t=n,n.dep.activeLink=n.prevActiveLink,n.prevActiveLink=void 0,n=s}e.deps=t,e.depsTail=r}function Da(e){for(let t=e.deps;t;t=t.nextDep)if(t.dep.version!==t.version||t.dep.computed&&(nh(t.dep.computed)||t.dep.version!==t.version))return!0;return!!e._dirty}function nh(e){if(e.flags&4&&!(e.flags&16)||(e.flags&=-17,e.globalVersion===Fn))return;e.globalVersion=Fn;const t=e.dep;if(e.flags|=2,t.version>0&&!e.isSSR&&e.deps&&!Da(e)){e.flags&=-3;return}const r=He,n=Nt;He=e,Nt=!0;try{th(e);const s=e.fn(e._value);(t.version===0||$r(s,e._value))&&(e._value=s,t.version++)}catch(s){throw t.version++,s}finally{He=r,Nt=n,rh(e),e.flags&=-3}}function xo(e,t=!1){const{dep:r,prevSub:n,nextSub:s}=e;if(n&&(n.nextSub=s,e.prevSub=void 0),s&&(s.prevSub=n,e.nextSub=void 0),r.subs===e&&(r.subs=n,!n&&r.computed)){r.computed.flags&=-5;for(let i=r.computed.deps;i;i=i.nextDep)xo(i,!0)}!t&&!--r.sc&&r.map&&r.map.delete(r.key)}function Ob(e){const{prevDep:t,nextDep:r}=e;t&&(t.nextDep=r,e.prevDep=void 0),r&&(r.prevDep=t,e.nextDep=void 0)}let Nt=!0;const ih=[];function kr(){ih.push(Nt),Nt=!1}function Tr(){const e=ih.pop();Nt=e===void 0?!0:e}function wl(e){const{cleanup:t}=e;if(e.cleanup=void 0,t){const r=He;He=void 0;try{t()}finally{He=r}}}let Fn=0;class Ab{constructor(t,r){this.sub=t,this.dep=r,this.version=r.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}}class So{constructor(t){this.computed=t,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0}track(t){if(!He||!Nt||He===this.computed)return;let r=this.activeLink;if(r===void 0||r.sub!==He)r=this.activeLink=new Ab(He,this),He.deps?(r.prevDep=He.depsTail,He.depsTail.nextDep=r,He.depsTail=r):He.deps=He.depsTail=r,sh(r);else if(r.version===-1&&(r.version=this.version,r.nextDep)){const n=r.nextDep;n.prevDep=r.prevDep,r.prevDep&&(r.prevDep.nextDep=n),r.prevDep=He.depsTail,r.nextDep=void 0,He.depsTail.nextDep=r,He.depsTail=r,He.deps===r&&(He.deps=n)}return r}trigger(t){this.version++,Fn++,this.notify(t)}notify(t){$o();try{for(let r=this.subs;r;r=r.prevSub)r.sub.notify()&&r.sub.dep.notify()}finally{vo()}}}function sh(e){if(e.dep.sc++,e.sub.flags&4){const t=e.dep.computed;if(t&&!e.dep.subs){t.flags|=20;for(let n=t.deps;n;n=n.nextDep)sh(n)}const r=e.dep.subs;r!==e&&(e.prevSub=r,r&&(r.nextSub=e)),e.dep.subs=e}}const Ua=new WeakMap,Dr=Symbol(""),Wa=Symbol(""),Gn=Symbol("");function at(e,t,r){if(Nt&&He){let n=Ua.get(e);n||Ua.set(e,n=new Map);let s=n.get(r);s||(n.set(r,s=new So),s.map=n,s.key=r),s.track()}}function sr(e,t,r,n,s,i){const a=Ua.get(e);if(!a){Fn++;return}const o=u=>{u&&u.trigger()};if($o(),t==="clear")a.forEach(o);else{const u=Ee(e),l=u&&yo(r);if(u&&r==="length"){const c=Number(n);a.forEach((p,h)=>{(h==="length"||h===Gn||!Sr(h)&&h>=c)&&o(p)})}else switch((r!==void 0||a.has(void 0))&&o(a.get(r)),l&&o(a.get(Gn)),t){case"add":u?l&&o(a.get("length")):(o(a.get(Dr)),rn(e)&&o(a.get(Wa)));break;case"delete":u||(o(a.get(Dr)),rn(e)&&o(a.get(Wa)));break;case"set":rn(e)&&o(a.get(Dr));break}}vo()}function Zr(e){const t=Ue(e);return t===e?t:(at(t,"iterate",Gn),Pt(e)?t:t.map(pt))}function ko(e){return at(e=Ue(e),"iterate",Gn),e}const Rb={__proto__:null,[Symbol.iterator](){return Is(this,Symbol.iterator,pt)},concat(...e){return Zr(this).concat(...e.map(t=>Ee(t)?Zr(t):t))},entries(){return Is(this,"entries",e=>(e[1]=pt(e[1]),e))},every(e,t){return er(this,"every",e,t,void 0,arguments)},filter(e,t){return er(this,"filter",e,t,r=>r.map(pt),arguments)},find(e,t){return er(this,"find",e,t,pt,arguments)},findIndex(e,t){return er(this,"findIndex",e,t,void 0,arguments)},findLast(e,t){return er(this,"findLast",e,t,pt,arguments)},findLastIndex(e,t){return er(this,"findLastIndex",e,t,void 0,arguments)},forEach(e,t){return er(this,"forEach",e,t,void 0,arguments)},includes(...e){return Cs(this,"includes",e)},indexOf(...e){return Cs(this,"indexOf",e)},join(e){return Zr(this).join(e)},lastIndexOf(...e){return Cs(this,"lastIndexOf",e)},map(e,t){return er(this,"map",e,t,void 0,arguments)},pop(){return gn(this,"pop")},push(...e){return gn(this,"push",e)},reduce(e,...t){return $l(this,"reduce",e,t)},reduceRight(e,...t){return $l(this,"reduceRight",e,t)},shift(){return gn(this,"shift")},some(e,t){return er(this,"some",e,t,void 0,arguments)},splice(...e){return gn(this,"splice",e)},toReversed(){return Zr(this).toReversed()},toSorted(e){return Zr(this).toSorted(e)},toSpliced(...e){return Zr(this).toSpliced(...e)},unshift(...e){return gn(this,"unshift",e)},values(){return Is(this,"values",pt)}};function Is(e,t,r){const n=ko(e),s=n[t]();return n!==e&&!Pt(e)&&(s._next=s.next,s.next=()=>{const i=s._next();return i.value&&(i.value=r(i.value)),i}),s}const Bb=Array.prototype;function er(e,t,r,n,s,i){const a=ko(e),o=a!==e&&!Pt(e),u=a[t];if(u!==Bb[t]){const p=u.apply(e,i);return o?pt(p):p}let l=r;a!==e&&(o?l=function(p,h){return r.call(this,pt(p),h,e)}:r.length>2&&(l=function(p,h){return r.call(this,p,h,e)}));const c=u.call(a,l,n);return o&&s?s(c):c}function $l(e,t,r,n){const s=ko(e);let i=r;return s!==e&&(Pt(e)?r.length>3&&(i=function(a,o,u){return r.call(this,a,o,u,e)}):i=function(a,o,u){return r.call(this,a,pt(o),u,e)}),s[t](i,...n)}function Cs(e,t,r){const n=Ue(e);at(n,"iterate",Gn);const s=n[t](...r);return(s===-1||s===!1)&&Io(r[0])?(r[0]=Ue(r[0]),n[t](...r)):s}function gn(e,t,r=[]){kr(),$o();const n=Ue(e)[t].apply(e,r);return vo(),Tr(),n}const Mb=mo("__proto__,__v_isRef,__isVue"),ah=new Set(Object.getOwnPropertyNames(Symbol).filter(e=>e!=="arguments"&&e!=="caller").map(e=>Symbol[e]).filter(Sr));function Nb(e){Sr(e)||(e=String(e));const t=Ue(this);return at(t,"has",e),t.hasOwnProperty(e)}class oh{constructor(t=!1,r=!1){this._isReadonly=t,this._isShallow=r}get(t,r,n){if(r==="__v_skip")return t.__v_skip;const s=this._isReadonly,i=this._isShallow;if(r==="__v_isReactive")return!s;if(r==="__v_isReadonly")return s;if(r==="__v_isShallow")return i;if(r==="__v_raw")return n===(s?i?Gb:ch:i?dh:lh).get(t)||Object.getPrototypeOf(t)===Object.getPrototypeOf(n)?t:void 0;const a=Ee(t);if(!s){let u;if(a&&(u=Rb[r]))return u;if(r==="hasOwnProperty")return Nb}const o=Reflect.get(t,r,ot(t)?t:n);return(Sr(r)?ah.has(r):Mb(r))||(s||at(t,"get",r),i)?o:ot(o)?a&&yo(r)?o:o.value:je(o)?s?fh(o):ts(o):o}}class uh extends oh{constructor(t=!1){super(!1,t)}set(t,r,n,s){let i=t[r];if(!this._isShallow){const u=Wr(i);if(!Pt(n)&&!Wr(n)&&(i=Ue(i),n=Ue(n)),!Ee(t)&&ot(i)&&!ot(n))return u?!1:(i.value=n,!0)}const a=Ee(t)&&yo(r)?Number(r)<t.length:We(t,r),o=Reflect.set(t,r,n,ot(t)?t:s);return t===Ue(s)&&(a?$r(n,i)&&sr(t,"set",r,n):sr(t,"add",r,n)),o}deleteProperty(t,r){const n=We(t,r);t[r];const s=Reflect.deleteProperty(t,r);return s&&n&&sr(t,"delete",r,void 0),s}has(t,r){const n=Reflect.has(t,r);return(!Sr(r)||!ah.has(r))&&at(t,"has",r),n}ownKeys(t){return at(t,"iterate",Ee(t)?"length":Dr),Reflect.ownKeys(t)}}class Pb extends oh{constructor(t=!1){super(!0,t)}set(t,r){return!0}deleteProperty(t,r){return!0}}const Db=new uh,Ub=new Pb,Wb=new uh(!0);const qa=e=>e,hi=e=>Reflect.getPrototypeOf(e);function qb(e,t,r){return function(...n){const s=this.__v_raw,i=Ue(s),a=rn(i),o=e==="entries"||e===Symbol.iterator&&a,u=e==="keys"&&a,l=s[e](...n),c=r?qa:t?La:pt;return!t&&at(i,"iterate",u?Wa:Dr),{next(){const{value:p,done:h}=l.next();return h?{value:p,done:h}:{value:o?[c(p[0]),c(p[1])]:c(p),done:h}},[Symbol.iterator](){return this}}}}function mi(e){return function(...t){return e==="delete"?!1:e==="clear"?void 0:this}}function Lb(e,t){const r={get(s){const i=this.__v_raw,a=Ue(i),o=Ue(s);e||($r(s,o)&&at(a,"get",s),at(a,"get",o));const{has:u}=hi(a),l=t?qa:e?La:pt;if(u.call(a,s))return l(i.get(s));if(u.call(a,o))return l(i.get(o));i!==a&&i.get(s)},get size(){const s=this.__v_raw;return!e&&at(Ue(s),"iterate",Dr),Reflect.get(s,"size",s)},has(s){const i=this.__v_raw,a=Ue(i),o=Ue(s);return e||($r(s,o)&&at(a,"has",s),at(a,"has",o)),s===o?i.has(s):i.has(s)||i.has(o)},forEach(s,i){const a=this,o=a.__v_raw,u=Ue(o),l=t?qa:e?La:pt;return!e&&at(u,"iterate",Dr),o.forEach((c,p)=>s.call(i,l(c),l(p),a))}};return ut(r,e?{add:mi("add"),set:mi("set"),delete:mi("delete"),clear:mi("clear")}:{add(s){!t&&!Pt(s)&&!Wr(s)&&(s=Ue(s));const i=Ue(this);return hi(i).has.call(i,s)||(i.add(s),sr(i,"add",s,s)),this},set(s,i){!t&&!Pt(i)&&!Wr(i)&&(i=Ue(i));const a=Ue(this),{has:o,get:u}=hi(a);let l=o.call(a,s);l||(s=Ue(s),l=o.call(a,s));const c=u.call(a,s);return a.set(s,i),l?$r(i,c)&&sr(a,"set",s,i):sr(a,"add",s,i),this},delete(s){const i=Ue(this),{has:a,get:o}=hi(i);let u=a.call(i,s);u||(s=Ue(s),u=a.call(i,s)),o&&o.call(i,s);const l=i.delete(s);return u&&sr(i,"delete",s,void 0),l},clear(){const s=Ue(this),i=s.size!==0,a=s.clear();return i&&sr(s,"clear",void 0,void 0),a}}),["keys","values","entries",Symbol.iterator].forEach(s=>{r[s]=qb(s,e,t)}),r}function To(e,t){const r=Lb(e,t);return(n,s,i)=>s==="__v_isReactive"?!e:s==="__v_isReadonly"?e:s==="__v_raw"?n:Reflect.get(We(r,s)&&s in n?r:n,s,i)}const Vb={get:To(!1,!1)},Hb={get:To(!1,!0)},Fb={get:To(!0,!1)};const lh=new WeakMap,dh=new WeakMap,ch=new WeakMap,Gb=new WeakMap;function jb(e){switch(e){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function Kb(e){return e.__v_skip||!Object.isExtensible(e)?0:jb(bb(e))}function ts(e){return Wr(e)?e:Eo(e,!1,Db,Vb,lh)}function ph(e){return Eo(e,!1,Wb,Hb,dh)}function fh(e){return Eo(e,!0,Ub,Fb,ch)}function Eo(e,t,r,n,s){if(!je(e)||e.__v_raw&&!(t&&e.__v_isReactive))return e;const i=s.get(e);if(i)return i;const a=Kb(e);if(a===0)return e;const o=new Proxy(e,a===2?n:r);return s.set(e,o),o}function Dn(e){return Wr(e)?Dn(e.__v_raw):!!(e&&e.__v_isReactive)}function Wr(e){return!!(e&&e.__v_isReadonly)}function Pt(e){return!!(e&&e.__v_isShallow)}function Io(e){return e?!!e.__v_raw:!1}function Ue(e){const t=e&&e.__v_raw;return t?Ue(t):e}function Zb(e){return!We(e,"__v_skip")&&Object.isExtensible(e)&&jf(e,"__v_skip",!0),e}const pt=e=>je(e)?ts(e):e,La=e=>je(e)?fh(e):e;function ot(e){return e?e.__v_isRef===!0:!1}function hh(e){return mh(e,!1)}function Qb(e){return mh(e,!0)}function mh(e,t){return ot(e)?e:new Xb(e,t)}class Xb{constructor(t,r){this.dep=new So,this.__v_isRef=!0,this.__v_isShallow=!1,this._rawValue=r?t:Ue(t),this._value=r?t:pt(t),this.__v_isShallow=r}get value(){return this.dep.track(),this._value}set value(t){const r=this._rawValue,n=this.__v_isShallow||Pt(t)||Wr(t);t=n?t:Ue(t),$r(t,r)&&(this._rawValue=t,this._value=n?t:pt(t),this.dep.trigger())}}function Ur(e){return ot(e)?e.value:e}const Yb={get:(e,t,r)=>t==="__v_raw"?e:Ur(Reflect.get(e,t,r)),set:(e,t,r,n)=>{const s=e[t];return ot(s)&&!ot(r)?(s.value=r,!0):Reflect.set(e,t,r,n)}};function gh(e){return Dn(e)?e:new Proxy(e,Yb)}class Jb{constructor(t,r,n){this.fn=t,this.setter=r,this._value=void 0,this.dep=new So(this),this.__v_isRef=!0,this.deps=void 0,this.depsTail=void 0,this.flags=16,this.globalVersion=Fn-1,this.next=void 0,this.effect=this,this.__v_isReadonly=!r,this.isSSR=n}notify(){if(this.flags|=16,!(this.flags&8)&&He!==this)return eh(this,!0),!0}get value(){const t=this.dep.track();return nh(this),t&&(t.version=this.dep.version),this._value}set value(t){this.setter&&this.setter(t)}}function ew(e,t,r=!1){let n,s;return Ie(e)?n=e:(n=e.get,s=e.set),new Jb(n,s,r)}const gi={},Ni=new WeakMap;let Br;function tw(e,t=!1,r=Br){if(r){let n=Ni.get(r);n||Ni.set(r,n=[]),n.push(e)}}function rw(e,t,r=Fe){const{immediate:n,deep:s,once:i,scheduler:a,augmentJob:o,call:u}=r,l=S=>s?S:Pt(S)||s===!1||s===0?wr(S,1):wr(S);let c,p,h,m,g=!1,y=!1;if(ot(e)?(p=()=>e.value,g=Pt(e)):Dn(e)?(p=()=>l(e),g=!0):Ee(e)?(y=!0,g=e.some(S=>Dn(S)||Pt(S)),p=()=>e.map(S=>{if(ot(S))return S.value;if(Dn(S))return l(S);if(Ie(S))return u?u(S,2):S()})):Ie(e)?t?p=u?()=>u(e,2):e:p=()=>{if(h){kr();try{h()}finally{Tr()}}const S=Br;Br=c;try{return u?u(e,3,[m]):e(m)}finally{Br=S}}:p=Zt,t&&s){const S=p,I=s===!0?1/0:s;p=()=>wr(S(),I)}const x=zb(),w=()=>{c.stop(),x&&x.active&&_o(x.effects,c)};if(i&&t){const S=t;t=(...I)=>{S(...I),w()}}let b=y?new Array(e.length).fill(gi):gi;const k=S=>{if(!(!(c.flags&1)||!c.dirty&&!S))if(t){const I=c.run();if(s||g||(y?I.some((z,O)=>$r(z,b[O])):$r(I,b))){h&&h();const z=Br;Br=c;try{const O=[I,b===gi?void 0:y&&b[0]===gi?[]:b,m];u?u(t,3,O):t(...O),b=I}finally{Br=z}}}else c.run()};return o&&o(k),c=new Yf(p),c.scheduler=a?()=>a(k,!1):k,m=S=>tw(S,!1,c),h=c.onStop=()=>{const S=Ni.get(c);if(S){if(u)u(S,4);else for(const I of S)I();Ni.delete(c)}},t?n?k(!0):b=c.run():a?a(k.bind(null,!0),!0):c.run(),w.pause=c.pause.bind(c),w.resume=c.resume.bind(c),w.stop=w,w}function wr(e,t=1/0,r){if(t<=0||!je(e)||e.__v_skip||(r=r||new Set,r.has(e)))return e;if(r.add(e),t--,ot(e))wr(e.value,t,r);else if(Ee(e))for(let n=0;n<e.length;n++)wr(e[n],t,r);else if(Lf(e)||rn(e))e.forEach(n=>{wr(n,t,r)});else if(Ff(e)){for(const n in e)wr(e[n],t,r);for(const n of Object.getOwnPropertySymbols(e))Object.prototype.propertyIsEnumerable.call(e,n)&&wr(e[n],t,r)}return e}/**
* @vue/runtime-core v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function ti(e,t,r,n){try{return n?e(...n):e()}catch(s){rs(s,t,r)}}function Qt(e,t,r,n){if(Ie(e)){const s=ti(e,t,r,n);return s&&Vf(s)&&s.catch(i=>{rs(i,t,r)}),s}if(Ee(e)){const s=[];for(let i=0;i<e.length;i++)s.push(Qt(e[i],t,r,n));return s}}function rs(e,t,r,n=!0){const s=t?t.vnode:null,{errorHandler:i,throwUnhandledErrorInProduction:a}=t&&t.appContext.config||Fe;if(t){let o=t.parent;const u=t.proxy,l=`https://vuejs.org/error-reference/#runtime-${r}`;for(;o;){const c=o.ec;if(c){for(let p=0;p<c.length;p++)if(c[p](e,u,l)===!1)return}o=o.parent}if(i){kr(),ti(i,null,10,[e,u,l]),Tr();return}}nw(e,r,s,n,a)}function nw(e,t,r,n=!0,s=!1){if(s)throw e;console.error(e)}const ft=[];let Gt=-1;const nn=[];let _r=null,Xr=0;const _h=Promise.resolve();let Pi=null;function yh(e){const t=Pi||_h;return e?t.then(this?e.bind(this):e):t}function iw(e){let t=Gt+1,r=ft.length;for(;t<r;){const n=t+r>>>1,s=ft[n],i=jn(s);i<e||i===e&&s.flags&2?t=n+1:r=n}return t}function Co(e){if(!(e.flags&1)){const t=jn(e),r=ft[ft.length-1];!r||!(e.flags&2)&&t>=jn(r)?ft.push(e):ft.splice(iw(t),0,e),e.flags|=1,bh()}}function bh(){Pi||(Pi=_h.then($h))}function sw(e){Ee(e)?nn.push(...e):_r&&e.id===-1?_r.splice(Xr+1,0,e):e.flags&1||(nn.push(e),e.flags|=1),bh()}function vl(e,t,r=Gt+1){for(;r<ft.length;r++){const n=ft[r];if(n&&n.flags&2){if(e&&n.id!==e.uid)continue;ft.splice(r,1),r--,n.flags&4&&(n.flags&=-2),n(),n.flags&4||(n.flags&=-2)}}}function wh(e){if(nn.length){const t=[...new Set(nn)].sort((r,n)=>jn(r)-jn(n));if(nn.length=0,_r){_r.push(...t);return}for(_r=t,Xr=0;Xr<_r.length;Xr++){const r=_r[Xr];r.flags&4&&(r.flags&=-2),r.flags&8||r(),r.flags&=-2}_r=null,Xr=0}}const jn=e=>e.id==null?e.flags&2?-1:1/0:e.id;function $h(e){try{for(Gt=0;Gt<ft.length;Gt++){const t=ft[Gt];t&&!(t.flags&8)&&(t.flags&4&&(t.flags&=-2),ti(t,t.i,t.i?15:14),t.flags&4||(t.flags&=-2))}}finally{for(;Gt<ft.length;Gt++){const t=ft[Gt];t&&(t.flags&=-2)}Gt=-1,ft.length=0,wh(),Pi=null,(ft.length||nn.length)&&$h()}}let Kt=null,vh=null;function Di(e){const t=Kt;return Kt=e,vh=e&&e.type.__scopeId||null,t}function aw(e,t=Kt,r){if(!t||e._n)return e;const n=(...s)=>{n._d&&Ol(-1);const i=Di(t);let a;try{a=e(...s)}finally{Di(i),n._d&&Ol(1)}return a};return n._n=!0,n._c=!0,n._d=!0,n}function Ir(e,t,r,n){const s=e.dirs,i=t&&t.dirs;for(let a=0;a<s.length;a++){const o=s[a];i&&(o.oldValue=i[a].value);let u=o.dir[n];u&&(kr(),Qt(u,r,8,[e.el,o,e,t]),Tr())}}const ow=Symbol("_vte"),uw=e=>e.__isTeleport;function zo(e,t){e.shapeFlag&6&&e.component?(e.transition=t,zo(e.component.subTree,t)):e.shapeFlag&128?(e.ssContent.transition=t.clone(e.ssContent),e.ssFallback.transition=t.clone(e.ssFallback)):e.transition=t}/*! #__NO_SIDE_EFFECTS__ */function xh(e,t){return Ie(e)?ut({name:e.name},t,{setup:e}):e}function Sh(e){e.ids=[e.ids[0]+e.ids[2]+++"-",0,0]}function Ui(e,t,r,n,s=!1){if(Ee(e)){e.forEach((g,y)=>Ui(g,t&&(Ee(t)?t[y]:t),r,n,s));return}if(Un(n)&&!s){n.shapeFlag&512&&n.type.__asyncResolved&&n.component.subTree.component&&Ui(e,t,r,n.component.subTree);return}const i=n.shapeFlag&4?Bo(n.component):n.el,a=s?null:i,{i:o,r:u}=e,l=t&&t.r,c=o.refs===Fe?o.refs={}:o.refs,p=o.setupState,h=Ue(p),m=p===Fe?()=>!1:g=>We(h,g);if(l!=null&&l!==u&&(et(l)?(c[l]=null,m(l)&&(p[l]=null)):ot(l)&&(l.value=null)),Ie(u))ti(u,o,12,[a,c]);else{const g=et(u),y=ot(u);if(g||y){const x=()=>{if(e.f){const w=g?m(u)?p[u]:c[u]:u.value;s?Ee(w)&&_o(w,i):Ee(w)?w.includes(i)||w.push(i):g?(c[u]=[i],m(u)&&(p[u]=c[u])):(u.value=[i],e.k&&(c[e.k]=u.value))}else g?(c[u]=a,m(u)&&(p[u]=a)):y&&(u.value=a,e.k&&(c[e.k]=a))};a?(x.id=-1,bt(x,r)):x()}}}es().requestIdleCallback;es().cancelIdleCallback;const Un=e=>!!e.type.__asyncLoader,kh=e=>e.type.__isKeepAlive;function lw(e,t){Th(e,"a",t)}function dw(e,t){Th(e,"da",t)}function Th(e,t,r=ht){const n=e.__wdc||(e.__wdc=()=>{let s=r;for(;s;){if(s.isDeactivated)return;s=s.parent}return e()});if(ns(t,n,r),r){let s=r.parent;for(;s&&s.parent;)kh(s.parent.vnode)&&cw(n,t,r,s),s=s.parent}}function cw(e,t,r,n){const s=ns(t,e,n,!0);Eh(()=>{_o(n[t],s)},r)}function ns(e,t,r=ht,n=!1){if(r){const s=r[e]||(r[e]=[]),i=t.__weh||(t.__weh=(...a)=>{kr();const o=ri(r),u=Qt(t,r,e,a);return o(),Tr(),u});return n?s.unshift(i):s.push(i),i}}const ur=e=>(t,r=ht)=>{(!Qn||e==="sp")&&ns(e,(...n)=>t(...n),r)},pw=ur("bm"),fw=ur("m"),hw=ur("bu"),mw=ur("u"),gw=ur("bum"),Eh=ur("um"),_w=ur("sp"),yw=ur("rtg"),bw=ur("rtc");function ww(e,t=ht){ns("ec",e,t)}const $w=Symbol.for("v-ndc"),Va=e=>e?Qh(e)?Bo(e):Va(e.parent):null,Wn=ut(Object.create(null),{$:e=>e,$el:e=>e.vnode.el,$data:e=>e.data,$props:e=>e.props,$attrs:e=>e.attrs,$slots:e=>e.slots,$refs:e=>e.refs,$parent:e=>Va(e.parent),$root:e=>Va(e.root),$host:e=>e.ce,$emit:e=>e.emit,$options:e=>Ch(e),$forceUpdate:e=>e.f||(e.f=()=>{Co(e.update)}),$nextTick:e=>e.n||(e.n=yh.bind(e.proxy)),$watch:e=>Lw.bind(e)}),zs=(e,t)=>e!==Fe&&!e.__isScriptSetup&&We(e,t),vw={get({_:e},t){if(t==="__v_skip")return!0;const{ctx:r,setupState:n,data:s,props:i,accessCache:a,type:o,appContext:u}=e;let l;if(t[0]!=="$"){const m=a[t];if(m!==void 0)switch(m){case 1:return n[t];case 2:return s[t];case 4:return r[t];case 3:return i[t]}else{if(zs(n,t))return a[t]=1,n[t];if(s!==Fe&&We(s,t))return a[t]=2,s[t];if((l=e.propsOptions[0])&&We(l,t))return a[t]=3,i[t];if(r!==Fe&&We(r,t))return a[t]=4,r[t];Ha&&(a[t]=0)}}const c=Wn[t];let p,h;if(c)return t==="$attrs"&&at(e.attrs,"get",""),c(e);if((p=o.__cssModules)&&(p=p[t]))return p;if(r!==Fe&&We(r,t))return a[t]=4,r[t];if(h=u.config.globalProperties,We(h,t))return h[t]},set({_:e},t,r){const{data:n,setupState:s,ctx:i}=e;return zs(s,t)?(s[t]=r,!0):n!==Fe&&We(n,t)?(n[t]=r,!0):We(e.props,t)||t[0]==="$"&&t.slice(1)in e?!1:(i[t]=r,!0)},has({_:{data:e,setupState:t,accessCache:r,ctx:n,appContext:s,propsOptions:i}},a){let o;return!!r[a]||e!==Fe&&We(e,a)||zs(t,a)||(o=i[0])&&We(o,a)||We(n,a)||We(Wn,a)||We(s.config.globalProperties,a)},defineProperty(e,t,r){return r.get!=null?e._.accessCache[t]=0:We(r,"value")&&this.set(e,t,r.value,null),Reflect.defineProperty(e,t,r)}};function xl(e){return Ee(e)?e.reduce((t,r)=>(t[r]=null,t),{}):e}let Ha=!0;function xw(e){const t=Ch(e),r=e.proxy,n=e.ctx;Ha=!1,t.beforeCreate&&Sl(t.beforeCreate,e,"bc");const{data:s,computed:i,methods:a,watch:o,provide:u,inject:l,created:c,beforeMount:p,mounted:h,beforeUpdate:m,updated:g,activated:y,deactivated:x,beforeDestroy:w,beforeUnmount:b,destroyed:k,unmounted:S,render:I,renderTracked:z,renderTriggered:O,errorCaptured:R,serverPrefetch:N,expose:G,inheritAttrs:ue,components:ne,directives:se,filters:Se}=t;if(l&&Sw(l,n,null),a)for(const ie in a){const K=a[ie];Ie(K)&&(n[ie]=K.bind(r))}if(s){const ie=s.call(r,r);je(ie)&&(e.data=ts(ie))}if(Ha=!0,i)for(const ie in i){const K=i[ie],de=Ie(K)?K.bind(r,r):Ie(K.get)?K.get.bind(r,r):Zt,Re=!Ie(K)&&Ie(K.set)?K.set.bind(r):Zt,P=Bt({get:de,set:Re});Object.defineProperty(n,ie,{enumerable:!0,configurable:!0,get:()=>P.value,set:H=>P.value=H})}if(o)for(const ie in o)Ih(o[ie],n,r,ie);if(u){const ie=Ie(u)?u.call(r):u;Reflect.ownKeys(ie).forEach(K=>{zi(K,ie[K])})}c&&Sl(c,e,"c");function Q(ie,K){Ee(K)?K.forEach(de=>ie(de.bind(r))):K&&ie(K.bind(r))}if(Q(pw,p),Q(fw,h),Q(hw,m),Q(mw,g),Q(lw,y),Q(dw,x),Q(ww,R),Q(bw,z),Q(yw,O),Q(gw,b),Q(Eh,S),Q(_w,N),Ee(G))if(G.length){const ie=e.exposed||(e.exposed={});G.forEach(K=>{Object.defineProperty(ie,K,{get:()=>r[K],set:de=>r[K]=de})})}else e.exposed||(e.exposed={});I&&e.render===Zt&&(e.render=I),ue!=null&&(e.inheritAttrs=ue),ne&&(e.components=ne),se&&(e.directives=se),N&&Sh(e)}function Sw(e,t,r=Zt){Ee(e)&&(e=Fa(e));for(const n in e){const s=e[n];let i;je(s)?"default"in s?i=or(s.from||n,s.default,!0):i=or(s.from||n):i=or(s),ot(i)?Object.defineProperty(t,n,{enumerable:!0,configurable:!0,get:()=>i.value,set:a=>i.value=a}):t[n]=i}}function Sl(e,t,r){Qt(Ee(e)?e.map(n=>n.bind(t.proxy)):e.bind(t.proxy),t,r)}function Ih(e,t,r,n){let s=n.includes(".")?Vh(r,n):()=>r[n];if(et(e)){const i=t[e];Ie(i)&&Oi(s,i)}else if(Ie(e))Oi(s,e.bind(r));else if(je(e))if(Ee(e))e.forEach(i=>Ih(i,t,r,n));else{const i=Ie(e.handler)?e.handler.bind(r):t[e.handler];Ie(i)&&Oi(s,i,e)}}function Ch(e){const t=e.type,{mixins:r,extends:n}=t,{mixins:s,optionsCache:i,config:{optionMergeStrategies:a}}=e.appContext,o=i.get(t);let u;return o?u=o:!s.length&&!r&&!n?u=t:(u={},s.length&&s.forEach(l=>Wi(u,l,a,!0)),Wi(u,t,a)),je(t)&&i.set(t,u),u}function Wi(e,t,r,n=!1){const{mixins:s,extends:i}=t;i&&Wi(e,i,r,!0),s&&s.forEach(a=>Wi(e,a,r,!0));for(const a in t)if(!(n&&a==="expose")){const o=kw[a]||r&&r[a];e[a]=o?o(e[a],t[a]):t[a]}return e}const kw={data:kl,props:Tl,emits:Tl,methods:zn,computed:zn,beforeCreate:ct,created:ct,beforeMount:ct,mounted:ct,beforeUpdate:ct,updated:ct,beforeDestroy:ct,beforeUnmount:ct,destroyed:ct,unmounted:ct,activated:ct,deactivated:ct,errorCaptured:ct,serverPrefetch:ct,components:zn,directives:zn,watch:Ew,provide:kl,inject:Tw};function kl(e,t){return t?e?function(){return ut(Ie(e)?e.call(this,this):e,Ie(t)?t.call(this,this):t)}:t:e}function Tw(e,t){return zn(Fa(e),Fa(t))}function Fa(e){if(Ee(e)){const t={};for(let r=0;r<e.length;r++)t[e[r]]=e[r];return t}return e}function ct(e,t){return e?[...new Set([].concat(e,t))]:t}function zn(e,t){return e?ut(Object.create(null),e,t):t}function Tl(e,t){return e?Ee(e)&&Ee(t)?[...new Set([...e,...t])]:ut(Object.create(null),xl(e),xl(t??{})):t}function Ew(e,t){if(!e)return t;if(!t)return e;const r=ut(Object.create(null),e);for(const n in t)r[n]=ct(e[n],t[n]);return r}function zh(){return{app:null,config:{isNativeTag:_b,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let Iw=0;function Cw(e,t){return function(n,s=null){Ie(n)||(n=ut({},n)),s!=null&&!je(s)&&(s=null);const i=zh(),a=new WeakSet,o=[];let u=!1;const l=i.app={_uid:Iw++,_component:n,_props:s,_container:null,_context:i,_instance:null,version:d$,get config(){return i.config},set config(c){},use(c,...p){return a.has(c)||(c&&Ie(c.install)?(a.add(c),c.install(l,...p)):Ie(c)&&(a.add(c),c(l,...p))),l},mixin(c){return i.mixins.includes(c)||i.mixins.push(c),l},component(c,p){return p?(i.components[c]=p,l):i.components[c]},directive(c,p){return p?(i.directives[c]=p,l):i.directives[c]},mount(c,p,h){if(!u){const m=l._ceVNode||Tt(n,s);return m.appContext=i,h===!0?h="svg":h===!1&&(h=void 0),e(m,c,h),u=!0,l._container=c,c.__vue_app__=l,Bo(m.component)}},onUnmount(c){o.push(c)},unmount(){u&&(Qt(o,l._instance,16),e(null,l._container),delete l._container.__vue_app__)},provide(c,p){return i.provides[c]=p,l},runWithContext(c){const p=sn;sn=l;try{return c()}finally{sn=p}}};return l}}let sn=null;function zi(e,t){if(ht){let r=ht.provides;const n=ht.parent&&ht.parent.provides;n===r&&(r=ht.provides=Object.create(n)),r[e]=t}}function or(e,t,r=!1){const n=ht||Kt;if(n||sn){const s=sn?sn._context.provides:n?n.parent==null?n.vnode.appContext&&n.vnode.appContext.provides:n.parent.provides:void 0;if(s&&e in s)return s[e];if(arguments.length>1)return r&&Ie(t)?t.call(n&&n.proxy):t}}const Oh={},Ah=()=>Object.create(Oh),Rh=e=>Object.getPrototypeOf(e)===Oh;function zw(e,t,r,n=!1){const s={},i=Ah();e.propsDefaults=Object.create(null),Bh(e,t,s,i);for(const a in e.propsOptions[0])a in s||(s[a]=void 0);r?e.props=n?s:ph(s):e.type.props?e.props=s:e.props=i,e.attrs=i}function Ow(e,t,r,n){const{props:s,attrs:i,vnode:{patchFlag:a}}=e,o=Ue(s),[u]=e.propsOptions;let l=!1;if((n||a>0)&&!(a&16)){if(a&8){const c=e.vnode.dynamicProps;for(let p=0;p<c.length;p++){let h=c[p];if(is(e.emitsOptions,h))continue;const m=t[h];if(u)if(We(i,h))m!==i[h]&&(i[h]=m,l=!0);else{const g=vr(h);s[g]=Ga(u,o,g,m,e,!1)}else m!==i[h]&&(i[h]=m,l=!0)}}}else{Bh(e,t,s,i)&&(l=!0);let c;for(const p in o)(!t||!We(t,p)&&((c=Hr(p))===p||!We(t,c)))&&(u?r&&(r[p]!==void 0||r[c]!==void 0)&&(s[p]=Ga(u,o,p,void 0,e,!0)):delete s[p]);if(i!==o)for(const p in i)(!t||!We(t,p))&&(delete i[p],l=!0)}l&&sr(e.attrs,"set","")}function Bh(e,t,r,n){const[s,i]=e.propsOptions;let a=!1,o;if(t)for(let u in t){if(Mn(u))continue;const l=t[u];let c;s&&We(s,c=vr(u))?!i||!i.includes(c)?r[c]=l:(o||(o={}))[c]=l:is(e.emitsOptions,u)||(!(u in n)||l!==n[u])&&(n[u]=l,a=!0)}if(i){const u=Ue(r),l=o||Fe;for(let c=0;c<i.length;c++){const p=i[c];r[p]=Ga(s,u,p,l[p],e,!We(l,p))}}return a}function Ga(e,t,r,n,s,i){const a=e[r];if(a!=null){const o=We(a,"default");if(o&&n===void 0){const u=a.default;if(a.type!==Function&&!a.skipFactory&&Ie(u)){const{propsDefaults:l}=s;if(r in l)n=l[r];else{const c=ri(s);n=l[r]=u.call(null,t),c()}}else n=u;s.ce&&s.ce._setProp(r,n)}a[0]&&(i&&!o?n=!1:a[1]&&(n===""||n===Hr(r))&&(n=!0))}return n}const Aw=new WeakMap;function Mh(e,t,r=!1){const n=r?Aw:t.propsCache,s=n.get(e);if(s)return s;const i=e.props,a={},o=[];let u=!1;if(!Ie(e)){const c=p=>{u=!0;const[h,m]=Mh(p,t,!0);ut(a,h),m&&o.push(...m)};!r&&t.mixins.length&&t.mixins.forEach(c),e.extends&&c(e.extends),e.mixins&&e.mixins.forEach(c)}if(!i&&!u)return je(e)&&n.set(e,tn),tn;if(Ee(i))for(let c=0;c<i.length;c++){const p=vr(i[c]);El(p)&&(a[p]=Fe)}else if(i)for(const c in i){const p=vr(c);if(El(p)){const h=i[c],m=a[p]=Ee(h)||Ie(h)?{type:h}:ut({},h),g=m.type;let y=!1,x=!0;if(Ee(g))for(let w=0;w<g.length;++w){const b=g[w],k=Ie(b)&&b.name;if(k==="Boolean"){y=!0;break}else k==="String"&&(x=!1)}else y=Ie(g)&&g.name==="Boolean";m[0]=y,m[1]=x,(y||We(m,"default"))&&o.push(p)}}const l=[a,o];return je(e)&&n.set(e,l),l}function El(e){return e[0]!=="$"&&!Mn(e)}const Nh=e=>e[0]==="_"||e==="$stable",Oo=e=>Ee(e)?e.map(jt):[jt(e)],Rw=(e,t,r)=>{if(t._n)return t;const n=aw((...s)=>Oo(t(...s)),r);return n._c=!1,n},Ph=(e,t,r)=>{const n=e._ctx;for(const s in e){if(Nh(s))continue;const i=e[s];if(Ie(i))t[s]=Rw(s,i,n);else if(i!=null){const a=Oo(i);t[s]=()=>a}}},Dh=(e,t)=>{const r=Oo(t);e.slots.default=()=>r},Uh=(e,t,r)=>{for(const n in t)(r||n!=="_")&&(e[n]=t[n])},Bw=(e,t,r)=>{const n=e.slots=Ah();if(e.vnode.shapeFlag&32){const s=t._;s?(Uh(n,t,r),r&&jf(n,"_",s,!0)):Ph(t,n)}else t&&Dh(e,t)},Mw=(e,t,r)=>{const{vnode:n,slots:s}=e;let i=!0,a=Fe;if(n.shapeFlag&32){const o=t._;o?r&&o===1?i=!1:Uh(s,t,r):(i=!t.$stable,Ph(t,s)),a=t}else t&&(Dh(e,t),a={default:1});if(i)for(const o in s)!Nh(o)&&a[o]==null&&delete s[o]},bt=Zw;function Nw(e){return Pw(e)}function Pw(e,t){const r=es();r.__VUE__=!0;const{insert:n,remove:s,patchProp:i,createElement:a,createText:o,createComment:u,setText:l,setElementText:c,parentNode:p,nextSibling:h,setScopeId:m=Zt,insertStaticContent:g}=e,y=(T,E,A,q=null,L=null,V=null,ee=void 0,te=null,J=!!E.dynamicChildren)=>{if(T===E)return;T&&!_n(T,E)&&(q=M(T),H(T,L,V,!0),T=null),E.patchFlag===-2&&(J=!1,E.dynamicChildren=null);const{type:Z,ref:$e,shapeFlag:oe}=E;switch(Z){case ss:x(T,E,A,q);break;case Kn:w(T,E,A,q);break;case As:T==null&&b(E,A,q,ee);break;case ir:ne(T,E,A,q,L,V,ee,te,J);break;default:oe&1?I(T,E,A,q,L,V,ee,te,J):oe&6?se(T,E,A,q,L,V,ee,te,J):(oe&64||oe&128)&&Z.process(T,E,A,q,L,V,ee,te,J,le)}$e!=null&&L&&Ui($e,T&&T.ref,V,E||T,!E)},x=(T,E,A,q)=>{if(T==null)n(E.el=o(E.children),A,q);else{const L=E.el=T.el;E.children!==T.children&&l(L,E.children)}},w=(T,E,A,q)=>{T==null?n(E.el=u(E.children||""),A,q):E.el=T.el},b=(T,E,A,q)=>{[T.el,T.anchor]=g(T.children,E,A,q,T.el,T.anchor)},k=({el:T,anchor:E},A,q)=>{let L;for(;T&&T!==E;)L=h(T),n(T,A,q),T=L;n(E,A,q)},S=({el:T,anchor:E})=>{let A;for(;T&&T!==E;)A=h(T),s(T),T=A;s(E)},I=(T,E,A,q,L,V,ee,te,J)=>{E.type==="svg"?ee="svg":E.type==="math"&&(ee="mathml"),T==null?z(E,A,q,L,V,ee,te,J):N(T,E,L,V,ee,te,J)},z=(T,E,A,q,L,V,ee,te)=>{let J,Z;const{props:$e,shapeFlag:oe,transition:ye,dirs:ve}=T;if(J=T.el=a(T.type,V,$e&&$e.is,$e),oe&8?c(J,T.children):oe&16&&R(T.children,J,null,q,L,Os(T,V),ee,te),ve&&Ir(T,null,q,"created"),O(J,T,T.scopeId,ee,q),$e){for(const Ae in $e)Ae!=="value"&&!Mn(Ae)&&i(J,Ae,null,$e[Ae],V,q);"value"in $e&&i(J,"value",null,$e.value,V),(Z=$e.onVnodeBeforeMount)&&Ht(Z,q,T)}ve&&Ir(T,null,q,"beforeMount");const ze=Dw(L,ye);ze&&ye.beforeEnter(J),n(J,E,A),((Z=$e&&$e.onVnodeMounted)||ze||ve)&&bt(()=>{Z&&Ht(Z,q,T),ze&&ye.enter(J),ve&&Ir(T,null,q,"mounted")},L)},O=(T,E,A,q,L)=>{if(A&&m(T,A),q)for(let V=0;V<q.length;V++)m(T,q[V]);if(L){let V=L.subTree;if(E===V||Fh(V.type)&&(V.ssContent===E||V.ssFallback===E)){const ee=L.vnode;O(T,ee,ee.scopeId,ee.slotScopeIds,L.parent)}}},R=(T,E,A,q,L,V,ee,te,J=0)=>{for(let Z=J;Z<T.length;Z++){const $e=T[Z]=te?yr(T[Z]):jt(T[Z]);y(null,$e,E,A,q,L,V,ee,te)}},N=(T,E,A,q,L,V,ee)=>{const te=E.el=T.el;let{patchFlag:J,dynamicChildren:Z,dirs:$e}=E;J|=T.patchFlag&16;const oe=T.props||Fe,ye=E.props||Fe;let ve;if(A&&Cr(A,!1),(ve=ye.onVnodeBeforeUpdate)&&Ht(ve,A,E,T),$e&&Ir(E,T,A,"beforeUpdate"),A&&Cr(A,!0),(oe.innerHTML&&ye.innerHTML==null||oe.textContent&&ye.textContent==null)&&c(te,""),Z?G(T.dynamicChildren,Z,te,A,q,Os(E,L),V):ee||K(T,E,te,null,A,q,Os(E,L),V,!1),J>0){if(J&16)ue(te,oe,ye,A,L);else if(J&2&&oe.class!==ye.class&&i(te,"class",null,ye.class,L),J&4&&i(te,"style",oe.style,ye.style,L),J&8){const ze=E.dynamicProps;for(let Ae=0;Ae<ze.length;Ae++){const be=ze[Ae],rt=oe[be],nt=ye[be];(nt!==rt||be==="value")&&i(te,be,rt,nt,L,A)}}J&1&&T.children!==E.children&&c(te,E.children)}else!ee&&Z==null&&ue(te,oe,ye,A,L);((ve=ye.onVnodeUpdated)||$e)&&bt(()=>{ve&&Ht(ve,A,E,T),$e&&Ir(E,T,A,"updated")},q)},G=(T,E,A,q,L,V,ee)=>{for(let te=0;te<E.length;te++){const J=T[te],Z=E[te],$e=J.el&&(J.type===ir||!_n(J,Z)||J.shapeFlag&70)?p(J.el):A;y(J,Z,$e,null,q,L,V,ee,!0)}},ue=(T,E,A,q,L)=>{if(E!==A){if(E!==Fe)for(const V in E)!Mn(V)&&!(V in A)&&i(T,V,E[V],null,L,q);for(const V in A){if(Mn(V))continue;const ee=A[V],te=E[V];ee!==te&&V!=="value"&&i(T,V,te,ee,L,q)}"value"in A&&i(T,"value",E.value,A.value,L)}},ne=(T,E,A,q,L,V,ee,te,J)=>{const Z=E.el=T?T.el:o(""),$e=E.anchor=T?T.anchor:o("");let{patchFlag:oe,dynamicChildren:ye,slotScopeIds:ve}=E;ve&&(te=te?te.concat(ve):ve),T==null?(n(Z,A,q),n($e,A,q),R(E.children||[],A,$e,L,V,ee,te,J)):oe>0&&oe&64&&ye&&T.dynamicChildren?(G(T.dynamicChildren,ye,A,L,V,ee,te),(E.key!=null||L&&E===L.subTree)&&Wh(T,E,!0)):K(T,E,A,$e,L,V,ee,te,J)},se=(T,E,A,q,L,V,ee,te,J)=>{E.slotScopeIds=te,T==null?E.shapeFlag&512?L.ctx.activate(E,A,q,ee,J):Se(E,A,q,L,V,ee,J):_e(T,E,J)},Se=(T,E,A,q,L,V,ee)=>{const te=T.component=i$(T,q,L);if(kh(T)&&(te.ctx.renderer=le),s$(te,!1,ee),te.asyncDep){if(L&&L.registerDep(te,Q,ee),!T.el){const J=te.subTree=Tt(Kn);w(null,J,E,A)}}else Q(te,T,E,A,L,V,ee)},_e=(T,E,A)=>{const q=E.component=T.component;if(jw(T,E,A))if(q.asyncDep&&!q.asyncResolved){ie(q,E,A);return}else q.next=E,q.update();else E.el=T.el,q.vnode=E},Q=(T,E,A,q,L,V,ee)=>{const te=()=>{if(T.isMounted){let{next:oe,bu:ye,u:ve,parent:ze,vnode:Ae}=T;{const Ye=qh(T);if(Ye){oe&&(oe.el=Ae.el,ie(T,oe,ee)),Ye.asyncDep.then(()=>{T.isUnmounted||te()});return}}let be=oe,rt;Cr(T,!1),oe?(oe.el=Ae.el,ie(T,oe,ee)):oe=Ae,ye&&ks(ye),(rt=oe.props&&oe.props.onVnodeBeforeUpdate)&&Ht(rt,ze,oe,Ae),Cr(T,!0);const nt=Cl(T),mt=T.subTree;T.subTree=nt,y(mt,nt,p(mt.el),M(mt),T,L,V),oe.el=nt.el,be===null&&Kw(T,nt.el),ve&&bt(ve,L),(rt=oe.props&&oe.props.onVnodeUpdated)&&bt(()=>Ht(rt,ze,oe,Ae),L)}else{let oe;const{el:ye,props:ve}=E,{bm:ze,m:Ae,parent:be,root:rt,type:nt}=T,mt=Un(E);Cr(T,!1),ze&&ks(ze),!mt&&(oe=ve&&ve.onVnodeBeforeMount)&&Ht(oe,be,E),Cr(T,!0);{rt.ce&&rt.ce._injectChildStyle(nt);const Ye=T.subTree=Cl(T);y(null,Ye,A,q,T,L,V),E.el=Ye.el}if(Ae&&bt(Ae,L),!mt&&(oe=ve&&ve.onVnodeMounted)){const Ye=E;bt(()=>Ht(oe,be,Ye),L)}(E.shapeFlag&256||be&&Un(be.vnode)&&be.vnode.shapeFlag&256)&&T.a&&bt(T.a,L),T.isMounted=!0,E=A=q=null}};T.scope.on();const J=T.effect=new Yf(te);T.scope.off();const Z=T.update=J.run.bind(J),$e=T.job=J.runIfDirty.bind(J);$e.i=T,$e.id=T.uid,J.scheduler=()=>Co($e),Cr(T,!0),Z()},ie=(T,E,A)=>{E.component=T;const q=T.vnode.props;T.vnode=E,T.next=null,Ow(T,E.props,q,A),Mw(T,E.children,A),kr(),vl(T),Tr()},K=(T,E,A,q,L,V,ee,te,J=!1)=>{const Z=T&&T.children,$e=T?T.shapeFlag:0,oe=E.children,{patchFlag:ye,shapeFlag:ve}=E;if(ye>0){if(ye&128){Re(Z,oe,A,q,L,V,ee,te,J);return}else if(ye&256){de(Z,oe,A,q,L,V,ee,te,J);return}}ve&8?($e&16&&W(Z,L,V),oe!==Z&&c(A,oe)):$e&16?ve&16?Re(Z,oe,A,q,L,V,ee,te,J):W(Z,L,V,!0):($e&8&&c(A,""),ve&16&&R(oe,A,q,L,V,ee,te,J))},de=(T,E,A,q,L,V,ee,te,J)=>{T=T||tn,E=E||tn;const Z=T.length,$e=E.length,oe=Math.min(Z,$e);let ye;for(ye=0;ye<oe;ye++){const ve=E[ye]=J?yr(E[ye]):jt(E[ye]);y(T[ye],ve,A,null,L,V,ee,te,J)}Z>$e?W(T,L,V,!0,!1,oe):R(E,A,q,L,V,ee,te,J,oe)},Re=(T,E,A,q,L,V,ee,te,J)=>{let Z=0;const $e=E.length;let oe=T.length-1,ye=$e-1;for(;Z<=oe&&Z<=ye;){const ve=T[Z],ze=E[Z]=J?yr(E[Z]):jt(E[Z]);if(_n(ve,ze))y(ve,ze,A,null,L,V,ee,te,J);else break;Z++}for(;Z<=oe&&Z<=ye;){const ve=T[oe],ze=E[ye]=J?yr(E[ye]):jt(E[ye]);if(_n(ve,ze))y(ve,ze,A,null,L,V,ee,te,J);else break;oe--,ye--}if(Z>oe){if(Z<=ye){const ve=ye+1,ze=ve<$e?E[ve].el:q;for(;Z<=ye;)y(null,E[Z]=J?yr(E[Z]):jt(E[Z]),A,ze,L,V,ee,te,J),Z++}}else if(Z>ye)for(;Z<=oe;)H(T[Z],L,V,!0),Z++;else{const ve=Z,ze=Z,Ae=new Map;for(Z=ze;Z<=ye;Z++){const Qe=E[Z]=J?yr(E[Z]):jt(E[Z]);Qe.key!=null&&Ae.set(Qe.key,Z)}let be,rt=0;const nt=ye-ze+1;let mt=!1,Ye=0;const Et=new Array(nt);for(Z=0;Z<nt;Z++)Et[Z]=0;for(Z=ve;Z<=oe;Z++){const Qe=T[Z];if(rt>=nt){H(Qe,L,V,!0);continue}let _t;if(Qe.key!=null)_t=Ae.get(Qe.key);else for(be=ze;be<=ye;be++)if(Et[be-ze]===0&&_n(Qe,E[be])){_t=be;break}_t===void 0?H(Qe,L,V,!0):(Et[_t-ze]=Z+1,_t>=Ye?Ye=_t:mt=!0,y(Qe,E[_t],A,null,L,V,ee,te,J),rt++)}const pn=mt?Uw(Et):tn;for(be=pn.length-1,Z=nt-1;Z>=0;Z--){const Qe=ze+Z,_t=E[Qe],fn=Qe+1<$e?E[Qe+1].el:q;Et[Z]===0?y(null,_t,A,fn,L,V,ee,te,J):mt&&(be<0||Z!==pn[be]?P(_t,A,fn,2):be--)}}},P=(T,E,A,q,L=null)=>{const{el:V,type:ee,transition:te,children:J,shapeFlag:Z}=T;if(Z&6){P(T.component.subTree,E,A,q);return}if(Z&128){T.suspense.move(E,A,q);return}if(Z&64){ee.move(T,E,A,le);return}if(ee===ir){n(V,E,A);for(let oe=0;oe<J.length;oe++)P(J[oe],E,A,q);n(T.anchor,E,A);return}if(ee===As){k(T,E,A);return}if(q!==2&&Z&1&&te)if(q===0)te.beforeEnter(V),n(V,E,A),bt(()=>te.enter(V),L);else{const{leave:oe,delayLeave:ye,afterLeave:ve}=te,ze=()=>n(V,E,A),Ae=()=>{oe(V,()=>{ze(),ve&&ve()})};ye?ye(V,ze,Ae):Ae()}else n(V,E,A)},H=(T,E,A,q=!1,L=!1)=>{const{type:V,props:ee,ref:te,children:J,dynamicChildren:Z,shapeFlag:$e,patchFlag:oe,dirs:ye,cacheIndex:ve}=T;if(oe===-2&&(L=!1),te!=null&&Ui(te,null,A,T,!0),ve!=null&&(E.renderCache[ve]=void 0),$e&256){E.ctx.deactivate(T);return}const ze=$e&1&&ye,Ae=!Un(T);let be;if(Ae&&(be=ee&&ee.onVnodeBeforeUnmount)&&Ht(be,E,T),$e&6)Ze(T.component,A,q);else{if($e&128){T.suspense.unmount(A,q);return}ze&&Ir(T,null,E,"beforeUnmount"),$e&64?T.type.remove(T,E,A,le,q):Z&&!Z.hasOnce&&(V!==ir||oe>0&&oe&64)?W(Z,E,A,!1,!0):(V===ir&&oe&384||!L&&$e&16)&&W(J,E,A),q&&Y(T)}(Ae&&(be=ee&&ee.onVnodeUnmounted)||ze)&&bt(()=>{be&&Ht(be,E,T),ze&&Ir(T,null,E,"unmounted")},A)},Y=T=>{const{type:E,el:A,anchor:q,transition:L}=T;if(E===ir){ge(A,q);return}if(E===As){S(T);return}const V=()=>{s(A),L&&!L.persisted&&L.afterLeave&&L.afterLeave()};if(T.shapeFlag&1&&L&&!L.persisted){const{leave:ee,delayLeave:te}=L,J=()=>ee(A,V);te?te(T.el,V,J):J()}else V()},ge=(T,E)=>{let A;for(;T!==E;)A=h(T),s(T),T=A;s(E)},Ze=(T,E,A)=>{const{bum:q,scope:L,job:V,subTree:ee,um:te,m:J,a:Z}=T;Il(J),Il(Z),q&&ks(q),L.stop(),V&&(V.flags|=8,H(ee,T,E,A)),te&&bt(te,E),bt(()=>{T.isUnmounted=!0},E),E&&E.pendingBranch&&!E.isUnmounted&&T.asyncDep&&!T.asyncResolved&&T.suspenseId===E.pendingId&&(E.deps--,E.deps===0&&E.resolve())},W=(T,E,A,q=!1,L=!1,V=0)=>{for(let ee=V;ee<T.length;ee++)H(T[ee],E,A,q,L)},M=T=>{if(T.shapeFlag&6)return M(T.component.subTree);if(T.shapeFlag&128)return T.suspense.next();const E=h(T.anchor||T.el),A=E&&E[ow];return A?h(A):E};let ae=!1;const X=(T,E,A)=>{T==null?E._vnode&&H(E._vnode,null,null,!0):y(E._vnode||null,T,E,null,null,null,A),E._vnode=T,ae||(ae=!0,vl(),wh(),ae=!1)},le={p:y,um:H,m:P,r:Y,mt:Se,mc:R,pc:K,pbc:G,n:M,o:e};return{render:X,hydrate:void 0,createApp:Cw(X)}}function Os({type:e,props:t},r){return r==="svg"&&e==="foreignObject"||r==="mathml"&&e==="annotation-xml"&&t&&t.encoding&&t.encoding.includes("html")?void 0:r}function Cr({effect:e,job:t},r){r?(e.flags|=32,t.flags|=4):(e.flags&=-33,t.flags&=-5)}function Dw(e,t){return(!e||e&&!e.pendingBranch)&&t&&!t.persisted}function Wh(e,t,r=!1){const n=e.children,s=t.children;if(Ee(n)&&Ee(s))for(let i=0;i<n.length;i++){const a=n[i];let o=s[i];o.shapeFlag&1&&!o.dynamicChildren&&((o.patchFlag<=0||o.patchFlag===32)&&(o=s[i]=yr(s[i]),o.el=a.el),!r&&o.patchFlag!==-2&&Wh(a,o)),o.type===ss&&(o.el=a.el)}}function Uw(e){const t=e.slice(),r=[0];let n,s,i,a,o;const u=e.length;for(n=0;n<u;n++){const l=e[n];if(l!==0){if(s=r[r.length-1],e[s]<l){t[n]=s,r.push(n);continue}for(i=0,a=r.length-1;i<a;)o=i+a>>1,e[r[o]]<l?i=o+1:a=o;l<e[r[i]]&&(i>0&&(t[n]=r[i-1]),r[i]=n)}}for(i=r.length,a=r[i-1];i-- >0;)r[i]=a,a=t[a];return r}function qh(e){const t=e.subTree.component;if(t)return t.asyncDep&&!t.asyncResolved?t:qh(t)}function Il(e){if(e)for(let t=0;t<e.length;t++)e[t].flags|=8}const Ww=Symbol.for("v-scx"),qw=()=>or(Ww);function Oi(e,t,r){return Lh(e,t,r)}function Lh(e,t,r=Fe){const{immediate:n,deep:s,flush:i,once:a}=r,o=ut({},r),u=t&&n||!t&&i!=="post";let l;if(Qn){if(i==="sync"){const m=qw();l=m.__watcherHandles||(m.__watcherHandles=[])}else if(!u){const m=()=>{};return m.stop=Zt,m.resume=Zt,m.pause=Zt,m}}const c=ht;o.call=(m,g,y)=>Qt(m,c,g,y);let p=!1;i==="post"?o.scheduler=m=>{bt(m,c&&c.suspense)}:i!=="sync"&&(p=!0,o.scheduler=(m,g)=>{g?m():Co(m)}),o.augmentJob=m=>{t&&(m.flags|=4),p&&(m.flags|=2,c&&(m.id=c.uid,m.i=c))};const h=rw(e,t,o);return Qn&&(l?l.push(h):u&&h()),h}function Lw(e,t,r){const n=this.proxy,s=et(e)?e.includes(".")?Vh(n,e):()=>n[e]:e.bind(n,n);let i;Ie(t)?i=t:(i=t.handler,r=t);const a=ri(this),o=Lh(s,i.bind(n),r);return a(),o}function Vh(e,t){const r=t.split(".");return()=>{let n=e;for(let s=0;s<r.length&&n;s++)n=n[r[s]];return n}}const Vw=(e,t)=>t==="modelValue"||t==="model-value"?e.modelModifiers:e[`${t}Modifiers`]||e[`${vr(t)}Modifiers`]||e[`${Hr(t)}Modifiers`];function Hw(e,t,...r){if(e.isUnmounted)return;const n=e.vnode.props||Fe;let s=r;const i=t.startsWith("update:"),a=i&&Vw(n,t.slice(7));a&&(a.trim&&(s=r.map(c=>et(c)?c.trim():c)),a.number&&(s=r.map(vb)));let o,u=n[o=Ss(t)]||n[o=Ss(vr(t))];!u&&i&&(u=n[o=Ss(Hr(t))]),u&&Qt(u,e,6,s);const l=n[o+"Once"];if(l){if(!e.emitted)e.emitted={};else if(e.emitted[o])return;e.emitted[o]=!0,Qt(l,e,6,s)}}function Hh(e,t,r=!1){const n=t.emitsCache,s=n.get(e);if(s!==void 0)return s;const i=e.emits;let a={},o=!1;if(!Ie(e)){const u=l=>{const c=Hh(l,t,!0);c&&(o=!0,ut(a,c))};!r&&t.mixins.length&&t.mixins.forEach(u),e.extends&&u(e.extends),e.mixins&&e.mixins.forEach(u)}return!i&&!o?(je(e)&&n.set(e,null),null):(Ee(i)?i.forEach(u=>a[u]=null):ut(a,i),je(e)&&n.set(e,a),a)}function is(e,t){return!e||!Xi(t)?!1:(t=t.slice(2).replace(/Once$/,""),We(e,t[0].toLowerCase()+t.slice(1))||We(e,Hr(t))||We(e,t))}function Cl(e){const{type:t,vnode:r,proxy:n,withProxy:s,propsOptions:[i],slots:a,attrs:o,emit:u,render:l,renderCache:c,props:p,data:h,setupState:m,ctx:g,inheritAttrs:y}=e,x=Di(e);let w,b;try{if(r.shapeFlag&4){const S=s||n,I=S;w=jt(l.call(I,S,c,p,m,h,g)),b=o}else{const S=t;w=jt(S.length>1?S(p,{attrs:o,slots:a,emit:u}):S(p,null)),b=t.props?o:Fw(o)}}catch(S){qn.length=0,rs(S,e,1),w=Tt(Kn)}let k=w;if(b&&y!==!1){const S=Object.keys(b),{shapeFlag:I}=k;S.length&&I&7&&(i&&S.some(go)&&(b=Gw(b,i)),k=an(k,b,!1,!0))}return r.dirs&&(k=an(k,null,!1,!0),k.dirs=k.dirs?k.dirs.concat(r.dirs):r.dirs),r.transition&&zo(k,r.transition),w=k,Di(x),w}const Fw=e=>{let t;for(const r in e)(r==="class"||r==="style"||Xi(r))&&((t||(t={}))[r]=e[r]);return t},Gw=(e,t)=>{const r={};for(const n in e)(!go(n)||!(n.slice(9)in t))&&(r[n]=e[n]);return r};function jw(e,t,r){const{props:n,children:s,component:i}=e,{props:a,children:o,patchFlag:u}=t,l=i.emitsOptions;if(t.dirs||t.transition)return!0;if(r&&u>=0){if(u&1024)return!0;if(u&16)return n?zl(n,a,l):!!a;if(u&8){const c=t.dynamicProps;for(let p=0;p<c.length;p++){const h=c[p];if(a[h]!==n[h]&&!is(l,h))return!0}}}else return(s||o)&&(!o||!o.$stable)?!0:n===a?!1:n?a?zl(n,a,l):!0:!!a;return!1}function zl(e,t,r){const n=Object.keys(t);if(n.length!==Object.keys(e).length)return!0;for(let s=0;s<n.length;s++){const i=n[s];if(t[i]!==e[i]&&!is(r,i))return!0}return!1}function Kw({vnode:e,parent:t},r){for(;t;){const n=t.subTree;if(n.suspense&&n.suspense.activeBranch===e&&(n.el=e.el),n===e)(e=t.vnode).el=r,t=t.parent;else break}}const Fh=e=>e.__isSuspense;function Zw(e,t){t&&t.pendingBranch?Ee(e)?t.effects.push(...e):t.effects.push(e):sw(e)}const ir=Symbol.for("v-fgt"),ss=Symbol.for("v-txt"),Kn=Symbol.for("v-cmt"),As=Symbol.for("v-stc"),qn=[];let vt=null;function Gh(e=!1){qn.push(vt=e?null:[])}function Qw(){qn.pop(),vt=qn[qn.length-1]||null}let Zn=1;function Ol(e,t=!1){Zn+=e,e<0&&vt&&t&&(vt.hasOnce=!0)}function jh(e){return e.dynamicChildren=Zn>0?vt||tn:null,Qw(),Zn>0&&vt&&vt.push(e),e}function Xw(e,t,r,n,s,i){return jh(Ao(e,t,r,n,s,i,!0))}function Yw(e,t,r,n,s){return jh(Tt(e,t,r,n,s,!0))}function qi(e){return e?e.__v_isVNode===!0:!1}function _n(e,t){return e.type===t.type&&e.key===t.key}const Kh=({key:e})=>e??null,Ai=({ref:e,ref_key:t,ref_for:r})=>(typeof e=="number"&&(e=""+e),e!=null?et(e)||ot(e)||Ie(e)?{i:Kt,r:e,k:t,f:!!r}:e:null);function Ao(e,t=null,r=null,n=0,s=null,i=e===ir?0:1,a=!1,o=!1){const u={__v_isVNode:!0,__v_skip:!0,type:e,props:t,key:t&&Kh(t),ref:t&&Ai(t),scopeId:vh,slotScopeIds:null,children:r,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:i,patchFlag:n,dynamicProps:s,dynamicChildren:null,appContext:null,ctx:Kt};return o?(Ro(u,r),i&128&&e.normalize(u)):r&&(u.shapeFlag|=et(r)?8:16),Zn>0&&!a&&vt&&(u.patchFlag>0||i&6)&&u.patchFlag!==32&&vt.push(u),u}const Tt=Jw;function Jw(e,t=null,r=null,n=0,s=null,i=!1){if((!e||e===$w)&&(e=Kn),qi(e)){const o=an(e,t,!0);return r&&Ro(o,r),Zn>0&&!i&&vt&&(o.shapeFlag&6?vt[vt.indexOf(e)]=o:vt.push(o)),o.patchFlag=-2,o}if(l$(e)&&(e=e.__vccOpts),t){t=e$(t);let{class:o,style:u}=t;o&&!et(o)&&(t.class=wo(o)),je(u)&&(Io(u)&&!Ee(u)&&(u=ut({},u)),t.style=bo(u))}const a=et(e)?1:Fh(e)?128:uw(e)?64:je(e)?4:Ie(e)?2:0;return Ao(e,t,r,n,s,a,i,!0)}function e$(e){return e?Io(e)||Rh(e)?ut({},e):e:null}function an(e,t,r=!1,n=!1){const{props:s,ref:i,patchFlag:a,children:o,transition:u}=e,l=t?t$(s||{},t):s,c={__v_isVNode:!0,__v_skip:!0,type:e.type,props:l,key:l&&Kh(l),ref:t&&t.ref?r&&i?Ee(i)?i.concat(Ai(t)):[i,Ai(t)]:Ai(t):i,scopeId:e.scopeId,slotScopeIds:e.slotScopeIds,children:o,target:e.target,targetStart:e.targetStart,targetAnchor:e.targetAnchor,staticCount:e.staticCount,shapeFlag:e.shapeFlag,patchFlag:t&&e.type!==ir?a===-1?16:a|16:a,dynamicProps:e.dynamicProps,dynamicChildren:e.dynamicChildren,appContext:e.appContext,dirs:e.dirs,transition:u,component:e.component,suspense:e.suspense,ssContent:e.ssContent&&an(e.ssContent),ssFallback:e.ssFallback&&an(e.ssFallback),el:e.el,anchor:e.anchor,ctx:e.ctx,ce:e.ce};return u&&n&&zo(c,u.clone(c)),c}function Zh(e=" ",t=0){return Tt(ss,null,e,t)}function jt(e){return e==null||typeof e=="boolean"?Tt(Kn):Ee(e)?Tt(ir,null,e.slice()):qi(e)?yr(e):Tt(ss,null,String(e))}function yr(e){return e.el===null&&e.patchFlag!==-1||e.memo?e:an(e)}function Ro(e,t){let r=0;const{shapeFlag:n}=e;if(t==null)t=null;else if(Ee(t))r=16;else if(typeof t=="object")if(n&65){const s=t.default;s&&(s._c&&(s._d=!1),Ro(e,s()),s._c&&(s._d=!0));return}else{r=32;const s=t._;!s&&!Rh(t)?t._ctx=Kt:s===3&&Kt&&(Kt.slots._===1?t._=1:(t._=2,e.patchFlag|=1024))}else Ie(t)?(t={default:t,_ctx:Kt},r=32):(t=String(t),n&64?(r=16,t=[Zh(t)]):r=8);e.children=t,e.shapeFlag|=r}function t$(...e){const t={};for(let r=0;r<e.length;r++){const n=e[r];for(const s in n)if(s==="class")t.class!==n.class&&(t.class=wo([t.class,n.class]));else if(s==="style")t.style=bo([t.style,n.style]);else if(Xi(s)){const i=t[s],a=n[s];a&&i!==a&&!(Ee(i)&&i.includes(a))&&(t[s]=i?[].concat(i,a):a)}else s!==""&&(t[s]=n[s])}return t}function Ht(e,t,r,n=null){Qt(e,t,7,[r,n])}const r$=zh();let n$=0;function i$(e,t,r){const n=e.type,s=(t?t.appContext:e.appContext)||r$,i={uid:n$++,vnode:e,type:n,parent:t,appContext:s,root:null,next:null,subTree:null,effect:null,update:null,job:null,scope:new Cb(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:t?t.provides:Object.create(s.provides),ids:t?t.ids:["",0,0],accessCache:null,renderCache:[],components:null,directives:null,propsOptions:Mh(n,s),emitsOptions:Hh(n,s),emit:null,emitted:null,propsDefaults:Fe,inheritAttrs:n.inheritAttrs,ctx:Fe,data:Fe,props:Fe,attrs:Fe,slots:Fe,refs:Fe,setupState:Fe,setupContext:null,suspense:r,suspenseId:r?r.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return i.ctx={_:i},i.root=t?t.root:i,i.emit=Hw.bind(null,i),e.ce&&e.ce(i),i}let ht=null,Li,ja;{const e=es(),t=(r,n)=>{let s;return(s=e[r])||(s=e[r]=[]),s.push(n),i=>{s.length>1?s.forEach(a=>a(i)):s[0](i)}};Li=t("__VUE_INSTANCE_SETTERS__",r=>ht=r),ja=t("__VUE_SSR_SETTERS__",r=>Qn=r)}const ri=e=>{const t=ht;return Li(e),e.scope.on(),()=>{e.scope.off(),Li(t)}},Al=()=>{ht&&ht.scope.off(),Li(null)};function Qh(e){return e.vnode.shapeFlag&4}let Qn=!1;function s$(e,t=!1,r=!1){t&&ja(t);const{props:n,children:s}=e.vnode,i=Qh(e);zw(e,n,i,t),Bw(e,s,r);const a=i?a$(e,t):void 0;return t&&ja(!1),a}function a$(e,t){const r=e.type;e.accessCache=Object.create(null),e.proxy=new Proxy(e.ctx,vw);const{setup:n}=r;if(n){kr();const s=e.setupContext=n.length>1?u$(e):null,i=ri(e),a=ti(n,e,0,[e.props,s]),o=Vf(a);if(Tr(),i(),(o||e.sp)&&!Un(e)&&Sh(e),o){if(a.then(Al,Al),t)return a.then(u=>{Rl(e,u)}).catch(u=>{rs(u,e,0)});e.asyncDep=a}else Rl(e,a)}else Xh(e)}function Rl(e,t,r){Ie(t)?e.type.__ssrInlineRender?e.ssrRender=t:e.render=t:je(t)&&(e.setupState=gh(t)),Xh(e)}function Xh(e,t,r){const n=e.type;e.render||(e.render=n.render||Zt);{const s=ri(e);kr();try{xw(e)}finally{Tr(),s()}}}const o$={get(e,t){return at(e,"get",""),e[t]}};function u$(e){const t=r=>{e.exposed=r||{}};return{attrs:new Proxy(e.attrs,o$),slots:e.slots,emit:e.emit,expose:t}}function Bo(e){return e.exposed?e.exposeProxy||(e.exposeProxy=new Proxy(gh(Zb(e.exposed)),{get(t,r){if(r in t)return t[r];if(r in Wn)return Wn[r](e)},has(t,r){return r in t||r in Wn}})):e.proxy}function l$(e){return Ie(e)&&"__vccOpts"in e}const Bt=(e,t)=>ew(e,t,Qn);function Yh(e,t,r){const n=arguments.length;return n===2?je(t)&&!Ee(t)?qi(t)?Tt(e,null,[t]):Tt(e,t):Tt(e,null,t):(n>3?r=Array.prototype.slice.call(arguments,2):n===3&&qi(r)&&(r=[r]),Tt(e,t,r))}const d$="3.5.13";/**
* @vue/runtime-dom v3.5.13
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let Ka;const Bl=typeof window<"u"&&window.trustedTypes;if(Bl)try{Ka=Bl.createPolicy("vue",{createHTML:e=>e})}catch{}const Jh=Ka?e=>Ka.createHTML(e):e=>e,c$="http://www.w3.org/2000/svg",p$="http://www.w3.org/1998/Math/MathML",nr=typeof document<"u"?document:null,Ml=nr&&nr.createElement("template"),f$={insert:(e,t,r)=>{t.insertBefore(e,r||null)},remove:e=>{const t=e.parentNode;t&&t.removeChild(e)},createElement:(e,t,r,n)=>{const s=t==="svg"?nr.createElementNS(c$,e):t==="mathml"?nr.createElementNS(p$,e):r?nr.createElement(e,{is:r}):nr.createElement(e);return e==="select"&&n&&n.multiple!=null&&s.setAttribute("multiple",n.multiple),s},createText:e=>nr.createTextNode(e),createComment:e=>nr.createComment(e),setText:(e,t)=>{e.nodeValue=t},setElementText:(e,t)=>{e.textContent=t},parentNode:e=>e.parentNode,nextSibling:e=>e.nextSibling,querySelector:e=>nr.querySelector(e),setScopeId(e,t){e.setAttribute(t,"")},insertStaticContent(e,t,r,n,s,i){const a=r?r.previousSibling:t.lastChild;if(s&&(s===i||s.nextSibling))for(;t.insertBefore(s.cloneNode(!0),r),!(s===i||!(s=s.nextSibling)););else{Ml.innerHTML=Jh(n==="svg"?`<svg>${e}</svg>`:n==="mathml"?`<math>${e}</math>`:e);const o=Ml.content;if(n==="svg"||n==="mathml"){const u=o.firstChild;for(;u.firstChild;)o.appendChild(u.firstChild);o.removeChild(u)}t.insertBefore(o,r)}return[a?a.nextSibling:t.firstChild,r?r.previousSibling:t.lastChild]}},h$=Symbol("_vtc");function m$(e,t,r){const n=e[h$];n&&(t=(t?[t,...n]:[...n]).join(" ")),t==null?e.removeAttribute("class"):r?e.setAttribute("class",t):e.className=t}const Nl=Symbol("_vod"),g$=Symbol("_vsh"),_$=Symbol(""),y$=/(^|;)\s*display\s*:/;function b$(e,t,r){const n=e.style,s=et(r);let i=!1;if(r&&!s){if(t)if(et(t))for(const a of t.split(";")){const o=a.slice(0,a.indexOf(":")).trim();r[o]==null&&Ri(n,o,"")}else for(const a in t)r[a]==null&&Ri(n,a,"");for(const a in r)a==="display"&&(i=!0),Ri(n,a,r[a])}else if(s){if(t!==r){const a=n[_$];a&&(r+=";"+a),n.cssText=r,i=y$.test(r)}}else t&&e.removeAttribute("style");Nl in e&&(e[Nl]=i?n.display:"",e[g$]&&(n.display="none"))}const Pl=/\s*!important$/;function Ri(e,t,r){if(Ee(r))r.forEach(n=>Ri(e,t,n));else if(r==null&&(r=""),t.startsWith("--"))e.setProperty(t,r);else{const n=w$(e,t);Pl.test(r)?e.setProperty(Hr(n),r.replace(Pl,""),"important"):e[n]=r}}const Dl=["Webkit","Moz","ms"],Rs={};function w$(e,t){const r=Rs[t];if(r)return r;let n=vr(t);if(n!=="filter"&&n in e)return Rs[t]=n;n=Gf(n);for(let s=0;s<Dl.length;s++){const i=Dl[s]+n;if(i in e)return Rs[t]=i}return t}const Ul="http://www.w3.org/1999/xlink";function Wl(e,t,r,n,s,i=Ib(t)){n&&t.startsWith("xlink:")?r==null?e.removeAttributeNS(Ul,t.slice(6,t.length)):e.setAttributeNS(Ul,t,r):r==null||i&&!Kf(r)?e.removeAttribute(t):e.setAttribute(t,i?"":Sr(r)?String(r):r)}function ql(e,t,r,n,s){if(t==="innerHTML"||t==="textContent"){r!=null&&(e[t]=t==="innerHTML"?Jh(r):r);return}const i=e.tagName;if(t==="value"&&i!=="PROGRESS"&&!i.includes("-")){const o=i==="OPTION"?e.getAttribute("value")||"":e.value,u=r==null?e.type==="checkbox"?"on":"":String(r);(o!==u||!("_value"in e))&&(e.value=u),r==null&&e.removeAttribute(t),e._value=r;return}let a=!1;if(r===""||r==null){const o=typeof e[t];o==="boolean"?r=Kf(r):r==null&&o==="string"?(r="",a=!0):o==="number"&&(r=0,a=!0)}try{e[t]=r}catch{}a&&e.removeAttribute(s||t)}function $$(e,t,r,n){e.addEventListener(t,r,n)}function v$(e,t,r,n){e.removeEventListener(t,r,n)}const Ll=Symbol("_vei");function x$(e,t,r,n,s=null){const i=e[Ll]||(e[Ll]={}),a=i[t];if(n&&a)a.value=n;else{const[o,u]=S$(t);if(n){const l=i[t]=E$(n,s);$$(e,o,l,u)}else a&&(v$(e,o,a,u),i[t]=void 0)}}const Vl=/(?:Once|Passive|Capture)$/;function S$(e){let t;if(Vl.test(e)){t={};let n;for(;n=e.match(Vl);)e=e.slice(0,e.length-n[0].length),t[n[0].toLowerCase()]=!0}return[e[2]===":"?e.slice(3):Hr(e.slice(2)),t]}let Bs=0;const k$=Promise.resolve(),T$=()=>Bs||(k$.then(()=>Bs=0),Bs=Date.now());function E$(e,t){const r=n=>{if(!n._vts)n._vts=Date.now();else if(n._vts<=r.attached)return;Qt(I$(n,r.value),t,5,[n])};return r.value=e,r.attached=T$(),r}function I$(e,t){if(Ee(t)){const r=e.stopImmediatePropagation;return e.stopImmediatePropagation=()=>{r.call(e),e._stopped=!0},t.map(n=>s=>!s._stopped&&n&&n(s))}else return t}const Hl=e=>e.charCodeAt(0)===111&&e.charCodeAt(1)===110&&e.charCodeAt(2)>96&&e.charCodeAt(2)<123,C$=(e,t,r,n,s,i)=>{const a=s==="svg";t==="class"?m$(e,n,a):t==="style"?b$(e,r,n):Xi(t)?go(t)||x$(e,t,r,n,i):(t[0]==="."?(t=t.slice(1),!0):t[0]==="^"?(t=t.slice(1),!1):z$(e,t,n,a))?(ql(e,t,n),!e.tagName.includes("-")&&(t==="value"||t==="checked"||t==="selected")&&Wl(e,t,n,a,i,t!=="value")):e._isVueCE&&(/[A-Z]/.test(t)||!et(n))?ql(e,vr(t),n,i,t):(t==="true-value"?e._trueValue=n:t==="false-value"&&(e._falseValue=n),Wl(e,t,n,a))};function z$(e,t,r,n){if(n)return!!(t==="innerHTML"||t==="textContent"||t in e&&Hl(t)&&Ie(r));if(t==="spellcheck"||t==="draggable"||t==="translate"||t==="form"||t==="list"&&e.tagName==="INPUT"||t==="type"&&e.tagName==="TEXTAREA")return!1;if(t==="width"||t==="height"){const s=e.tagName;if(s==="IMG"||s==="VIDEO"||s==="CANVAS"||s==="SOURCE")return!1}return Hl(t)&&et(r)?!1:t in e}const O$=ut({patchProp:C$},f$);let Fl;function A$(){return Fl||(Fl=Nw(O$))}const R$=(...e)=>{const t=A$().createApp(...e),{mount:r}=t;return t.mount=n=>{const s=M$(n);if(!s)return;const i=t._component;!Ie(i)&&!i.render&&!i.template&&(i.template=s.innerHTML),s.nodeType===1&&(s.textContent="");const a=r(s,!1,B$(s));return s instanceof Element&&(s.removeAttribute("v-cloak"),s.setAttribute("data-v-app","")),a},t};function B$(e){if(e instanceof SVGElement)return"svg";if(typeof MathMLElement=="function"&&e instanceof MathMLElement)return"mathml"}function M$(e){return et(e)?document.querySelector(e):e}/*!
  * vue-router v4.5.0
  * (c) 2024 Eduardo San Martin Morote
  * @license MIT
  */const Yr=typeof document<"u";function em(e){return typeof e=="object"||"displayName"in e||"props"in e||"__vccOpts"in e}function N$(e){return e.__esModule||e[Symbol.toStringTag]==="Module"||e.default&&em(e.default)}const De=Object.assign;function Ms(e,t){const r={};for(const n in t){const s=t[n];r[n]=Ut(s)?s.map(e):e(s)}return r}const Ln=()=>{},Ut=Array.isArray,tm=/#/g,P$=/&/g,D$=/\//g,U$=/=/g,W$=/\?/g,rm=/\+/g,q$=/%5B/g,L$=/%5D/g,nm=/%5E/g,V$=/%60/g,im=/%7B/g,H$=/%7C/g,sm=/%7D/g,F$=/%20/g;function Mo(e){return encodeURI(""+e).replace(H$,"|").replace(q$,"[").replace(L$,"]")}function G$(e){return Mo(e).replace(im,"{").replace(sm,"}").replace(nm,"^")}function Za(e){return Mo(e).replace(rm,"%2B").replace(F$,"+").replace(tm,"%23").replace(P$,"%26").replace(V$,"`").replace(im,"{").replace(sm,"}").replace(nm,"^")}function j$(e){return Za(e).replace(U$,"%3D")}function K$(e){return Mo(e).replace(tm,"%23").replace(W$,"%3F")}function Z$(e){return e==null?"":K$(e).replace(D$,"%2F")}function Xn(e){try{return decodeURIComponent(""+e)}catch{}return""+e}const Q$=/\/$/,X$=e=>e.replace(Q$,"");function Ns(e,t,r="/"){let n,s={},i="",a="";const o=t.indexOf("#");let u=t.indexOf("?");return o<u&&o>=0&&(u=-1),u>-1&&(n=t.slice(0,u),i=t.slice(u+1,o>-1?o:t.length),s=e(i)),o>-1&&(n=n||t.slice(0,o),a=t.slice(o,t.length)),n=tv(n??t,r),{fullPath:n+(i&&"?")+i+a,path:n,query:s,hash:Xn(a)}}function Y$(e,t){const r=t.query?e(t.query):"";return t.path+(r&&"?")+r+(t.hash||"")}function Gl(e,t){return!t||!e.toLowerCase().startsWith(t.toLowerCase())?e:e.slice(t.length)||"/"}function J$(e,t,r){const n=t.matched.length-1,s=r.matched.length-1;return n>-1&&n===s&&on(t.matched[n],r.matched[s])&&am(t.params,r.params)&&e(t.query)===e(r.query)&&t.hash===r.hash}function on(e,t){return(e.aliasOf||e)===(t.aliasOf||t)}function am(e,t){if(Object.keys(e).length!==Object.keys(t).length)return!1;for(const r in e)if(!ev(e[r],t[r]))return!1;return!0}function ev(e,t){return Ut(e)?jl(e,t):Ut(t)?jl(t,e):e===t}function jl(e,t){return Ut(t)?e.length===t.length&&e.every((r,n)=>r===t[n]):e.length===1&&e[0]===t}function tv(e,t){if(e.startsWith("/"))return e;if(!e)return t;const r=t.split("/"),n=e.split("/"),s=n[n.length-1];(s===".."||s===".")&&n.push("");let i=r.length-1,a,o;for(a=0;a<n.length;a++)if(o=n[a],o!==".")if(o==="..")i>1&&i--;else break;return r.slice(0,i).join("/")+"/"+n.slice(a).join("/")}const fr={path:"/",name:void 0,params:{},query:{},hash:"",fullPath:"/",matched:[],meta:{},redirectedFrom:void 0};var Yn;(function(e){e.pop="pop",e.push="push"})(Yn||(Yn={}));var Vn;(function(e){e.back="back",e.forward="forward",e.unknown=""})(Vn||(Vn={}));function rv(e){if(!e)if(Yr){const t=document.querySelector("base");e=t&&t.getAttribute("href")||"/",e=e.replace(/^\w+:\/\/[^\/]+/,"")}else e="/";return e[0]!=="/"&&e[0]!=="#"&&(e="/"+e),X$(e)}const nv=/^[^#]+#/;function iv(e,t){return e.replace(nv,"#")+t}function sv(e,t){const r=document.documentElement.getBoundingClientRect(),n=e.getBoundingClientRect();return{behavior:t.behavior,left:n.left-r.left-(t.left||0),top:n.top-r.top-(t.top||0)}}const as=()=>({left:window.scrollX,top:window.scrollY});function av(e){let t;if("el"in e){const r=e.el,n=typeof r=="string"&&r.startsWith("#"),s=typeof r=="string"?n?document.getElementById(r.slice(1)):document.querySelector(r):r;if(!s)return;t=sv(s,e)}else t=e;"scrollBehavior"in document.documentElement.style?window.scrollTo(t):window.scrollTo(t.left!=null?t.left:window.scrollX,t.top!=null?t.top:window.scrollY)}function Kl(e,t){return(history.state?history.state.position-t:-1)+e}const Qa=new Map;function ov(e,t){Qa.set(e,t)}function uv(e){const t=Qa.get(e);return Qa.delete(e),t}let lv=()=>location.protocol+"//"+location.host;function om(e,t){const{pathname:r,search:n,hash:s}=t,i=e.indexOf("#");if(i>-1){let o=s.includes(e.slice(i))?e.slice(i).length:1,u=s.slice(o);return u[0]!=="/"&&(u="/"+u),Gl(u,"")}return Gl(r,e)+n+s}function dv(e,t,r,n){let s=[],i=[],a=null;const o=({state:h})=>{const m=om(e,location),g=r.value,y=t.value;let x=0;if(h){if(r.value=m,t.value=h,a&&a===g){a=null;return}x=y?h.position-y.position:0}else n(m);s.forEach(w=>{w(r.value,g,{delta:x,type:Yn.pop,direction:x?x>0?Vn.forward:Vn.back:Vn.unknown})})};function u(){a=r.value}function l(h){s.push(h);const m=()=>{const g=s.indexOf(h);g>-1&&s.splice(g,1)};return i.push(m),m}function c(){const{history:h}=window;h.state&&h.replaceState(De({},h.state,{scroll:as()}),"")}function p(){for(const h of i)h();i=[],window.removeEventListener("popstate",o),window.removeEventListener("beforeunload",c)}return window.addEventListener("popstate",o),window.addEventListener("beforeunload",c,{passive:!0}),{pauseListeners:u,listen:l,destroy:p}}function Zl(e,t,r,n=!1,s=!1){return{back:e,current:t,forward:r,replaced:n,position:window.history.length,scroll:s?as():null}}function cv(e){const{history:t,location:r}=window,n={value:om(e,r)},s={value:t.state};s.value||i(n.value,{back:null,current:n.value,forward:null,position:t.length-1,replaced:!0,scroll:null},!0);function i(u,l,c){const p=e.indexOf("#"),h=p>-1?(r.host&&document.querySelector("base")?e:e.slice(p))+u:lv()+e+u;try{t[c?"replaceState":"pushState"](l,"",h),s.value=l}catch(m){console.error(m),r[c?"replace":"assign"](h)}}function a(u,l){const c=De({},t.state,Zl(s.value.back,u,s.value.forward,!0),l,{position:s.value.position});i(u,c,!0),n.value=u}function o(u,l){const c=De({},s.value,t.state,{forward:u,scroll:as()});i(c.current,c,!0);const p=De({},Zl(n.value,u,null),{position:c.position+1},l);i(u,p,!1),n.value=u}return{location:n,state:s,push:o,replace:a}}function pv(e){e=rv(e);const t=cv(e),r=dv(e,t.state,t.location,t.replace);function n(i,a=!0){a||r.pauseListeners(),history.go(i)}const s=De({location:"",base:e,go:n,createHref:iv.bind(null,e)},t,r);return Object.defineProperty(s,"location",{enumerable:!0,get:()=>t.location.value}),Object.defineProperty(s,"state",{enumerable:!0,get:()=>t.state.value}),s}function fv(e){return typeof e=="string"||e&&typeof e=="object"}function um(e){return typeof e=="string"||typeof e=="symbol"}const lm=Symbol("");var Ql;(function(e){e[e.aborted=4]="aborted",e[e.cancelled=8]="cancelled",e[e.duplicated=16]="duplicated"})(Ql||(Ql={}));function un(e,t){return De(new Error,{type:e,[lm]:!0},t)}function tr(e,t){return e instanceof Error&&lm in e&&(t==null||!!(e.type&t))}const Xl="[^/]+?",hv={sensitive:!1,strict:!1,start:!0,end:!0},mv=/[.+*?^${}()[\]/\\]/g;function gv(e,t){const r=De({},hv,t),n=[];let s=r.start?"^":"";const i=[];for(const l of e){const c=l.length?[]:[90];r.strict&&!l.length&&(s+="/");for(let p=0;p<l.length;p++){const h=l[p];let m=40+(r.sensitive?.25:0);if(h.type===0)p||(s+="/"),s+=h.value.replace(mv,"\\$&"),m+=40;else if(h.type===1){const{value:g,repeatable:y,optional:x,regexp:w}=h;i.push({name:g,repeatable:y,optional:x});const b=w||Xl;if(b!==Xl){m+=10;try{new RegExp(`(${b})`)}catch(S){throw new Error(`Invalid custom RegExp for param "${g}" (${b}): `+S.message)}}let k=y?`((?:${b})(?:/(?:${b}))*)`:`(${b})`;p||(k=x&&l.length<2?`(?:/${k})`:"/"+k),x&&(k+="?"),s+=k,m+=20,x&&(m+=-8),y&&(m+=-20),b===".*"&&(m+=-50)}c.push(m)}n.push(c)}if(r.strict&&r.end){const l=n.length-1;n[l][n[l].length-1]+=.7000000000000001}r.strict||(s+="/?"),r.end?s+="$":r.strict&&!s.endsWith("/")&&(s+="(?:/|$)");const a=new RegExp(s,r.sensitive?"":"i");function o(l){const c=l.match(a),p={};if(!c)return null;for(let h=1;h<c.length;h++){const m=c[h]||"",g=i[h-1];p[g.name]=m&&g.repeatable?m.split("/"):m}return p}function u(l){let c="",p=!1;for(const h of e){(!p||!c.endsWith("/"))&&(c+="/"),p=!1;for(const m of h)if(m.type===0)c+=m.value;else if(m.type===1){const{value:g,repeatable:y,optional:x}=m,w=g in l?l[g]:"";if(Ut(w)&&!y)throw new Error(`Provided param "${g}" is an array but it is not repeatable (* or + modifiers)`);const b=Ut(w)?w.join("/"):w;if(!b)if(x)h.length<2&&(c.endsWith("/")?c=c.slice(0,-1):p=!0);else throw new Error(`Missing required param "${g}"`);c+=b}}return c||"/"}return{re:a,score:n,keys:i,parse:o,stringify:u}}function _v(e,t){let r=0;for(;r<e.length&&r<t.length;){const n=t[r]-e[r];if(n)return n;r++}return e.length<t.length?e.length===1&&e[0]===80?-1:1:e.length>t.length?t.length===1&&t[0]===80?1:-1:0}function dm(e,t){let r=0;const n=e.score,s=t.score;for(;r<n.length&&r<s.length;){const i=_v(n[r],s[r]);if(i)return i;r++}if(Math.abs(s.length-n.length)===1){if(Yl(n))return 1;if(Yl(s))return-1}return s.length-n.length}function Yl(e){const t=e[e.length-1];return e.length>0&&t[t.length-1]<0}const yv={type:0,value:""},bv=/[a-zA-Z0-9_]/;function wv(e){if(!e)return[[]];if(e==="/")return[[yv]];if(!e.startsWith("/"))throw new Error(`Invalid path "${e}"`);function t(m){throw new Error(`ERR (${r})/"${l}": ${m}`)}let r=0,n=r;const s=[];let i;function a(){i&&s.push(i),i=[]}let o=0,u,l="",c="";function p(){l&&(r===0?i.push({type:0,value:l}):r===1||r===2||r===3?(i.length>1&&(u==="*"||u==="+")&&t(`A repeatable param (${l}) must be alone in its segment. eg: '/:ids+.`),i.push({type:1,value:l,regexp:c,repeatable:u==="*"||u==="+",optional:u==="*"||u==="?"})):t("Invalid state to consume buffer"),l="")}function h(){l+=u}for(;o<e.length;){if(u=e[o++],u==="\\"&&r!==2){n=r,r=4;continue}switch(r){case 0:u==="/"?(l&&p(),a()):u===":"?(p(),r=1):h();break;case 4:h(),r=n;break;case 1:u==="("?r=2:bv.test(u)?h():(p(),r=0,u!=="*"&&u!=="?"&&u!=="+"&&o--);break;case 2:u===")"?c[c.length-1]=="\\"?c=c.slice(0,-1)+u:r=3:c+=u;break;case 3:p(),r=0,u!=="*"&&u!=="?"&&u!=="+"&&o--,c="";break;default:t("Unknown state");break}}return r===2&&t(`Unfinished custom RegExp for param "${l}"`),p(),a(),s}function $v(e,t,r){const n=gv(wv(e.path),r),s=De(n,{record:e,parent:t,children:[],alias:[]});return t&&!s.record.aliasOf==!t.record.aliasOf&&t.children.push(s),s}function vv(e,t){const r=[],n=new Map;t=rd({strict:!1,end:!0,sensitive:!1},t);function s(p){return n.get(p)}function i(p,h,m){const g=!m,y=ed(p);y.aliasOf=m&&m.record;const x=rd(t,p),w=[y];if("alias"in p){const S=typeof p.alias=="string"?[p.alias]:p.alias;for(const I of S)w.push(ed(De({},y,{components:m?m.record.components:y.components,path:I,aliasOf:m?m.record:y})))}let b,k;for(const S of w){const{path:I}=S;if(h&&I[0]!=="/"){const z=h.record.path,O=z[z.length-1]==="/"?"":"/";S.path=h.record.path+(I&&O+I)}if(b=$v(S,h,x),m?m.alias.push(b):(k=k||b,k!==b&&k.alias.push(b),g&&p.name&&!td(b)&&a(p.name)),cm(b)&&u(b),y.children){const z=y.children;for(let O=0;O<z.length;O++)i(z[O],b,m&&m.children[O])}m=m||b}return k?()=>{a(k)}:Ln}function a(p){if(um(p)){const h=n.get(p);h&&(n.delete(p),r.splice(r.indexOf(h),1),h.children.forEach(a),h.alias.forEach(a))}else{const h=r.indexOf(p);h>-1&&(r.splice(h,1),p.record.name&&n.delete(p.record.name),p.children.forEach(a),p.alias.forEach(a))}}function o(){return r}function u(p){const h=kv(p,r);r.splice(h,0,p),p.record.name&&!td(p)&&n.set(p.record.name,p)}function l(p,h){let m,g={},y,x;if("name"in p&&p.name){if(m=n.get(p.name),!m)throw un(1,{location:p});x=m.record.name,g=De(Jl(h.params,m.keys.filter(k=>!k.optional).concat(m.parent?m.parent.keys.filter(k=>k.optional):[]).map(k=>k.name)),p.params&&Jl(p.params,m.keys.map(k=>k.name))),y=m.stringify(g)}else if(p.path!=null)y=p.path,m=r.find(k=>k.re.test(y)),m&&(g=m.parse(y),x=m.record.name);else{if(m=h.name?n.get(h.name):r.find(k=>k.re.test(h.path)),!m)throw un(1,{location:p,currentLocation:h});x=m.record.name,g=De({},h.params,p.params),y=m.stringify(g)}const w=[];let b=m;for(;b;)w.unshift(b.record),b=b.parent;return{name:x,path:y,params:g,matched:w,meta:Sv(w)}}e.forEach(p=>i(p));function c(){r.length=0,n.clear()}return{addRoute:i,resolve:l,removeRoute:a,clearRoutes:c,getRoutes:o,getRecordMatcher:s}}function Jl(e,t){const r={};for(const n of t)n in e&&(r[n]=e[n]);return r}function ed(e){const t={path:e.path,redirect:e.redirect,name:e.name,meta:e.meta||{},aliasOf:e.aliasOf,beforeEnter:e.beforeEnter,props:xv(e),children:e.children||[],instances:{},leaveGuards:new Set,updateGuards:new Set,enterCallbacks:{},components:"components"in e?e.components||null:e.component&&{default:e.component}};return Object.defineProperty(t,"mods",{value:{}}),t}function xv(e){const t={},r=e.props||!1;if("component"in e)t.default=r;else for(const n in e.components)t[n]=typeof r=="object"?r[n]:r;return t}function td(e){for(;e;){if(e.record.aliasOf)return!0;e=e.parent}return!1}function Sv(e){return e.reduce((t,r)=>De(t,r.meta),{})}function rd(e,t){const r={};for(const n in e)r[n]=n in t?t[n]:e[n];return r}function kv(e,t){let r=0,n=t.length;for(;r!==n;){const i=r+n>>1;dm(e,t[i])<0?n=i:r=i+1}const s=Tv(e);return s&&(n=t.lastIndexOf(s,n-1)),n}function Tv(e){let t=e;for(;t=t.parent;)if(cm(t)&&dm(e,t)===0)return t}function cm({record:e}){return!!(e.name||e.components&&Object.keys(e.components).length||e.redirect)}function Ev(e){const t={};if(e===""||e==="?")return t;const n=(e[0]==="?"?e.slice(1):e).split("&");for(let s=0;s<n.length;++s){const i=n[s].replace(rm," "),a=i.indexOf("="),o=Xn(a<0?i:i.slice(0,a)),u=a<0?null:Xn(i.slice(a+1));if(o in t){let l=t[o];Ut(l)||(l=t[o]=[l]),l.push(u)}else t[o]=u}return t}function nd(e){let t="";for(let r in e){const n=e[r];if(r=j$(r),n==null){n!==void 0&&(t+=(t.length?"&":"")+r);continue}(Ut(n)?n.map(i=>i&&Za(i)):[n&&Za(n)]).forEach(i=>{i!==void 0&&(t+=(t.length?"&":"")+r,i!=null&&(t+="="+i))})}return t}function Iv(e){const t={};for(const r in e){const n=e[r];n!==void 0&&(t[r]=Ut(n)?n.map(s=>s==null?null:""+s):n==null?n:""+n)}return t}const Cv=Symbol(""),id=Symbol(""),No=Symbol(""),pm=Symbol(""),Xa=Symbol("");function yn(){let e=[];function t(n){return e.push(n),()=>{const s=e.indexOf(n);s>-1&&e.splice(s,1)}}function r(){e=[]}return{add:t,list:()=>e.slice(),reset:r}}function br(e,t,r,n,s,i=a=>a()){const a=n&&(n.enterCallbacks[s]=n.enterCallbacks[s]||[]);return()=>new Promise((o,u)=>{const l=h=>{h===!1?u(un(4,{from:r,to:t})):h instanceof Error?u(h):fv(h)?u(un(2,{from:t,to:h})):(a&&n.enterCallbacks[s]===a&&typeof h=="function"&&a.push(h),o())},c=i(()=>e.call(n&&n.instances[s],t,r,l));let p=Promise.resolve(c);e.length<3&&(p=p.then(l)),p.catch(h=>u(h))})}function Ps(e,t,r,n,s=i=>i()){const i=[];for(const a of e)for(const o in a.components){let u=a.components[o];if(!(t!=="beforeRouteEnter"&&!a.instances[o]))if(em(u)){const c=(u.__vccOpts||u)[t];c&&i.push(br(c,r,n,a,o,s))}else{let l=u();i.push(()=>l.then(c=>{if(!c)throw new Error(`Couldn't resolve component "${o}" at "${a.path}"`);const p=N$(c)?c.default:c;a.mods[o]=c,a.components[o]=p;const m=(p.__vccOpts||p)[t];return m&&br(m,r,n,a,o,s)()}))}}return i}function sd(e){const t=or(No),r=or(pm),n=Bt(()=>{const u=Ur(e.to);return t.resolve(u)}),s=Bt(()=>{const{matched:u}=n.value,{length:l}=u,c=u[l-1],p=r.matched;if(!c||!p.length)return-1;const h=p.findIndex(on.bind(null,c));if(h>-1)return h;const m=ad(u[l-2]);return l>1&&ad(c)===m&&p[p.length-1].path!==m?p.findIndex(on.bind(null,u[l-2])):h}),i=Bt(()=>s.value>-1&&Bv(r.params,n.value.params)),a=Bt(()=>s.value>-1&&s.value===r.matched.length-1&&am(r.params,n.value.params));function o(u={}){if(Rv(u)){const l=t[Ur(e.replace)?"replace":"push"](Ur(e.to)).catch(Ln);return e.viewTransition&&typeof document<"u"&&"startViewTransition"in document&&document.startViewTransition(()=>l),l}return Promise.resolve()}return{route:n,href:Bt(()=>n.value.href),isActive:i,isExactActive:a,navigate:o}}function zv(e){return e.length===1?e[0]:e}const Ov=xh({name:"RouterLink",compatConfig:{MODE:3},props:{to:{type:[String,Object],required:!0},replace:Boolean,activeClass:String,exactActiveClass:String,custom:Boolean,ariaCurrentValue:{type:String,default:"page"}},useLink:sd,setup(e,{slots:t}){const r=ts(sd(e)),{options:n}=or(No),s=Bt(()=>({[od(e.activeClass,n.linkActiveClass,"router-link-active")]:r.isActive,[od(e.exactActiveClass,n.linkExactActiveClass,"router-link-exact-active")]:r.isExactActive}));return()=>{const i=t.default&&zv(t.default(r));return e.custom?i:Yh("a",{"aria-current":r.isExactActive?e.ariaCurrentValue:null,href:r.href,onClick:r.navigate,class:s.value},i)}}}),Av=Ov;function Rv(e){if(!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)&&!e.defaultPrevented&&!(e.button!==void 0&&e.button!==0)){if(e.currentTarget&&e.currentTarget.getAttribute){const t=e.currentTarget.getAttribute("target");if(/\b_blank\b/i.test(t))return}return e.preventDefault&&e.preventDefault(),!0}}function Bv(e,t){for(const r in t){const n=t[r],s=e[r];if(typeof n=="string"){if(n!==s)return!1}else if(!Ut(s)||s.length!==n.length||n.some((i,a)=>i!==s[a]))return!1}return!0}function ad(e){return e?e.aliasOf?e.aliasOf.path:e.path:""}const od=(e,t,r)=>e??t??r,Mv=xh({name:"RouterView",inheritAttrs:!1,props:{name:{type:String,default:"default"},route:Object},compatConfig:{MODE:3},setup(e,{attrs:t,slots:r}){const n=or(Xa),s=Bt(()=>e.route||n.value),i=or(id,0),a=Bt(()=>{let l=Ur(i);const{matched:c}=s.value;let p;for(;(p=c[l])&&!p.components;)l++;return l}),o=Bt(()=>s.value.matched[a.value]);zi(id,Bt(()=>a.value+1)),zi(Cv,o),zi(Xa,s);const u=hh();return Oi(()=>[u.value,o.value,e.name],([l,c,p],[h,m,g])=>{c&&(c.instances[p]=l,m&&m!==c&&l&&l===h&&(c.leaveGuards.size||(c.leaveGuards=m.leaveGuards),c.updateGuards.size||(c.updateGuards=m.updateGuards))),l&&c&&(!m||!on(c,m)||!h)&&(c.enterCallbacks[p]||[]).forEach(y=>y(l))},{flush:"post"}),()=>{const l=s.value,c=e.name,p=o.value,h=p&&p.components[c];if(!h)return ud(r.default,{Component:h,route:l});const m=p.props[c],g=m?m===!0?l.params:typeof m=="function"?m(l):m:null,x=Yh(h,De({},g,t,{onVnodeUnmounted:w=>{w.component.isUnmounted&&(p.instances[c]=null)},ref:u}));return ud(r.default,{Component:x,route:l})||x}}});function ud(e,t){if(!e)return null;const r=e(t);return r.length===1?r[0]:r}const fm=Mv;function Nv(e){const t=vv(e.routes,e),r=e.parseQuery||Ev,n=e.stringifyQuery||nd,s=e.history,i=yn(),a=yn(),o=yn(),u=Qb(fr);let l=fr;Yr&&e.scrollBehavior&&"scrollRestoration"in history&&(history.scrollRestoration="manual");const c=Ms.bind(null,M=>""+M),p=Ms.bind(null,Z$),h=Ms.bind(null,Xn);function m(M,ae){let X,le;return um(M)?(X=t.getRecordMatcher(M),le=ae):le=M,t.addRoute(le,X)}function g(M){const ae=t.getRecordMatcher(M);ae&&t.removeRoute(ae)}function y(){return t.getRoutes().map(M=>M.record)}function x(M){return!!t.getRecordMatcher(M)}function w(M,ae){if(ae=De({},ae||u.value),typeof M=="string"){const A=Ns(r,M,ae.path),q=t.resolve({path:A.path},ae),L=s.createHref(A.fullPath);return De(A,q,{params:h(q.params),hash:Xn(A.hash),redirectedFrom:void 0,href:L})}let X;if(M.path!=null)X=De({},M,{path:Ns(r,M.path,ae.path).path});else{const A=De({},M.params);for(const q in A)A[q]==null&&delete A[q];X=De({},M,{params:p(A)}),ae.params=p(ae.params)}const le=t.resolve(X,ae),Ce=M.hash||"";le.params=c(h(le.params));const T=Y$(n,De({},M,{hash:G$(Ce),path:le.path})),E=s.createHref(T);return De({fullPath:T,hash:Ce,query:n===nd?Iv(M.query):M.query||{}},le,{redirectedFrom:void 0,href:E})}function b(M){return typeof M=="string"?Ns(r,M,u.value.path):De({},M)}function k(M,ae){if(l!==M)return un(8,{from:ae,to:M})}function S(M){return O(M)}function I(M){return S(De(b(M),{replace:!0}))}function z(M){const ae=M.matched[M.matched.length-1];if(ae&&ae.redirect){const{redirect:X}=ae;let le=typeof X=="function"?X(M):X;return typeof le=="string"&&(le=le.includes("?")||le.includes("#")?le=b(le):{path:le},le.params={}),De({query:M.query,hash:M.hash,params:le.path!=null?{}:M.params},le)}}function O(M,ae){const X=l=w(M),le=u.value,Ce=M.state,T=M.force,E=M.replace===!0,A=z(X);if(A)return O(De(b(A),{state:typeof A=="object"?De({},Ce,A.state):Ce,force:T,replace:E}),ae||X);const q=X;q.redirectedFrom=ae;let L;return!T&&J$(n,le,X)&&(L=un(16,{to:q,from:le}),P(le,le,!0,!1)),(L?Promise.resolve(L):G(q,le)).catch(V=>tr(V)?tr(V,2)?V:Re(V):K(V,q,le)).then(V=>{if(V){if(tr(V,2))return O(De({replace:E},b(V.to),{state:typeof V.to=="object"?De({},Ce,V.to.state):Ce,force:T}),ae||q)}else V=ne(q,le,!0,E,Ce);return ue(q,le,V),V})}function R(M,ae){const X=k(M,ae);return X?Promise.reject(X):Promise.resolve()}function N(M){const ae=ge.values().next().value;return ae&&typeof ae.runWithContext=="function"?ae.runWithContext(M):M()}function G(M,ae){let X;const[le,Ce,T]=Pv(M,ae);X=Ps(le.reverse(),"beforeRouteLeave",M,ae);for(const A of le)A.leaveGuards.forEach(q=>{X.push(br(q,M,ae))});const E=R.bind(null,M,ae);return X.push(E),W(X).then(()=>{X=[];for(const A of i.list())X.push(br(A,M,ae));return X.push(E),W(X)}).then(()=>{X=Ps(Ce,"beforeRouteUpdate",M,ae);for(const A of Ce)A.updateGuards.forEach(q=>{X.push(br(q,M,ae))});return X.push(E),W(X)}).then(()=>{X=[];for(const A of T)if(A.beforeEnter)if(Ut(A.beforeEnter))for(const q of A.beforeEnter)X.push(br(q,M,ae));else X.push(br(A.beforeEnter,M,ae));return X.push(E),W(X)}).then(()=>(M.matched.forEach(A=>A.enterCallbacks={}),X=Ps(T,"beforeRouteEnter",M,ae,N),X.push(E),W(X))).then(()=>{X=[];for(const A of a.list())X.push(br(A,M,ae));return X.push(E),W(X)}).catch(A=>tr(A,8)?A:Promise.reject(A))}function ue(M,ae,X){o.list().forEach(le=>N(()=>le(M,ae,X)))}function ne(M,ae,X,le,Ce){const T=k(M,ae);if(T)return T;const E=ae===fr,A=Yr?history.state:{};X&&(le||E?s.replace(M.fullPath,De({scroll:E&&A&&A.scroll},Ce)):s.push(M.fullPath,Ce)),u.value=M,P(M,ae,X,E),Re()}let se;function Se(){se||(se=s.listen((M,ae,X)=>{if(!Ze.listening)return;const le=w(M),Ce=z(le);if(Ce){O(De(Ce,{replace:!0,force:!0}),le).catch(Ln);return}l=le;const T=u.value;Yr&&ov(Kl(T.fullPath,X.delta),as()),G(le,T).catch(E=>tr(E,12)?E:tr(E,2)?(O(De(b(E.to),{force:!0}),le).then(A=>{tr(A,20)&&!X.delta&&X.type===Yn.pop&&s.go(-1,!1)}).catch(Ln),Promise.reject()):(X.delta&&s.go(-X.delta,!1),K(E,le,T))).then(E=>{E=E||ne(le,T,!1),E&&(X.delta&&!tr(E,8)?s.go(-X.delta,!1):X.type===Yn.pop&&tr(E,20)&&s.go(-1,!1)),ue(le,T,E)}).catch(Ln)}))}let _e=yn(),Q=yn(),ie;function K(M,ae,X){Re(M);const le=Q.list();return le.length?le.forEach(Ce=>Ce(M,ae,X)):console.error(M),Promise.reject(M)}function de(){return ie&&u.value!==fr?Promise.resolve():new Promise((M,ae)=>{_e.add([M,ae])})}function Re(M){return ie||(ie=!M,Se(),_e.list().forEach(([ae,X])=>M?X(M):ae()),_e.reset()),M}function P(M,ae,X,le){const{scrollBehavior:Ce}=e;if(!Yr||!Ce)return Promise.resolve();const T=!X&&uv(Kl(M.fullPath,0))||(le||!X)&&history.state&&history.state.scroll||null;return yh().then(()=>Ce(M,ae,T)).then(E=>E&&av(E)).catch(E=>K(E,M,ae))}const H=M=>s.go(M);let Y;const ge=new Set,Ze={currentRoute:u,listening:!0,addRoute:m,removeRoute:g,clearRoutes:t.clearRoutes,hasRoute:x,getRoutes:y,resolve:w,options:e,push:S,replace:I,go:H,back:()=>H(-1),forward:()=>H(1),beforeEach:i.add,beforeResolve:a.add,afterEach:o.add,onError:Q.add,isReady:de,install(M){const ae=this;M.component("RouterLink",Av),M.component("RouterView",fm),M.config.globalProperties.$router=ae,Object.defineProperty(M.config.globalProperties,"$route",{enumerable:!0,get:()=>Ur(u)}),Yr&&!Y&&u.value===fr&&(Y=!0,S(s.location).catch(Ce=>{}));const X={};for(const Ce in fr)Object.defineProperty(X,Ce,{get:()=>u.value[Ce],enumerable:!0});M.provide(No,ae),M.provide(pm,ph(X)),M.provide(Xa,u);const le=M.unmount;ge.add(M),M.unmount=function(){ge.delete(M),ge.size<1&&(l=fr,se&&se(),se=null,u.value=fr,Y=!1,ie=!1),le()}}};function W(M){return M.reduce((ae,X)=>ae.then(()=>N(X)),Promise.resolve())}return Ze}function Pv(e,t){const r=[],n=[],s=[],i=Math.max(t.matched.length,e.matched.length);for(let a=0;a<i;a++){const o=t.matched[a];o&&(e.matched.find(l=>on(l,o))?n.push(o):r.push(o));const u=e.matched[a];u&&(t.matched.find(l=>on(l,u))||s.push(u))}return[r,n,s]}const Dv={__name:"App",setup(e){return(t,r)=>(Gh(),Yw(Ur(fm)))}};/*!
 * ONNX Runtime Web v1.22.0
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */var Po=Object.defineProperty,Uv=Object.getOwnPropertyDescriptor,Wv=Object.getOwnPropertyNames,qv=Object.prototype.hasOwnProperty,Lv=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,r)=>(typeof require<"u"?require:t)[r]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),j=(e,t)=>()=>(e&&(t=e(e=0)),t),cn=(e,t)=>{for(var r in t)Po(e,r,{get:t[r],enumerable:!0})},Vv=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of Wv(t))!qv.call(e,s)&&s!==r&&Po(e,s,{get:()=>t[s],enumerable:!(n=Uv(t,s))||n.enumerable});return e},Jn=e=>Vv(Po({},"__esModule",{value:!0}),e),bn,hr,Jr,ld,hm,mm=j(()=>{bn=new Map,hr=[],Jr=(e,t,r)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let n=bn.get(e);if(n===void 0)bn.set(e,{backend:t,priority:r});else{if(n.priority>r)return;if(n.priority===r&&n.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${r}`)}if(r>=0){let s=hr.indexOf(e);s!==-1&&hr.splice(s,1);for(let i=0;i<hr.length;i++)if(bn.get(hr[i]).priority<=r){hr.splice(i,0,e);return}hr.push(e)}return}throw new TypeError("not a valid backend")},ld=async e=>{let t=bn.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let r=!!t.initPromise;try{return r||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(n){return r||(t.error=`${n}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},hm=async e=>{let t=e.executionProviders||[],r=t.map(u=>typeof u=="string"?u:u.name),n=r.length===0?hr:r,s,i=[],a=new Set;for(let u of n){let l=await ld(u);typeof l=="string"?i.push({name:u,err:l}):(s||(s=l),s===l&&a.add(u))}if(!s)throw new Error(`no available backend found. ERR: ${i.map(u=>`[${u.name}] ${u.err}`).join(", ")}`);for(let{name:u,err:l}of i)r.includes(u)&&console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${l}`);let o=t.filter(u=>a.has(typeof u=="string"?u:u.name));return[s,new Proxy(e,{get:(u,l)=>l==="executionProviders"?o:Reflect.get(u,l)})]}}),Hv=j(()=>{mm()}),gm,Fv=j(()=>{gm="1.22.0"}),Ds,kt,_m=j(()=>{Fv(),Ds="warning",kt={wasm:{},webgl:{},webgpu:{},versions:{common:gm},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);Ds=e}},get logLevel(){return Ds}},Object.defineProperty(kt,"logLevel",{enumerable:!0})}),Le,Gv=j(()=>{_m(),Le=kt}),ym,bm,jv=j(()=>{ym=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);r.width=e.dims[3],r.height=e.dims[2];let n=r.getContext("2d");if(n!=null){let s,i;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(s=e.dims[2],i=e.dims[3]):(s=e.dims[3],i=e.dims[2]);let a=(t==null?void 0:t.format)!==void 0?t.format:"RGB",o=t==null?void 0:t.norm,u,l;o===void 0||o.mean===void 0?u=[255,255,255,255]:typeof o.mean=="number"?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(u[3]=o.mean[3])),o===void 0||o.bias===void 0?l=[0,0,0,0]:typeof o.bias=="number"?l=[o.bias,o.bias,o.bias,o.bias]:(l=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(l[3]=o.bias[3]));let c=i*s,p=0,h=c,m=c*2,g=-1;a==="RGBA"?(p=0,h=c,m=c*2,g=c*3):a==="RGB"?(p=0,h=c,m=c*2):a==="RBG"&&(p=0,m=c,h=c*2);for(let y=0;y<i;y++)for(let x=0;x<s;x++){let w=(e.data[p++]-l[0])*u[0],b=(e.data[h++]-l[1])*u[1],k=(e.data[m++]-l[2])*u[2],S=g===-1?255:(e.data[g++]-l[3])*u[3];n.fillStyle="rgba("+w+","+b+","+k+","+S+")",n.fillRect(x,y,1,1)}if("toDataURL"in r)return r.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},bm=(e,t)=>{let r=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),n;if(r!=null){let s,i,a;(t==null?void 0:t.tensorLayout)!==void 0&&t.tensorLayout==="NHWC"?(s=e.dims[2],i=e.dims[1],a=e.dims[3]):(s=e.dims[3],i=e.dims[2],a=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",u=t==null?void 0:t.norm,l,c;u===void 0||u.mean===void 0?l=[255,255,255,255]:typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],255],u.mean[3]!==void 0&&(l[3]=u.mean[3])),u===void 0||u.bias===void 0?c=[0,0,0,0]:typeof u.bias=="number"?c=[u.bias,u.bias,u.bias,u.bias]:(c=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(c[3]=u.bias[3]));let p=i*s;if(t!==void 0&&(t.format!==void 0&&a===4&&t.format!=="RGBA"||a===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let h=4,m=0,g=1,y=2,x=3,w=0,b=p,k=p*2,S=-1;o==="RGBA"?(w=0,b=p,k=p*2,S=p*3):o==="RGB"?(w=0,b=p,k=p*2):o==="RBG"&&(w=0,k=p,b=p*2),n=r.createImageData(s,i);for(let I=0;I<i*s;m+=h,g+=h,y+=h,x+=h,I++)n.data[m]=(e.data[w++]-c[0])*l[0],n.data[g]=(e.data[b++]-c[1])*l[1],n.data[y]=(e.data[k++]-c[2])*l[2],n.data[x]=S===-1?255:(e.data[S++]-c[3])*l[3]}else throw new Error("Can not access image data");return n}}),_i,wm,$m,vm,xm,Sm,Kv=j(()=>{Do(),_i=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:r,width:n}=t,s=t.norm??{mean:255,bias:0},i,a;typeof s.mean=="number"?i=[s.mean,s.mean,s.mean,s.mean]:i=[s.mean[0],s.mean[1],s.mean[2],s.mean[3]??255],typeof s.bias=="number"?a=[s.bias,s.bias,s.bias,s.bias]:a=[s.bias[0],s.bias[1],s.bias[2],s.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",u=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",l=r*n,c=u==="RGBA"?new Float32Array(l*4):new Float32Array(l*3),p=4,h=0,m=1,g=2,y=3,x=0,w=l,b=l*2,k=-1;o==="RGB"&&(p=3,h=0,m=1,g=2,y=-1),u==="RGBA"?k=l*3:u==="RBG"?(x=0,b=l,w=l*2):u==="BGR"&&(b=0,w=l,x=l*2);for(let S=0;S<l;S++,h+=p,g+=p,m+=p,y+=p)c[x++]=(e[h]+a[0])/i[0],c[w++]=(e[m]+a[1])/i[1],c[b++]=(e[g]+a[2])/i[2],k!==-1&&y!==-1&&(c[k++]=(e[y]+a[3])/i[3]);return u==="RGBA"?new $t("float32",c,[1,4,r,n]):new $t("float32",c,[1,3,r,n])},wm=async(e,t)=>{let r=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,n=typeof ImageData<"u"&&e instanceof ImageData,s=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,i=typeof e=="string",a,o=t??{},u=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},l=c=>typeof HTMLCanvasElement<"u"&&c instanceof HTMLCanvasElement||c instanceof OffscreenCanvas?c.getContext("2d"):null;if(r){let c=u();c.width=e.width,c.height=e.height;let p=l(c);if(p!=null){let h=e.height,m=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(h=t.resizedHeight,m=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=h,o.width=m}else o.tensorFormat="RGBA",o.height=h,o.width=m;p.drawImage(e,0,0),a=p.getImageData(0,0,m,h).data}else throw new Error("Can not access image data")}else if(n){let c,p;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(c=t.resizedHeight,p=t.resizedWidth):(c=e.height,p=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=c,o.width=p,t!==void 0){let h=u();h.width=p,h.height=c;let m=l(h);if(m!=null)m.putImageData(e,0,0),a=m.getImageData(0,0,p,c).data;else throw new Error("Can not access image data")}else a=e.data}else if(s){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let c=u();c.width=e.width,c.height=e.height;let p=l(c);if(p!=null){let h=e.height,m=e.width;return p.drawImage(e,0,0,m,h),a=p.getImageData(0,0,m,h).data,o.height=h,o.width=m,_i(a,o)}else throw new Error("Can not access image data")}else{if(i)return new Promise((c,p)=>{let h=u(),m=l(h);if(!e||!m)return p();let g=new Image;g.crossOrigin="Anonymous",g.src=e,g.onload=()=>{h.width=g.width,h.height=g.height,m.drawImage(g,0,0,h.width,h.height);let y=m.getImageData(0,0,h.width,h.height);o.height=h.height,o.width=h.width,c(_i(y.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(a!==void 0)return _i(a,o);throw new Error("Input data provided is not supported - aborted tensor creation")},$m=(e,t)=>{let{width:r,height:n,download:s,dispose:i}=t,a=[1,n,r,4];return new $t({location:"texture",type:"float32",texture:e,dims:a,download:s,dispose:i})},vm=(e,t)=>{let{dataType:r,dims:n,download:s,dispose:i}=t;return new $t({location:"gpu-buffer",type:r??"float32",gpuBuffer:e,dims:n,download:s,dispose:i})},xm=(e,t)=>{let{dataType:r,dims:n,download:s,dispose:i}=t;return new $t({location:"ml-tensor",type:r??"float32",mlTensor:e,dims:n,download:s,dispose:i})},Sm=(e,t,r)=>new $t({location:"cpu-pinned",type:e,data:t,dims:r??[t.length]})}),Mr,On,Us,km,Zv=j(()=>{Mr=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),On=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),Us=!1,km=()=>{if(!Us){Us=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,r=globalThis.Float16Array,n=typeof r<"u"&&r.from;e&&(Mr.set("int64",BigInt64Array),On.set(BigInt64Array,"int64")),t&&(Mr.set("uint64",BigUint64Array),On.set(BigUint64Array,"uint64")),n?(Mr.set("float16",r),On.set(r,"float16")):Mr.set("float16",Uint16Array)}}}),Tm,Em,Qv=j(()=>{Do(),Tm=e=>{let t=1;for(let r=0;r<e.length;r++){let n=e[r];if(typeof n!="number"||!Number.isSafeInteger(n))throw new TypeError(`dims[${r}] must be an integer, got: ${n}`);if(n<0)throw new RangeError(`dims[${r}] must be a non-negative integer, got: ${n}`);t*=n}return t},Em=(e,t)=>{switch(e.location){case"cpu":return new $t(e.type,e.data,t);case"cpu-pinned":return new $t({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new $t({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new $t({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new $t({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),$t,Do=j(()=>{jv(),Kv(),Zv(),Qv(),$t=class{constructor(e,t,r){km();let n,s;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,n=e.type,s=e.dims,e.location){case"cpu-pinned":{let a=Mr.get(n);if(!a)throw new TypeError(`unsupported type "${n}" to create tensor from pinned buffer`);if(!(e.data instanceof a))throw new TypeError(`buffer should be of type ${a.name}`);this.cpuData=e.data;break}case"texture":{if(n!=="float32")throw new TypeError(`unsupported type "${n}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(n!=="float32"&&n!=="float16"&&n!=="int32"&&n!=="int64"&&n!=="uint32"&&n!=="uint8"&&n!=="bool"&&n!=="uint4"&&n!=="int4")throw new TypeError(`unsupported type "${n}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(n!=="float32"&&n!=="float16"&&n!=="int32"&&n!=="int64"&&n!=="uint32"&&n!=="uint64"&&n!=="int8"&&n!=="uint8"&&n!=="bool"&&n!=="uint4"&&n!=="int4")throw new TypeError(`unsupported type "${n}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let a,o;if(typeof e=="string")if(n=e,o=r,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");a=t}else{let u=Mr.get(e);if(u===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&u===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${u.name} as data.`);e==="uint64"||e==="int64"?a=u.from(t,BigInt):a=u.from(t)}else if(t instanceof u)a=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")a=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&u!==Uint16Array)a=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${n} tensor's data must be type of ${u}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let u=typeof e[0];if(u==="string")n="string",a=e;else if(u==="boolean")n="bool",a=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${u}.`)}else if(e instanceof Uint8ClampedArray)n="uint8",a=Uint8Array.from(e);else{let u=On.get(e.constructor);if(u===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);n=u,a=e}if(o===void 0)o=[a.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");s=o,this.cpuData=a,this.dataLocation="cpu"}let i=Tm(s);if(this.cpuData&&i!==this.cpuData.length&&!((n==="uint4"||n==="int4")&&Math.ceil(i/2)===this.cpuData.length))throw new Error(`Tensor's size(${i}) does not match data length(${this.cpuData.length}).`);this.type=n,this.dims=s,this.size=i}static async fromImage(e,t){return wm(e,t)}static fromTexture(e,t){return $m(e,t)}static fromGpuBuffer(e,t){return vm(e,t)}static fromMLTensor(e,t){return xm(e,t)}static fromPinnedBuffer(e,t,r){return Sm(e,t,r)}toDataURL(e){return ym(this,e)}toImageData(e){return bm(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return Em(this,e)}}}),Mt,Im=j(()=>{Do(),Mt=$t}),Vi,Ws,Xt,Dt,Cm=j(()=>{_m(),Vi=(e,t)=>{(typeof kt.trace>"u"?!kt.wasm.trace:!kt.trace)||console.timeStamp(`${e}::ORT::${t}`)},Ws=(e,t)=>{var s;let r=((s=new Error().stack)==null?void 0:s.split(/\r\n|\r|\n/g))||[],n=!1;for(let i=0;i<r.length;i++){if(n&&!r[i].includes("TRACE_FUNC")){let a=`FUNC_${e}::${r[i].trim().split(" ")[1]}`;t&&(a+=`::${t}`),Vi("CPU",a);return}r[i].includes("TRACE_FUNC")&&(n=!0)}},Xt=e=>{(typeof kt.trace>"u"?!kt.wasm.trace:!kt.trace)||Ws("BEGIN",e)},Dt=e=>{(typeof kt.trace>"u"?!kt.wasm.trace:!kt.trace)||Ws("END",e)}}),zm,Xv=j(()=>{mm(),Im(),Cm(),zm=class Om{constructor(t){this.handler=t}async run(t,r,n){Xt();let s={},i={};if(typeof t!="object"||t===null||t instanceof Mt||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let a=!0;if(typeof r=="object"){if(r===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(r instanceof Mt)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(r)){if(r.length===0)throw new TypeError("'fetches' cannot be an empty array.");a=!1;for(let l of r){if(typeof l!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(l)===-1)throw new RangeError(`'fetches' contains invalid output name: ${l}.`);s[l]=null}if(typeof n=="object"&&n!==null)i=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else{let l=!1,c=Object.getOwnPropertyNames(r);for(let p of this.outputNames)if(c.indexOf(p)!==-1){let h=r[p];(h===null||h instanceof Mt)&&(l=!0,a=!1,s[p]=h)}if(l){if(typeof n=="object"&&n!==null)i=n;else if(typeof n<"u")throw new TypeError("'options' must be an object.")}else i=r}}else if(typeof r<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let l of this.inputNames)if(typeof t[l]>"u")throw new Error(`input '${l}' is missing in 'feeds'.`);if(a)for(let l of this.outputNames)s[l]=null;let o=await this.handler.run(t,s,i),u={};for(let l in o)if(Object.hasOwnProperty.call(o,l)){let c=o[l];c instanceof Mt?u[l]=c:u[l]=new Mt(c.type,c.data,c.dims)}return Dt(),u}async release(){return this.handler.dispose()}static async create(t,r,n,s){Xt();let i,a={};if(typeof t=="string"){if(i=t,typeof r=="object"&&r!==null)a=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(i=t,typeof r=="object"&&r!==null)a=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let c=t,p=0,h=t.byteLength;if(typeof r=="object"&&r!==null)a=r;else if(typeof r=="number"){if(p=r,!Number.isSafeInteger(p))throw new RangeError("'byteOffset' must be an integer.");if(p<0||p>=c.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${c.byteLength}).`);if(h=t.byteLength-p,typeof n=="number"){if(h=n,!Number.isSafeInteger(h))throw new RangeError("'byteLength' must be an integer.");if(h<=0||p+h>c.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${c.byteLength-p}].`);if(typeof s=="object"&&s!==null)a=s;else if(typeof s<"u")throw new TypeError("'options' must be an object.")}else if(typeof n<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof r<"u")throw new TypeError("'options' must be an object.");i=new Uint8Array(c,p,h)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await hm(a),l=await o.createInferenceSessionHandler(i,u);return Dt(),new Om(l)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),Uo,Yv=j(()=>{Xv(),Uo=zm}),Jv=j(()=>{}),e1=j(()=>{}),t1=j(()=>{}),r1=j(()=>{}),n1={};cn(n1,{InferenceSession:()=>Uo,TRACE:()=>Vi,TRACE_FUNC_BEGIN:()=>Xt,TRACE_FUNC_END:()=>Dt,Tensor:()=>Mt,env:()=>Le,registerBackend:()=>Jr});var Wt=j(()=>{Hv(),Gv(),Yv(),Im(),Jv(),e1(),Cm(),t1(),r1()}),Wo=j(()=>{}),Am={};cn(Am,{default:()=>Rm});var qs,Ls,Rm,i1=j(()=>{var e;Dy(),Fr(),qo(),qs="ort-wasm-proxy-worker",Ls=((e=globalThis.self)==null?void 0:e.name)===qs,Ls&&(self.onmessage=t=>{let{type:r,in:n}=t.data;try{switch(r){case"init-wasm":Lo(n.wasm).then(()=>{su(n).then(()=>{postMessage({type:r})},s=>{postMessage({type:r,err:s})})},s=>{postMessage({type:r,err:s})});break;case"init-ep":{let{epName:s,env:i}=n;au(i,s).then(()=>{postMessage({type:r})},a=>{postMessage({type:r,err:a})});break}case"copy-from":{let{buffer:s}=n,i=Qi(s);postMessage({type:r,out:i});break}case"create":{let{model:s,options:i}=n;ou(s,i).then(a=>{postMessage({type:r,out:a})},a=>{postMessage({type:r,err:a})});break}case"release":uu(n),postMessage({type:r});break;case"run":{let{sessionId:s,inputIndices:i,inputs:a,outputIndices:o,options:u}=n;lu(s,i,a,o,new Array(o.length).fill(null),u).then(l=>{l.some(c=>c[3]!=="cpu")?postMessage({type:r,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:r,out:l},cu([...a,...l]))},l=>{postMessage({type:r,err:l})});break}case"end-profiling":du(n),postMessage({type:r});break;default:}}catch(s){postMessage({type:r,err:s})}}),Rm=Ls?null:t=>new Worker(t??yt,{type:"module",name:qs})}),Bm={};cn(Bm,{default:()=>Mm});var Vs,Hs,Mm,dd,s1=j(()=>{var e,t;Hs=(Vs=import.meta.url,async function(r={}){var _l;var n,s,i=r,a=new Promise((d,f)=>{n=d,s=f}),o=typeof window=="object",u=typeof WorkerGlobalScope<"u",l=u&&((_l=self.name)==null?void 0:_l.startsWith("em-pthread"));i.mountExternalData=(d,f)=>{d.startsWith("./")&&(d=d.substring(2)),(i.Fb||(i.Fb=new Map)).set(d,f)},i.unmountExternalData=()=>{delete i.Fb};var c=globalThis.SharedArrayBuffer??new WebAssembly.Memory({initial:0,maximum:0,qc:!0}).buffer.constructor;let p=d=>async(...f)=>{var _;try{if(i.Gb)throw Error("Session already started");let $=i.Gb={ec:f[0],errors:[]},v=await d(...f);if(i.Gb!==$)throw Error("Session mismatch");(_=i.Kb)==null||_.flush();let C=$.errors;if(0<C.length){let D=await Promise.all(C);if(D=D.filter(F=>F),0<D.length)throw Error(D.join(`
`))}return v}finally{i.Gb=null}};i.jsepInit=(d,f)=>{if(d==="webgpu"){[i.Kb,i.Vb,i.Zb,i.Lb,i.Yb,i.kb,i.$b,i.bc,i.Wb,i.Xb,i.ac]=f;let _=i.Kb;i.jsepRegisterBuffer=($,v,C,D)=>_.registerBuffer($,v,C,D),i.jsepGetBuffer=$=>_.getBuffer($),i.jsepCreateDownloader=($,v,C)=>_.createDownloader($,v,C),i.jsepOnCreateSession=$=>{_.onCreateSession($)},i.jsepOnReleaseSession=$=>{_.onReleaseSession($)},i.jsepOnRunStart=$=>_.onRunStart($),i.cc=($,v)=>{_.upload($,v)}}else if(d==="webnn"){let _=f[0];[i.oc,i.Ob,i.webnnEnsureTensor,i.Pb,i.webnnDownloadTensor]=f.slice(1),i.webnnReleaseTensorId=i.Ob,i.webnnUploadTensor=i.Pb,i.webnnOnRunStart=$=>_.onRunStart($),i.webnnOnRunEnd=_.onRunEnd.bind(_),i.webnnRegisterMLContext=($,v)=>{_.registerMLContext($,v)},i.webnnOnReleaseSession=$=>{_.onReleaseSession($)},i.webnnCreateMLTensorDownloader=($,v)=>_.createMLTensorDownloader($,v),i.webnnRegisterMLTensor=($,v,C,D)=>_.registerMLTensor($,v,C,D),i.webnnCreateMLContext=$=>_.createMLContext($),i.webnnRegisterMLConstant=($,v,C,D,F,re)=>_.registerMLConstant($,v,C,D,F,i.Fb,re),i.webnnRegisterGraphInput=_.registerGraphInput.bind(_),i.webnnIsGraphInput=_.isGraphInput.bind(_),i.webnnRegisterGraphOutput=_.registerGraphOutput.bind(_),i.webnnIsGraphOutput=_.isGraphOutput.bind(_),i.webnnCreateTemporaryTensor=_.createTemporaryTensor.bind(_),i.webnnIsGraphInputOutputTypeSupported=_.isGraphInputOutputTypeSupported.bind(_)}};let h=()=>{let d=(f,_,$)=>(...v)=>{let C=Lt,D=_==null?void 0:_();v=f(...v);let F=_==null?void 0:_();return D!==F&&(f=F,$(D),_=$=null),Lt!=C?new Promise((re,fe)=>{gs={resolve:re,reject:fe}}):v};(()=>{for(let f of["_OrtAppendExecutionProvider","_OrtCreateSession","_OrtRun","_OrtRunWithBinding","_OrtBindInput"])i[f]=d(i[f],()=>i[f],_=>i[f]=_)})(),p!==void 0&&(i._OrtRun=p(i._OrtRun),i._OrtRunWithBinding=p(i._OrtRunWithBinding)),h=void 0};i.asyncInit=()=>{h==null||h()};var m,g,y=Object.assign({},i),x=(d,f)=>{throw f},w="";(o||u)&&(u?w=self.location.href:typeof document<"u"&&document.currentScript&&(w=document.currentScript.src),Vs&&(w=Vs),w=w.startsWith("blob:")?"":w.slice(0,w.replace(/[?#].*/,"").lastIndexOf("/")+1),u&&(g=d=>{var f=new XMLHttpRequest;return f.open("GET",d,!1),f.responseType="arraybuffer",f.send(null),new Uint8Array(f.response)}),m=async d=>{if(P(d))return new Promise((_,$)=>{var v=new XMLHttpRequest;v.open("GET",d,!0),v.responseType="arraybuffer",v.onload=()=>{v.status==200||v.status==0&&v.response?_(v.response):$(v.status)},v.onerror=$,v.send(null)});var f=await fetch(d,{credentials:"same-origin"});if(f.ok)return f.arrayBuffer();throw Error(f.status+" : "+f.url)});var b=console.log.bind(console),k=console.error.bind(console),S=b,I=k;Object.assign(i,y),y=null;var z,O,R,N,G,ue,ne,se,Se,_e,Q,ie,K,de=i.wasmBinary,Re=!1,P=d=>d.startsWith("file://");function H(){return z.buffer!=N.buffer&&T(),N}function Y(){return z.buffer!=N.buffer&&T(),G}function ge(){return z.buffer!=N.buffer&&T(),ue}function Ze(){return z.buffer!=N.buffer&&T(),ne}function W(){return z.buffer!=N.buffer&&T(),se}function M(){return z.buffer!=N.buffer&&T(),Se}function ae(){return z.buffer!=N.buffer&&T(),_e}function X(){return z.buffer!=N.buffer&&T(),K}if(l){let d=function(f){try{var _=f.data,$=_.Cb;if($==="load"){let v=[];self.onmessage=C=>v.push(C),self.startWorker=()=>{postMessage({Cb:"loaded"});for(let C of v)d(C);self.onmessage=d};for(let C of _.Sb)i[C]&&!i[C].proxy||(i[C]=(...D)=>{postMessage({Cb:"callHandler",Rb:C,args:D})},C=="print"&&(S=i[C]),C=="printErr"&&(I=i[C]));z=_.lc,T(),le(_.mc)}else if($==="run"){Xy(_.Bb),ws(_.Bb,0,0,1,0,0),fn(),hs(_.Bb),Ce||(sl(),Ce=!0);try{Yy(_.hc,_.Ib)}catch(v){if(v!="unwind")throw v}}else _.target!=="setimmediate"&&($==="checkMailbox"?Ce&&ni():$&&(I(`worker: received unknown command ${$}`),I(_)))}catch(v){throw al(),v}};var le,Ce=!1;I=function(...f){f=f.join(" "),console.error(f)},self.alert=function(...f){postMessage({Cb:"alert",text:f.join(" "),jc:ci()})},self.onunhandledrejection=f=>{throw f.reason||f},self.onmessage=d}function T(){var d=z.buffer;i.HEAP8=N=new Int8Array(d),i.HEAP16=ue=new Int16Array(d),i.HEAPU8=G=new Uint8Array(d),i.HEAPU16=ne=new Uint16Array(d),i.HEAP32=se=new Int32Array(d),i.HEAPU32=Se=new Uint32Array(d),i.HEAPF32=_e=new Float32Array(d),i.HEAPF64=K=new Float64Array(d),i.HEAP64=Q=new BigInt64Array(d),i.HEAPU64=ie=new BigUint64Array(d)}function E(){l?startWorker(i):me.Da()}l||(z=new WebAssembly.Memory({initial:256,maximum:65536,shared:!0}),T());var A,q=0,L=null;function V(){if(--q==0&&L){var d=L;L=null,d()}}function ee(d){throw I(d="Aborted("+d+")"),Re=!0,d=new WebAssembly.RuntimeError(d+". Build with -sASSERTIONS for more info."),s(d),d}function te(){return{a:{L:$e,Aa:Z,b:e0,$:mu,A:yu,pa:bu,X:$u,Z:vu,qa:xu,na:Su,ga:ku,ma:Tu,J:Eu,Y:Iu,V:Cu,oa:zu,W:Ou,va:t0,E:r0,Q:n0,O:s0,D:o0,v:u0,r:l0,P:d0,z:_0,R:y0,ja:b0,T:w0,aa:$0,M:v0,F:x0,ia:hs,sa:S0,t:k0,Ca:T0,w:C0,o:z0,m:A0,c:cs,Ba:R0,n:B0,j:P0,u:D0,p:U0,f:W0,s:q0,l:L0,e:V0,k:H0,h:F0,g:G0,d:j0,da:K0,ea:Z0,fa:Q0,ba:Fu,ca:Gu,N:ju,xa:Y0,ua:eb,i:tb,C:rb,G:nb,ta:J0,x:ib,ra:sb,U:ab,q:X0,y:ob,K:ub,S:lb,za:db,ya:cb,ka:Xu,la:Yu,_:mt,B:Ju,I:el,ha:tl,H:rl,a:z,wa:rt}}}var J={840156:(d,f,_,$,v)=>{if(i===void 0||!i.Fb)return 1;if((d=Xe(Number(d>>>0))).startsWith("./")&&(d=d.substring(2)),!(d=i.Fb.get(d)))return 2;if(f=Number(f>>>0),_=Number(_>>>0),$=Number($>>>0),f+_>d.byteLength)return 3;try{let C=d.subarray(f,f+_);switch(v){case 0:Y().set(C,$>>>0);break;case 1:i.nc?i.nc($,C):i.cc($,C);break;default:return 4}return 0}catch{return 4}},840980:(d,f,_)=>{i.Pb(d,Y().subarray(f>>>0,f+_>>>0))},841044:()=>i.oc(),841086:d=>{i.Ob(d)},841123:()=>{i.Wb()},841154:()=>{i.Xb()},841183:()=>{i.ac()},841208:d=>i.Vb(d),841241:d=>i.Zb(d),841273:(d,f,_)=>{i.Lb(Number(d),Number(f),Number(_),!0)},841336:(d,f,_)=>{i.Lb(Number(d),Number(f),Number(_))},841393:()=>typeof wasmOffsetConverter<"u",841450:d=>{i.kb("Abs",d,void 0)},841501:d=>{i.kb("Neg",d,void 0)},841552:d=>{i.kb("Floor",d,void 0)},841605:d=>{i.kb("Ceil",d,void 0)},841657:d=>{i.kb("Reciprocal",d,void 0)},841715:d=>{i.kb("Sqrt",d,void 0)},841767:d=>{i.kb("Exp",d,void 0)},841818:d=>{i.kb("Erf",d,void 0)},841869:d=>{i.kb("Sigmoid",d,void 0)},841924:(d,f,_)=>{i.kb("HardSigmoid",d,{alpha:f,beta:_})},842003:d=>{i.kb("Log",d,void 0)},842054:d=>{i.kb("Sin",d,void 0)},842105:d=>{i.kb("Cos",d,void 0)},842156:d=>{i.kb("Tan",d,void 0)},842207:d=>{i.kb("Asin",d,void 0)},842259:d=>{i.kb("Acos",d,void 0)},842311:d=>{i.kb("Atan",d,void 0)},842363:d=>{i.kb("Sinh",d,void 0)},842415:d=>{i.kb("Cosh",d,void 0)},842467:d=>{i.kb("Asinh",d,void 0)},842520:d=>{i.kb("Acosh",d,void 0)},842573:d=>{i.kb("Atanh",d,void 0)},842626:d=>{i.kb("Tanh",d,void 0)},842678:d=>{i.kb("Not",d,void 0)},842729:(d,f,_)=>{i.kb("Clip",d,{min:f,max:_})},842798:d=>{i.kb("Clip",d,void 0)},842850:(d,f)=>{i.kb("Elu",d,{alpha:f})},842908:d=>{i.kb("Gelu",d,void 0)},842960:d=>{i.kb("Relu",d,void 0)},843012:(d,f)=>{i.kb("LeakyRelu",d,{alpha:f})},843076:(d,f)=>{i.kb("ThresholdedRelu",d,{alpha:f})},843146:(d,f)=>{i.kb("Cast",d,{to:f})},843204:d=>{i.kb("Add",d,void 0)},843255:d=>{i.kb("Sub",d,void 0)},843306:d=>{i.kb("Mul",d,void 0)},843357:d=>{i.kb("Div",d,void 0)},843408:d=>{i.kb("Pow",d,void 0)},843459:d=>{i.kb("Equal",d,void 0)},843512:d=>{i.kb("Greater",d,void 0)},843567:d=>{i.kb("GreaterOrEqual",d,void 0)},843629:d=>{i.kb("Less",d,void 0)},843681:d=>{i.kb("LessOrEqual",d,void 0)},843740:(d,f,_,$,v)=>{i.kb("ReduceMean",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},843915:(d,f,_,$,v)=>{i.kb("ReduceMax",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},844089:(d,f,_,$,v)=>{i.kb("ReduceMin",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},844263:(d,f,_,$,v)=>{i.kb("ReduceProd",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},844438:(d,f,_,$,v)=>{i.kb("ReduceSum",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},844612:(d,f,_,$,v)=>{i.kb("ReduceL1",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},844785:(d,f,_,$,v)=>{i.kb("ReduceL2",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},844958:(d,f,_,$,v)=>{i.kb("ReduceLogSum",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},845135:(d,f,_,$,v)=>{i.kb("ReduceSumSquare",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},845315:(d,f,_,$,v)=>{i.kb("ReduceLogSumExp",d,{keepDims:!!f,noopWithEmptyAxes:!!_,axes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},845495:d=>{i.kb("Where",d,void 0)},845548:(d,f,_)=>{i.kb("Transpose",d,{perm:f?Array.from(W().subarray(Number(f)>>>0,Number(_)>>>0)):[]})},845672:(d,f,_,$)=>{i.kb("DepthToSpace",d,{blocksize:f,mode:Xe(_),format:$?"NHWC":"NCHW"})},845805:(d,f,_,$)=>{i.kb("DepthToSpace",d,{blocksize:f,mode:Xe(_),format:$?"NHWC":"NCHW"})},845938:(d,f,_,$,v,C,D,F,re,fe,Te,Be,qe,it,Kr)=>{i.kb("ConvTranspose",d,{format:re?"NHWC":"NCHW",autoPad:f,dilations:[_],group:$,kernelShape:[v],pads:[C,D],strides:[F],wIsConst:()=>!!H()[fe>>>0],outputPadding:Te?Array.from(W().subarray(Number(Te)>>>0,Number(Be)>>>0)):[],outputShape:qe?Array.from(W().subarray(Number(qe)>>>0,Number(it)>>>0)):[],activation:Xe(Kr)})},846371:(d,f,_,$,v,C,D,F,re,fe,Te,Be,qe,it)=>{i.kb("ConvTranspose",d,{format:F?"NHWC":"NCHW",autoPad:f,dilations:Array.from(W().subarray(Number(_)>>>0,2+(Number(_)>>>0)>>>0)),group:$,kernelShape:Array.from(W().subarray(Number(v)>>>0,2+(Number(v)>>>0)>>>0)),pads:Array.from(W().subarray(Number(C)>>>0,4+(Number(C)>>>0)>>>0)),strides:Array.from(W().subarray(Number(D)>>>0,2+(Number(D)>>>0)>>>0)),wIsConst:()=>!!H()[re>>>0],outputPadding:fe?Array.from(W().subarray(Number(fe)>>>0,Number(Te)>>>0)):[],outputShape:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[],activation:Xe(it)})},847032:(d,f,_,$,v,C,D,F,re,fe,Te,Be,qe,it,Kr)=>{i.kb("ConvTranspose",d,{format:re?"NHWC":"NCHW",autoPad:f,dilations:[_],group:$,kernelShape:[v],pads:[C,D],strides:[F],wIsConst:()=>!!H()[fe>>>0],outputPadding:Te?Array.from(W().subarray(Number(Te)>>>0,Number(Be)>>>0)):[],outputShape:qe?Array.from(W().subarray(Number(qe)>>>0,Number(it)>>>0)):[],activation:Xe(Kr)})},847465:(d,f,_,$,v,C,D,F,re,fe,Te,Be,qe,it)=>{i.kb("ConvTranspose",d,{format:F?"NHWC":"NCHW",autoPad:f,dilations:Array.from(W().subarray(Number(_)>>>0,2+(Number(_)>>>0)>>>0)),group:$,kernelShape:Array.from(W().subarray(Number(v)>>>0,2+(Number(v)>>>0)>>>0)),pads:Array.from(W().subarray(Number(C)>>>0,4+(Number(C)>>>0)>>>0)),strides:Array.from(W().subarray(Number(D)>>>0,2+(Number(D)>>>0)>>>0)),wIsConst:()=>!!H()[re>>>0],outputPadding:fe?Array.from(W().subarray(Number(fe)>>>0,Number(Te)>>>0)):[],outputShape:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[],activation:Xe(it)})},848126:(d,f)=>{i.kb("GlobalAveragePool",d,{format:f?"NHWC":"NCHW"})},848217:(d,f,_,$,v,C,D,F,re,fe,Te,Be,qe,it)=>{i.kb("AveragePool",d,{format:it?"NHWC":"NCHW",auto_pad:f,ceil_mode:_,count_include_pad:$,storage_order:v,dilations:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],kernel_shape:F?Array.from(W().subarray(Number(F)>>>0,Number(re)>>>0)):[],pads:fe?Array.from(W().subarray(Number(fe)>>>0,Number(Te)>>>0)):[],strides:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[]})},848696:(d,f)=>{i.kb("GlobalAveragePool",d,{format:f?"NHWC":"NCHW"})},848787:(d,f,_,$,v,C,D,F,re,fe,Te,Be,qe,it)=>{i.kb("AveragePool",d,{format:it?"NHWC":"NCHW",auto_pad:f,ceil_mode:_,count_include_pad:$,storage_order:v,dilations:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],kernel_shape:F?Array.from(W().subarray(Number(F)>>>0,Number(re)>>>0)):[],pads:fe?Array.from(W().subarray(Number(fe)>>>0,Number(Te)>>>0)):[],strides:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[]})},849266:(d,f)=>{i.kb("GlobalMaxPool",d,{format:f?"NHWC":"NCHW"})},849353:(d,f,_,$,v,C,D,F,re,fe,Te,Be,qe,it)=>{i.kb("MaxPool",d,{format:it?"NHWC":"NCHW",auto_pad:f,ceil_mode:_,count_include_pad:$,storage_order:v,dilations:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],kernel_shape:F?Array.from(W().subarray(Number(F)>>>0,Number(re)>>>0)):[],pads:fe?Array.from(W().subarray(Number(fe)>>>0,Number(Te)>>>0)):[],strides:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[]})},849828:(d,f)=>{i.kb("GlobalMaxPool",d,{format:f?"NHWC":"NCHW"})},849915:(d,f,_,$,v,C,D,F,re,fe,Te,Be,qe,it)=>{i.kb("MaxPool",d,{format:it?"NHWC":"NCHW",auto_pad:f,ceil_mode:_,count_include_pad:$,storage_order:v,dilations:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],kernel_shape:F?Array.from(W().subarray(Number(F)>>>0,Number(re)>>>0)):[],pads:fe?Array.from(W().subarray(Number(fe)>>>0,Number(Te)>>>0)):[],strides:Be?Array.from(W().subarray(Number(Be)>>>0,Number(qe)>>>0)):[]})},850390:(d,f,_,$,v)=>{i.kb("Gemm",d,{alpha:f,beta:_,transA:$,transB:v})},850494:d=>{i.kb("MatMul",d,void 0)},850548:(d,f,_,$)=>{i.kb("ArgMax",d,{keepDims:!!f,selectLastIndex:!!_,axis:$})},850656:(d,f,_,$)=>{i.kb("ArgMin",d,{keepDims:!!f,selectLastIndex:!!_,axis:$})},850764:(d,f)=>{i.kb("Softmax",d,{axis:f})},850827:(d,f)=>{i.kb("Concat",d,{axis:f})},850887:(d,f,_,$,v)=>{i.kb("Split",d,{axis:f,numOutputs:_,splitSizes:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},851043:d=>{i.kb("Expand",d,void 0)},851097:(d,f)=>{i.kb("Gather",d,{axis:Number(f)})},851168:(d,f)=>{i.kb("GatherElements",d,{axis:Number(f)})},851247:(d,f)=>{i.kb("GatherND",d,{batch_dims:Number(f)})},851326:(d,f,_,$,v,C,D,F,re,fe,Te)=>{i.kb("Resize",d,{antialias:f,axes:_?Array.from(W().subarray(Number(_)>>>0,Number($)>>>0)):[],coordinateTransformMode:Xe(v),cubicCoeffA:C,excludeOutside:D,extrapolationValue:F,keepAspectRatioPolicy:Xe(re),mode:Xe(fe),nearestMode:Xe(Te)})},851688:(d,f,_,$,v,C,D)=>{i.kb("Slice",d,{starts:f?Array.from(W().subarray(Number(f)>>>0,Number(_)>>>0)):[],ends:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[],axes:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[]})},851952:d=>{i.kb("Tile",d,void 0)},852004:(d,f,_)=>{i.kb("InstanceNormalization",d,{epsilon:f,format:_?"NHWC":"NCHW"})},852118:(d,f,_)=>{i.kb("InstanceNormalization",d,{epsilon:f,format:_?"NHWC":"NCHW"})},852232:d=>{i.kb("Range",d,void 0)},852285:(d,f)=>{i.kb("Einsum",d,{equation:Xe(f)})},852366:(d,f,_,$,v)=>{i.kb("Pad",d,{mode:f,value:_,pads:$?Array.from(W().subarray(Number($)>>>0,Number(v)>>>0)):[]})},852509:(d,f,_,$,v,C)=>{i.kb("BatchNormalization",d,{epsilon:f,momentum:_,spatial:!!v,trainingMode:!!$,format:C?"NHWC":"NCHW"})},852678:(d,f,_,$,v,C)=>{i.kb("BatchNormalization",d,{epsilon:f,momentum:_,spatial:!!v,trainingMode:!!$,format:C?"NHWC":"NCHW"})},852847:(d,f,_)=>{i.kb("CumSum",d,{exclusive:Number(f),reverse:Number(_)})},852944:(d,f,_)=>{i.kb("DequantizeLinear",d,{axis:f,blockSize:_})},853034:(d,f,_,$,v)=>{i.kb("GridSample",d,{align_corners:f,mode:Xe(_),padding_mode:Xe($),format:v?"NHWC":"NCHW"})},853204:(d,f,_,$,v)=>{i.kb("GridSample",d,{align_corners:f,mode:Xe(_),padding_mode:Xe($),format:v?"NHWC":"NCHW"})},853374:(d,f)=>{i.kb("ScatterND",d,{reduction:Xe(f)})},853459:(d,f,_,$,v,C,D,F,re)=>{i.kb("Attention",d,{numHeads:f,isUnidirectional:_,maskFilterValue:$,scale:v,doRotary:C,qkvHiddenSizes:D?Array.from(W().subarray(Number(F)>>>0,Number(F)+D>>>0)):[],pastPresentShareBuffer:!!re})},853731:d=>{i.kb("BiasAdd",d,void 0)},853786:d=>{i.kb("BiasSplitGelu",d,void 0)},853847:d=>{i.kb("FastGelu",d,void 0)},853903:(d,f,_,$,v,C,D,F,re,fe,Te,Be,qe,it,Kr,hb)=>{i.kb("Conv",d,{format:Be?"NHWC":"NCHW",auto_pad:f,dilations:_?Array.from(W().subarray(Number(_)>>>0,Number($)>>>0)):[],group:v,kernel_shape:C?Array.from(W().subarray(Number(C)>>>0,Number(D)>>>0)):[],pads:F?Array.from(W().subarray(Number(F)>>>0,Number(re)>>>0)):[],strides:fe?Array.from(W().subarray(Number(fe)>>>0,Number(Te)>>>0)):[],w_is_const:()=>!!H()[Number(qe)>>>0],activation:Xe(it),activation_params:Kr?Array.from(ae().subarray(Number(Kr)>>>0,Number(hb)>>>0)):[]})},854487:d=>{i.kb("Gelu",d,void 0)},854539:(d,f,_,$,v,C,D,F,re)=>{i.kb("GroupQueryAttention",d,{numHeads:f,kvNumHeads:_,scale:$,softcap:v,doRotary:C,rotaryInterleaved:D,smoothSoftmax:F,localWindowSize:re})},854756:(d,f,_,$)=>{i.kb("LayerNormalization",d,{axis:f,epsilon:_,simplified:!!$})},854867:(d,f,_,$)=>{i.kb("LayerNormalization",d,{axis:f,epsilon:_,simplified:!!$})},854978:(d,f,_,$,v,C)=>{i.kb("MatMulNBits",d,{k:f,n:_,accuracyLevel:$,bits:v,blockSize:C})},855105:(d,f,_,$,v,C)=>{i.kb("MultiHeadAttention",d,{numHeads:f,isUnidirectional:_,maskFilterValue:$,scale:v,doRotary:C})},855264:(d,f)=>{i.kb("QuickGelu",d,{alpha:f})},855328:(d,f,_,$,v)=>{i.kb("RotaryEmbedding",d,{interleaved:!!f,numHeads:_,rotaryEmbeddingDim:$,scale:v})},855467:(d,f,_)=>{i.kb("SkipLayerNormalization",d,{epsilon:f,simplified:!!_})},855569:(d,f,_)=>{i.kb("SkipLayerNormalization",d,{epsilon:f,simplified:!!_})},855671:(d,f,_,$)=>{i.kb("GatherBlockQuantized",d,{gatherAxis:f,quantizeAxis:_,blockSize:$})},855792:d=>{i.$b(d)},855826:(d,f)=>i.bc(Number(d),Number(f),i.Gb.ec,i.Gb.errors)};function Z(d,f,_){return Uu(async()=>{await i.Yb(Number(d),Number(f),Number(_))})}function $e(){return typeof wasmOffsetConverter<"u"}class oe{constructor(f){yl(this,"name","ExitStatus");this.message=`Program terminated with exit(${f})`,this.status=f}}var ye=d=>{d.terminate(),d.onmessage=()=>{}},ve=[],ze=d=>{Ye.length==0&&(fu(),pu(Ye[0]));var f=Ye.pop();if(!f)return 6;Et.push(f),Qe[d.Bb]=f,f.Bb=d.Bb;var _={Cb:"run",hc:d.fc,Ib:d.Ib,Bb:d.Bb};return f.postMessage(_,d.Nb),0},Ae=0,be=(d,f,..._)=>{for(var $=2*_.length,v=xs(),C=vs(8*$),D=C>>>3,F=0;F<_.length;F++){var re=_[F];typeof re=="bigint"?(Q[D+2*F]=1n,Q[D+2*F+1]=re):(Q[D+2*F]=0n,X()[D+2*F+1>>>0]=re)}return d=ol(d,0,$,C,f),fi(v),d};function rt(d){if(l)return be(0,1,d);if(R=d,!(0<Ae)){for(var f of Et)ye(f);for(f of Ye)ye(f);Ye=[],Et=[],Qe={},Re=!0}x(0,new oe(d))}function nt(d){if(l)return be(1,0,d);mt(d)}var mt=d=>{if(R=d,l)throw nt(d),"unwind";rt(d)},Ye=[],Et=[],pn=[],Qe={},_t=d=>{var f=d.Bb;delete Qe[f],Ye.push(d),Et.splice(Et.indexOf(d),1),d.Bb=0,ul(f)};function fn(){pn.forEach(d=>d())}var pu=d=>new Promise(f=>{d.onmessage=v=>{var C=(v=v.data).Cb;if(v.Hb&&v.Hb!=ci()){var D=Qe[v.Hb];D?D.postMessage(v,v.Nb):I(`Internal error! Worker sent a message "${C}" to target pthread ${v.Hb}, but that thread no longer exists!`)}else C==="checkMailbox"?ni():C==="spawnThread"?ze(v):C==="cleanupThread"?_t(Qe[v.ic]):C==="loaded"?(d.loaded=!0,f(d)):C==="alert"?alert(`Thread ${v.jc}: ${v.text}`):v.target==="setimmediate"?d.postMessage(v):C==="callHandler"?i[v.Rb](...v.args):C&&I(`worker sent an unknown command ${C}`)},d.onerror=v=>{throw I(`worker sent an error! ${v.filename}:${v.lineno}: ${v.message}`),v};var _,$=[];for(_ of[])i.propertyIsEnumerable(_)&&$.push(_);d.postMessage({Cb:"load",Sb:$,lc:z,mc:O})});function fu(){var d=new Worker((()=>{let f=URL;return import.meta.url>"file:"&&import.meta.url<"file;"?new f("ort.webgpu.bundle.min.mjs",import.meta.url):new URL(import.meta.url)})(),{type:"module",workerData:"em-pthread",name:"em-pthread"});Ye.push(d)}var Xy=d=>{T();var f=M()[d+52>>>2>>>0];d=M()[d+56>>>2>>>0],cl(f,f-d),fi(f)},Yy=(d,f)=>{Ae=0,d=pl(d,f),0<Ae?R=d:$s(d)};class Jy{constructor(f){this.Jb=f-24}}function e0(d,f,_){var $=new Jy(d>>>=0);throw f>>>=0,_>>>=0,M()[$.Jb+16>>>2>>>0]=0,M()[$.Jb+4>>>2>>>0]=f,M()[$.Jb+8>>>2>>>0]=_,d}function hu(d,f,_,$){return l?be(2,1,d,f,_,$):mu(d,f,_,$)}function mu(d,f,_,$){if(d>>>=0,_>>>=0,$>>>=0,c===void 0)return 6;var v=[];return l&&v.length===0?hu(d,f>>>=0,_,$):(d={fc:_,Bb:d,Ib:$,Nb:v},l?(d.Cb="spawnThread",postMessage(d,v),0):ze(d))}var gu=typeof TextDecoder<"u"?new TextDecoder:void 0,_u=(d,f=0,_=NaN)=>{var $=(f>>>=0)+_;for(_=f;d[_]&&!(_>=$);)++_;if(16<_-f&&d.buffer&&gu)return gu.decode(d.buffer instanceof ArrayBuffer?d.subarray(f,_):d.slice(f,_));for($="";f<_;){var v=d[f++];if(128&v){var C=63&d[f++];if((224&v)==192)$+=String.fromCharCode((31&v)<<6|C);else{var D=63&d[f++];65536>(v=(240&v)==224?(15&v)<<12|C<<6|D:(7&v)<<18|C<<12|D<<6|63&d[f++])?$+=String.fromCharCode(v):(v-=65536,$+=String.fromCharCode(55296|v>>10,56320|1023&v))}}else $+=String.fromCharCode(v)}return $},Xe=(d,f)=>(d>>>=0)?_u(Y(),d,f):"";function yu(d,f,_){return l?be(3,1,d,f,_):0}function bu(d,f){if(l)return be(4,1,d,f)}var wu=d=>{for(var f=0,_=0;_<d.length;++_){var $=d.charCodeAt(_);127>=$?f++:2047>=$?f+=2:55296<=$&&57343>=$?(f+=4,++_):f+=3}return f},jr=(d,f,_)=>{var $=Y();if(f>>>=0,0<_){var v=f;_=f+_-1;for(var C=0;C<d.length;++C){var D=d.charCodeAt(C);if(55296<=D&&57343>=D&&(D=65536+((1023&D)<<10)|1023&d.charCodeAt(++C)),127>=D){if(f>=_)break;$[f++>>>0]=D}else{if(2047>=D){if(f+1>=_)break;$[f++>>>0]=192|D>>6}else{if(65535>=D){if(f+2>=_)break;$[f++>>>0]=224|D>>12}else{if(f+3>=_)break;$[f++>>>0]=240|D>>18,$[f++>>>0]=128|D>>12&63}$[f++>>>0]=128|D>>6&63}$[f++>>>0]=128|63&D}}$[f>>>0]=0,d=f-v}else d=0;return d};function $u(d,f){if(l)return be(5,1,d,f)}function vu(d,f,_){if(l)return be(6,1,d,f,_)}function xu(d,f,_){return l?be(7,1,d,f,_):0}function Su(d,f){if(l)return be(8,1,d,f)}function ku(d,f,_){if(l)return be(9,1,d,f,_)}function Tu(d,f,_,$){if(l)return be(10,1,d,f,_,$)}function Eu(d,f,_,$){if(l)return be(11,1,d,f,_,$)}function Iu(d,f,_,$){if(l)return be(12,1,d,f,_,$)}function Cu(d){if(l)return be(13,1,d)}function zu(d,f){if(l)return be(14,1,d,f)}function Ou(d,f,_){if(l)return be(15,1,d,f,_)}var Au,dr,t0=()=>ee(""),qt=d=>{for(var f="";Y()[d>>>0];)f+=Au[Y()[d++>>>0]];return f},us={},ls={};function Yt(d,f,_={}){return function($,v,C={}){var D=v.name;if(!$)throw new dr(`type "${D}" must have a positive integer typeid pointer`);if(ls.hasOwnProperty($)){if(C.Tb)return;throw new dr(`Cannot register type '${D}' twice`)}ls[$]=v,us.hasOwnProperty($)&&(v=us[$],delete us[$],v.forEach(F=>F()))}(d,f,_)}var Ru=(d,f,_)=>{switch(f){case 1:return _?$=>H()[$>>>0]:$=>Y()[$>>>0];case 2:return _?$=>ge()[$>>>1>>>0]:$=>Ze()[$>>>1>>>0];case 4:return _?$=>W()[$>>>2>>>0]:$=>M()[$>>>2>>>0];case 8:return _?$=>Q[$>>>3]:$=>ie[$>>>3];default:throw new TypeError(`invalid integer width (${f}): ${d}`)}};function r0(d,f,_){_>>>=0,Yt(d>>>=0,{name:f=qt(f>>>0),fromWireType:$=>$,toWireType:function($,v){if(typeof v!="bigint"&&typeof v!="number")throw v=v===null?"null":($=typeof v)=="object"||$==="array"||$==="function"?v.toString():""+v,new TypeError(`Cannot convert "${v}" to ${this.name}`);return typeof v=="number"&&(v=BigInt(v)),v},Db:cr,readValueFromPointer:Ru(f,_,f.indexOf("u")==-1),Eb:null})}var cr=8;function n0(d,f,_,$){Yt(d>>>=0,{name:f=qt(f>>>0),fromWireType:function(v){return!!v},toWireType:function(v,C){return C?_:$},Db:cr,readValueFromPointer:function(v){return this.fromWireType(Y()[v>>>0])},Eb:null})}var ds=[],Jt=[];function cs(d){9<(d>>>=0)&&--Jt[d+1]==0&&(Jt[d]=void 0,ds.push(d))}var lt=d=>{if(!d)throw new dr("Cannot use deleted val. handle = "+d);return Jt[d]},St=d=>{switch(d){case void 0:return 2;case null:return 4;case!0:return 6;case!1:return 8;default:let f=ds.pop()||Jt.length;return Jt[f]=d,Jt[f+1]=1,f}};function ps(d){return this.fromWireType(M()[d>>>2>>>0])}var i0={name:"emscripten::val",fromWireType:d=>{var f=lt(d);return cs(d),f},toWireType:(d,f)=>St(f),Db:cr,readValueFromPointer:ps,Eb:null};function s0(d){return Yt(d>>>0,i0)}var a0=(d,f)=>{switch(f){case 4:return function(_){return this.fromWireType(ae()[_>>>2>>>0])};case 8:return function(_){return this.fromWireType(X()[_>>>3>>>0])};default:throw new TypeError(`invalid float width (${f}): ${d}`)}};function o0(d,f,_){_>>>=0,Yt(d>>>=0,{name:f=qt(f>>>0),fromWireType:$=>$,toWireType:($,v)=>v,Db:cr,readValueFromPointer:a0(f,_),Eb:null})}function u0(d,f,_,$,v){if(d>>>=0,_>>>=0,f=qt(f>>>0),v===-1&&(v=4294967295),v=F=>F,$===0){var C=32-8*_;v=F=>F<<C>>>C}var D=f.includes("unsigned")?function(F,re){return re>>>0}:function(F,re){return re};Yt(d,{name:f,fromWireType:v,toWireType:D,Db:cr,readValueFromPointer:Ru(f,_,$!==0),Eb:null})}function l0(d,f,_){function $(C){var D=M()[C>>>2>>>0];return C=M()[C+4>>>2>>>0],new v(H().buffer,C,D)}var v=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array][f];Yt(d>>>=0,{name:_=qt(_>>>0),fromWireType:$,Db:cr,readValueFromPointer:$},{Tb:!0})}function d0(d,f){Yt(d>>>=0,{name:f=qt(f>>>0),fromWireType:function(_){for(var $,v=M()[_>>>2>>>0],C=_+4,D=C,F=0;F<=v;++F){var re=C+F;F!=v&&Y()[re>>>0]!=0||(D=Xe(D,re-D),$===void 0?$=D:($+="\0",$+=D),D=re+1)}return Vt(_),$},toWireType:function(_,$){$ instanceof ArrayBuffer&&($=new Uint8Array($));var v=typeof $=="string";if(!(v||$ instanceof Uint8Array||$ instanceof Uint8ClampedArray||$ instanceof Int8Array))throw new dr("Cannot pass non-string to std::string");var C=v?wu($):$.length,D=pi(4+C+1),F=D+4;if(M()[D>>>2>>>0]=C,v)jr($,F,C+1);else if(v)for(v=0;v<C;++v){var re=$.charCodeAt(v);if(255<re)throw Vt(D),new dr("String has UTF-16 code units that do not fit in 8 bits");Y()[F+v>>>0]=re}else for(v=0;v<C;++v)Y()[F+v>>>0]=$[v];return _!==null&&_.push(Vt,D),D},Db:cr,readValueFromPointer:ps,Eb(_){Vt(_)}})}var Bu=typeof TextDecoder<"u"?new TextDecoder("utf-16le"):void 0,c0=(d,f)=>{for(var _=d>>1,$=_+f/2;!(_>=$)&&Ze()[_>>>0];)++_;if(32<(_<<=1)-d&&Bu)return Bu.decode(Y().slice(d,_));for(_="",$=0;!($>=f/2);++$){var v=ge()[d+2*$>>>1>>>0];if(v==0)break;_+=String.fromCharCode(v)}return _},p0=(d,f,_)=>{if(_??(_=2147483647),2>_)return 0;var $=f;_=(_-=2)<2*d.length?_/2:d.length;for(var v=0;v<_;++v){var C=d.charCodeAt(v);ge()[f>>>1>>>0]=C,f+=2}return ge()[f>>>1>>>0]=0,f-$},f0=d=>2*d.length,h0=(d,f)=>{for(var _=0,$="";!(_>=f/4);){var v=W()[d+4*_>>>2>>>0];if(v==0)break;++_,65536<=v?(v-=65536,$+=String.fromCharCode(55296|v>>10,56320|1023&v)):$+=String.fromCharCode(v)}return $},m0=(d,f,_)=>{if(f>>>=0,_??(_=2147483647),4>_)return 0;var $=f;_=$+_-4;for(var v=0;v<d.length;++v){var C=d.charCodeAt(v);if(55296<=C&&57343>=C&&(C=65536+((1023&C)<<10)|1023&d.charCodeAt(++v)),W()[f>>>2>>>0]=C,(f+=4)+4>_)break}return W()[f>>>2>>>0]=0,f-$},g0=d=>{for(var f=0,_=0;_<d.length;++_){var $=d.charCodeAt(_);55296<=$&&57343>=$&&++_,f+=4}return f};function _0(d,f,_){if(d>>>=0,f>>>=0,_=qt(_>>>=0),f===2)var $=c0,v=p0,C=f0,D=F=>Ze()[F>>>1>>>0];else f===4&&($=h0,v=m0,C=g0,D=F=>M()[F>>>2>>>0]);Yt(d,{name:_,fromWireType:F=>{for(var re,fe=M()[F>>>2>>>0],Te=F+4,Be=0;Be<=fe;++Be){var qe=F+4+Be*f;Be!=fe&&D(qe)!=0||(Te=$(Te,qe-Te),re===void 0?re=Te:(re+="\0",re+=Te),Te=qe+f)}return Vt(F),re},toWireType:(F,re)=>{if(typeof re!="string")throw new dr(`Cannot pass non-string to C++ string type ${_}`);var fe=C(re),Te=pi(4+fe+f);return M()[Te>>>2>>>0]=fe/f,v(re,Te+4,fe+f),F!==null&&F.push(Vt,Te),Te},Db:cr,readValueFromPointer:ps,Eb(F){Vt(F)}})}function y0(d,f){Yt(d>>>=0,{Ub:!0,name:f=qt(f>>>0),Db:0,fromWireType:()=>{},toWireType:()=>{}})}function b0(d){ws(d>>>0,!u,1,!o,131072,!1),fn()}var fs=d=>{if(!Re)try{if(d(),!(0<Ae))try{l?$s(R):mt(R)}catch(f){f instanceof oe||f=="unwind"||x(0,f)}}catch(f){f instanceof oe||f=="unwind"||x(0,f)}};function hs(d){d>>>=0,typeof Atomics.kc=="function"&&(Atomics.kc(W(),d>>>2,d).value.then(ni),d+=128,Atomics.store(W(),d>>>2,1))}var ni=()=>{var d=ci();d&&(hs(d),fs(dl))};function w0(d,f){(d>>>=0)==f>>>0?setTimeout(ni):l?postMessage({Hb:d,Cb:"checkMailbox"}):(d=Qe[d])&&d.postMessage({Cb:"checkMailbox"})}var ms=[];function $0(d,f,_,$,v){for(f>>>=0,$/=2,ms.length=$,_=v>>>0>>>3,v=0;v<$;v++)ms[v]=Q[_+2*v]?Q[_+2*v+1]:X()[_+2*v+1>>>0];return(f?J[f]:fb[d])(...ms)}var v0=()=>{Ae=0};function x0(d){d>>>=0,l?postMessage({Cb:"cleanupThread",ic:d}):_t(Qe[d])}function S0(d){}var ii=(d,f)=>{var _=ls[d];if(_===void 0)throw d=il(d),_=qt(d),Vt(d),new dr(`${f} has unknown type ${_}`);return _},Mu=(d,f,_)=>{var $=[];return d=d.toWireType($,_),$.length&&(M()[f>>>2>>>0]=St($)),d};function k0(d,f,_){return f>>>=0,_>>>=0,d=lt(d>>>0),f=ii(f,"emval::as"),Mu(f,_,d)}function T0(d,f){return f>>>=0,d=lt(d>>>0),(f=ii(f,"emval::as")).toWireType(null,d)}var si=d=>{try{d()}catch(f){ee(f)}},pr=0,Lt=null,Nu=0,ai=[],Pu={},Du={},E0=0,gs=null,I0=[];function Uu(d){return function(f){if(!Re){if(pr===0){var _=!1,$=!1;f((v=0)=>{if(!Re&&(Nu=v,_=!0,$)){pr=2,si(()=>ml(Lt)),typeof MainLoop<"u"&&MainLoop.Qb&&MainLoop.resume(),v=!1;try{var C=function(){var re=W()[Lt+8>>>2>>>0];return re=me[Du[re]],--Ae,re()}()}catch(re){C=re,v=!0}var D=!1;if(!Lt){var F=gs;F&&(gs=null,(v?F.reject:F.resolve)(C),D=!0)}if(v&&!D)throw C}}),$=!0,_||(pr=1,Lt=function(){var v=pi(65548),C=v+12;M()[v>>>2>>>0]=C,M()[v+4>>>2>>>0]=C+65536,C=ai[0];var D=Pu[C];return D===void 0&&(D=E0++,Pu[C]=D,Du[D]=C),C=D,W()[v+8>>>2>>>0]=C,v}(),typeof MainLoop<"u"&&MainLoop.Qb&&MainLoop.pause(),si(()=>fl(Lt)))}else pr===2?(pr=0,si(gl),Vt(Lt),Lt=null,I0.forEach(fs)):ee(`invalid state: ${pr}`);return Nu}}(f=>{d().then(f)})}function C0(d){return d>>>=0,Uu(async()=>{var f=await lt(d);return St(f)})}var oi=[];function z0(d,f,_,$){return _>>>=0,$>>>=0,(d=oi[d>>>0])(null,f=lt(f>>>0),_,$)}var O0={},ui=d=>{var f=O0[d];return f===void 0?qt(d):f};function A0(d,f,_,$,v){return _>>>=0,$>>>=0,v>>>=0,(d=oi[d>>>0])(f=lt(f>>>0),f[_=ui(_)],$,v)}function R0(d,f){return f>>>=0,(d=lt(d>>>0))==lt(f)}var Wu=()=>typeof globalThis=="object"?globalThis:Function("return this")();function B0(d){return(d>>>=0)==0?St(Wu()):(d=ui(d),St(Wu()[d]))}var M0=d=>{var f=oi.length;return oi.push(d),f},N0=(d,f)=>{for(var _=Array(d),$=0;$<d;++$)_[$]=ii(M()[f+4*$>>>2>>>0],"parameter "+$);return _},qu=(d,f)=>Object.defineProperty(f,"name",{value:d});function P0(d,f,_){var $=(f=N0(d,f>>>0)).shift();d--;var v=`return function (obj, func, destructorsRef, args) {
`,C=0,D=[];_===0&&D.push("obj");for(var F=["retType"],re=[$],fe=0;fe<d;++fe)D.push("arg"+fe),F.push("argType"+fe),re.push(f[fe]),v+=`  var arg${fe} = argType${fe}.readValueFromPointer(args${C?"+"+C:""});
`,C+=f[fe].Db;return v+=`  var rv = ${_===1?"new func":"func.call"}(${D.join(", ")});
`,$.Ub||(F.push("emval_returnValue"),re.push(Mu),v+=`  return emval_returnValue(retType, destructorsRef, rv);
`),F.push(v+`};
`),d=function(Te){var Be=Function;if(!(Be instanceof Function))throw new TypeError(`new_ called with constructor type ${typeof Be} which is not a function`);var qe=qu(Be.name||"unknownFunctionName",function(){});return qe.prototype=Be.prototype,qe=new qe,(Te=Be.apply(qe,Te))instanceof Object?Te:qe}(F)(...re),_=`methodCaller<(${f.map(Te=>Te.name).join(", ")}) => ${$.name}>`,M0(qu(_,d))}function D0(d){return d=ui(d>>>0),St(i[d])}function U0(d,f){return f>>>=0,d=lt(d>>>0),f=lt(f),St(d[f])}function W0(d){9<(d>>>=0)&&(Jt[d+1]+=1)}function q0(){return St([])}function L0(d){d=lt(d>>>0);for(var f=Array(d.length),_=0;_<d.length;_++)f[_]=d[_];return St(f)}function V0(d){return St(ui(d>>>0))}function H0(){return St({})}function F0(d){for(var f=lt(d>>>=0);f.length;){var _=f.pop();f.pop()(_)}cs(d)}function G0(d,f,_){f>>>=0,_>>>=0,d=lt(d>>>0),f=lt(f),_=lt(_),d[f]=_}function j0(d,f){return f>>>=0,d=(d=ii(d>>>0,"_emval_take_value")).readValueFromPointer(f),St(d)}function K0(d,f){d=-9007199254740992>d||9007199254740992<d?NaN:Number(d),f>>>=0,d=new Date(1e3*d),W()[f>>>2>>>0]=d.getUTCSeconds(),W()[f+4>>>2>>>0]=d.getUTCMinutes(),W()[f+8>>>2>>>0]=d.getUTCHours(),W()[f+12>>>2>>>0]=d.getUTCDate(),W()[f+16>>>2>>>0]=d.getUTCMonth(),W()[f+20>>>2>>>0]=d.getUTCFullYear()-1900,W()[f+24>>>2>>>0]=d.getUTCDay(),d=(d.getTime()-Date.UTC(d.getUTCFullYear(),0,1,0,0,0,0))/864e5|0,W()[f+28>>>2>>>0]=d}var Lu=d=>d%4==0&&(d%100!=0||d%400==0),Vu=[0,31,60,91,121,152,182,213,244,274,305,335],Hu=[0,31,59,90,120,151,181,212,243,273,304,334];function Z0(d,f){d=-9007199254740992>d||9007199254740992<d?NaN:Number(d),f>>>=0,d=new Date(1e3*d),W()[f>>>2>>>0]=d.getSeconds(),W()[f+4>>>2>>>0]=d.getMinutes(),W()[f+8>>>2>>>0]=d.getHours(),W()[f+12>>>2>>>0]=d.getDate(),W()[f+16>>>2>>>0]=d.getMonth(),W()[f+20>>>2>>>0]=d.getFullYear()-1900,W()[f+24>>>2>>>0]=d.getDay();var _=(Lu(d.getFullYear())?Vu:Hu)[d.getMonth()]+d.getDate()-1|0;W()[f+28>>>2>>>0]=_,W()[f+36>>>2>>>0]=-60*d.getTimezoneOffset(),_=new Date(d.getFullYear(),6,1).getTimezoneOffset();var $=new Date(d.getFullYear(),0,1).getTimezoneOffset();d=0|(_!=$&&d.getTimezoneOffset()==Math.min($,_)),W()[f+32>>>2>>>0]=d}function Q0(d){d>>>=0;var f=new Date(W()[d+20>>>2>>>0]+1900,W()[d+16>>>2>>>0],W()[d+12>>>2>>>0],W()[d+8>>>2>>>0],W()[d+4>>>2>>>0],W()[d>>>2>>>0],0),_=W()[d+32>>>2>>>0],$=f.getTimezoneOffset(),v=new Date(f.getFullYear(),6,1).getTimezoneOffset(),C=new Date(f.getFullYear(),0,1).getTimezoneOffset(),D=Math.min(C,v);return 0>_?W()[d+32>>>2>>>0]=+(v!=C&&D==$):0<_!=(D==$)&&(v=Math.max(C,v),f.setTime(f.getTime()+6e4*((0<_?D:v)-$))),W()[d+24>>>2>>>0]=f.getDay(),_=(Lu(f.getFullYear())?Vu:Hu)[f.getMonth()]+f.getDate()-1|0,W()[d+28>>>2>>>0]=_,W()[d>>>2>>>0]=f.getSeconds(),W()[d+4>>>2>>>0]=f.getMinutes(),W()[d+8>>>2>>>0]=f.getHours(),W()[d+12>>>2>>>0]=f.getDate(),W()[d+16>>>2>>>0]=f.getMonth(),W()[d+20>>>2>>>0]=f.getYear(),d=f.getTime(),BigInt(isNaN(d)?-1:d/1e3)}function Fu(d,f,_,$,v,C,D){return l?be(16,1,d,f,_,$,v,C,D):-52}function Gu(d,f,_,$,v,C){if(l)return be(17,1,d,f,_,$,v,C)}var hn={},X0=()=>performance.timeOrigin+performance.now();function ju(d,f){if(l)return be(18,1,d,f);if(hn[d]&&(clearTimeout(hn[d].id),delete hn[d]),!f)return 0;var _=setTimeout(()=>{delete hn[d],fs(()=>ll(d,performance.timeOrigin+performance.now()))},f);return hn[d]={id:_,rc:f},0}function Y0(d,f,_,$){d>>>=0,f>>>=0,_>>>=0,$>>>=0;var v=new Date().getFullYear(),C=new Date(v,0,1).getTimezoneOffset();v=new Date(v,6,1).getTimezoneOffset();var D=Math.max(C,v);M()[d>>>2>>>0]=60*D,W()[f>>>2>>>0]=+(C!=v),d=(f=F=>{var re=Math.abs(F);return`UTC${0<=F?"-":"+"}${String(Math.floor(re/60)).padStart(2,"0")}${String(re%60).padStart(2,"0")}`})(C),f=f(v),v<C?(jr(d,_,17),jr(f,$,17)):(jr(d,$,17),jr(f,_,17))}var J0=()=>Date.now();function eb(d,f,_){return 0<=d&&3>=d?(d===0?d=Date.now():d=performance.timeOrigin+performance.now(),Q[_>>>0>>>3]=BigInt(Math.round(1e6*d)),0):28}var _s=[],Ku=(d,f)=>{_s.length=0;for(var _;_=Y()[d++>>>0];){var $=_!=105;f+=($&=_!=112)&&f%8?4:0,_s.push(_==112?M()[f>>>2>>>0]:_==106?Q[f>>>3]:_==105?W()[f>>>2>>>0]:X()[f>>>3>>>0]),f+=$?8:4}return _s};function tb(d,f,_){return d>>>=0,f=Ku(f>>>0,_>>>0),J[d](...f)}function rb(d,f,_){return d>>>=0,f=Ku(f>>>0,_>>>0),J[d](...f)}var nb=()=>{};function ib(d,f){return I(Xe(d>>>0,f>>>0))}var sb=()=>{throw Ae+=1,"unwind"};function ab(){return 4294901760}var ob=()=>navigator.hardwareConcurrency;function ub(){return ee("Cannot use emscripten_pc_get_function without -sUSE_OFFSET_CONVERTER"),0}function lb(d){d>>>=0;var f=Y().length;if(d<=f||4294901760<d)return!1;for(var _=1;4>=_;_*=2){var $=f*(1+.2/_);$=Math.min($,d+100663296);e:{$=(Math.min(4294901760,65536*Math.ceil(Math.max(d,$)/65536))-z.buffer.byteLength+65535)/65536|0;try{z.grow($),T();var v=1;break e}catch{}v=void 0}if(v)return!0}return!1}var li=()=>(ee("Cannot use convertFrameToPC (needed by __builtin_return_address) without -sUSE_OFFSET_CONVERTER"),0),mn={},Zu=d=>{d.forEach(f=>{li()})};function db(){var d=Error().stack.toString().split(`
`);return d[0]=="Error"&&d.shift(),Zu(d),mn.Mb=li(),mn.dc=d,mn.Mb}function cb(d,f,_){if(d>>>=0,f>>>=0,mn.Mb==d)var $=mn.dc;else($=Error().stack.toString().split(`
`))[0]=="Error"&&$.shift(),Zu($);for(var v=3;$[v]&&li()!=d;)++v;for(d=0;d<_&&$[d+v];++d)W()[f+4*d>>>2>>>0]=li();return d}var ys,bs={},Qu=()=>{if(!ys){var d,f={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(typeof navigator=="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:"./this.program"};for(d in bs)bs[d]===void 0?delete f[d]:f[d]=bs[d];var _=[];for(d in f)_.push(`${d}=${f[d]}`);ys=_}return ys};function Xu(d,f){if(l)return be(19,1,d,f);d>>>=0,f>>>=0;var _=0;return Qu().forEach(($,v)=>{var C=f+_;for(v=M()[d+4*v>>>2>>>0]=C,C=0;C<$.length;++C)H()[v++>>>0]=$.charCodeAt(C);H()[v>>>0]=0,_+=$.length+1}),0}function Yu(d,f){if(l)return be(20,1,d,f);d>>>=0,f>>>=0;var _=Qu();M()[d>>>2>>>0]=_.length;var $=0;return _.forEach(v=>$+=v.length+1),M()[f>>>2>>>0]=$,0}function Ju(d){return l?be(21,1,d):52}function el(d,f,_,$){return l?be(22,1,d,f,_,$):52}function tl(d,f,_,$){return l?be(23,1,d,f,_,$):70}var pb=[null,[],[]];function rl(d,f,_,$){if(l)return be(24,1,d,f,_,$);f>>>=0,_>>>=0,$>>>=0;for(var v=0,C=0;C<_;C++){var D=M()[f>>>2>>>0],F=M()[f+4>>>2>>>0];f+=8;for(var re=0;re<F;re++){var fe=Y()[D+re>>>0],Te=pb[d];fe===0||fe===10?((d===1?S:I)(_u(Te)),Te.length=0):Te.push(fe)}v+=F}return M()[$>>>2>>>0]=v,0}l||function(){for(var d=i.numThreads-1;d--;)fu();ve.unshift(()=>{q++,function(f){l?f():Promise.all(Ye.map(pu)).then(f)}(()=>V())})}();for(var nl=Array(256),di=0;256>di;++di)nl[di]=String.fromCharCode(di);Au=nl,dr=i.BindingError=class extends Error{constructor(d){super(d),this.name="BindingError"}},i.InternalError=class extends Error{constructor(d){super(d),this.name="InternalError"}},Jt.push(0,1,void 0,1,null,1,!0,1,!1,1),i.count_emval_handles=()=>Jt.length/2-5-ds.length;var me,fb=[rt,nt,hu,yu,bu,$u,vu,xu,Su,ku,Tu,Eu,Iu,Cu,zu,Ou,Fu,Gu,ju,Xu,Yu,Ju,el,tl,rl];(async function(){function d($,v){return me=$.exports,me=function(){var C=me,D={};for(let[F,re]of Object.entries(C))D[F]=typeof re=="function"?(...fe)=>{ai.push(F);try{return re(...fe)}finally{Re||(ai.pop(),Lt&&pr===1&&ai.length===0&&(pr=0,Ae+=1,si(hl),typeof Fibers<"u"&&Fibers.sc()))}}:re;return D}(),me=function(){var C=me,D=re=>fe=>re(fe)>>>0,F=re=>()=>re()>>>0;return(C=Object.assign({},C)).Ea=D(C.Ea),C.gb=F(C.gb),C.ib=D(C.ib),C.ub=D(C.ub),C.vb=F(C.vb),C.__cxa_get_exception_ptr=D(C.__cxa_get_exception_ptr),C}(),pn.push(me.jb),O=v,V(),me}q++;var f=te();if(i.instantiateWasm)return new Promise($=>{i.instantiateWasm(f,(v,C)=>{d(v,C),$(v.exports)})});if(l)return new Promise($=>{le=v=>{var C=new WebAssembly.Instance(v,te());$(d(C,v))}});A??(A=i.locateFile?i.locateFile?i.locateFile("ort-wasm-simd-threaded.jsep.wasm",w):w+"ort-wasm-simd-threaded.jsep.wasm":new URL("/assets/ort-wasm-simd-threaded.jsep-CLPRrI3A.wasm",import.meta.url).href);try{var _=await async function($){var v=A;if(!de&&typeof WebAssembly.instantiateStreaming=="function"&&!P(v))try{var C=fetch(v,{credentials:"same-origin"});return await WebAssembly.instantiateStreaming(C,$)}catch(D){I(`wasm streaming compile failed: ${D}`),I("falling back to ArrayBuffer instantiation")}return async function(D,F){try{var re=await async function(fe){if(!de)try{var Te=await m(fe);return new Uint8Array(Te)}catch{}if(fe==A&&de)fe=new Uint8Array(de);else{if(!g)throw"both async and sync fetching of the wasm failed";fe=g(fe)}return fe}(D);return await WebAssembly.instantiate(re,F)}catch(fe){I(`failed to asynchronously prepare wasm: ${fe}`),ee(fe)}}(v,$)}(f);return d(_.instance,_.module)}catch($){return s($),Promise.reject($)}})();var il=d=>(il=me.Ea)(d),sl=()=>(sl=me.Fa)();i._OrtInit=(d,f)=>(i._OrtInit=me.Ga)(d,f),i._OrtGetLastError=(d,f)=>(i._OrtGetLastError=me.Ha)(d,f),i._OrtCreateSessionOptions=(d,f,_,$,v,C,D,F,re,fe)=>(i._OrtCreateSessionOptions=me.Ia)(d,f,_,$,v,C,D,F,re,fe),i._OrtAppendExecutionProvider=(d,f,_,$,v)=>(i._OrtAppendExecutionProvider=me.Ja)(d,f,_,$,v),i._OrtAddFreeDimensionOverride=(d,f,_)=>(i._OrtAddFreeDimensionOverride=me.Ka)(d,f,_),i._OrtAddSessionConfigEntry=(d,f,_)=>(i._OrtAddSessionConfigEntry=me.La)(d,f,_),i._OrtReleaseSessionOptions=d=>(i._OrtReleaseSessionOptions=me.Ma)(d),i._OrtCreateSession=(d,f,_)=>(i._OrtCreateSession=me.Na)(d,f,_),i._OrtReleaseSession=d=>(i._OrtReleaseSession=me.Oa)(d),i._OrtGetInputOutputCount=(d,f,_)=>(i._OrtGetInputOutputCount=me.Pa)(d,f,_),i._OrtGetInputOutputMetadata=(d,f,_,$)=>(i._OrtGetInputOutputMetadata=me.Qa)(d,f,_,$),i._OrtFree=d=>(i._OrtFree=me.Ra)(d),i._OrtCreateTensor=(d,f,_,$,v,C)=>(i._OrtCreateTensor=me.Sa)(d,f,_,$,v,C),i._OrtGetTensorData=(d,f,_,$,v)=>(i._OrtGetTensorData=me.Ta)(d,f,_,$,v),i._OrtReleaseTensor=d=>(i._OrtReleaseTensor=me.Ua)(d),i._OrtCreateRunOptions=(d,f,_,$)=>(i._OrtCreateRunOptions=me.Va)(d,f,_,$),i._OrtAddRunConfigEntry=(d,f,_)=>(i._OrtAddRunConfigEntry=me.Wa)(d,f,_),i._OrtReleaseRunOptions=d=>(i._OrtReleaseRunOptions=me.Xa)(d),i._OrtCreateBinding=d=>(i._OrtCreateBinding=me.Ya)(d),i._OrtBindInput=(d,f,_)=>(i._OrtBindInput=me.Za)(d,f,_),i._OrtBindOutput=(d,f,_,$)=>(i._OrtBindOutput=me._a)(d,f,_,$),i._OrtClearBoundOutputs=d=>(i._OrtClearBoundOutputs=me.$a)(d),i._OrtReleaseBinding=d=>(i._OrtReleaseBinding=me.ab)(d),i._OrtRunWithBinding=(d,f,_,$,v)=>(i._OrtRunWithBinding=me.bb)(d,f,_,$,v),i._OrtRun=(d,f,_,$,v,C,D,F)=>(i._OrtRun=me.cb)(d,f,_,$,v,C,D,F),i._OrtEndProfiling=d=>(i._OrtEndProfiling=me.db)(d),i._JsepOutput=(d,f,_)=>(i._JsepOutput=me.eb)(d,f,_),i._JsepGetNodeName=d=>(i._JsepGetNodeName=me.fb)(d);var ci=()=>(ci=me.gb)(),Vt=i._free=d=>(Vt=i._free=me.hb)(d),pi=i._malloc=d=>(pi=i._malloc=me.ib)(d),ws=(d,f,_,$,v,C)=>(ws=me.lb)(d,f,_,$,v,C),al=()=>(al=me.mb)(),ol=(d,f,_,$,v)=>(ol=me.nb)(d,f,_,$,v),ul=d=>(ul=me.ob)(d),$s=d=>($s=me.pb)(d),ll=(d,f)=>(ll=me.qb)(d,f),dl=()=>(dl=me.rb)(),cl=(d,f)=>(cl=me.sb)(d,f),fi=d=>(fi=me.tb)(d),vs=d=>(vs=me.ub)(d),xs=()=>(xs=me.vb)(),pl=i.dynCall_ii=(d,f)=>(pl=i.dynCall_ii=me.wb)(d,f),fl=d=>(fl=me.xb)(d),hl=()=>(hl=me.yb)(),ml=d=>(ml=me.zb)(d),gl=()=>(gl=me.Ab)();return i.stackSave=()=>xs(),i.stackRestore=d=>fi(d),i.stackAlloc=d=>vs(d),i.setValue=function(d,f,_="i8"){switch(_.endsWith("*")&&(_="*"),_){case"i1":case"i8":H()[d>>>0]=f;break;case"i16":ge()[d>>>1>>>0]=f;break;case"i32":W()[d>>>2>>>0]=f;break;case"i64":Q[d>>>3]=BigInt(f);break;case"float":ae()[d>>>2>>>0]=f;break;case"double":X()[d>>>3>>>0]=f;break;case"*":M()[d>>>2>>>0]=f;break;default:ee(`invalid type for setValue: ${_}`)}},i.getValue=function(d,f="i8"){switch(f.endsWith("*")&&(f="*"),f){case"i1":case"i8":return H()[d>>>0];case"i16":return ge()[d>>>1>>>0];case"i32":return W()[d>>>2>>>0];case"i64":return Q[d>>>3];case"float":return ae()[d>>>2>>>0];case"double":return X()[d>>>3>>>0];case"*":return M()[d>>>2>>>0];default:ee(`invalid type for getValue: ${f}`)}},i.UTF8ToString=Xe,i.stringToUTF8=jr,i.lengthBytesUTF8=wu,function d(){if(0<q)L=d;else if(l)n(i),E();else{for(;0<ve.length;)ve.shift()(i);0<q?L=d:(i.calledRun=!0,Re||(E(),n(i)))}}(),i.PTR_SIZE=4,a}),Mm=Hs,dd=(t=(e=globalThis.self)==null?void 0:e.name)==null?void 0:t.startsWith("em-pthread"),dd&&Hs()}),Fs,Ya,cd,yt,Nm,yi,pd,fd,Gs,hd,js,Pm,Ks,Dm,qo=j(()=>{Wo(),Fs=typeof location>"u"?void 0:location.origin,Ya=import.meta.url>"file:"&&import.meta.url<"file;",cd=()=>{{if(Ya){let e=URL;return new URL(new e("ort.webgpu.bundle.min.mjs",import.meta.url).href,Fs).href}return import.meta.url}},yt=cd(),Nm=()=>{if(yt&&!yt.startsWith("blob:"))return yt.substring(0,yt.lastIndexOf("/")+1)},yi=(e,t)=>{try{let r=t??yt;return(r?new URL(e,r):new URL(e)).origin===Fs}catch{return!1}},pd=(e,t)=>{let r=t??yt;try{return(r?new URL(e,r):new URL(e)).href}catch{return}},fd=(e,t)=>`${t??"./"}${e}`,Gs=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},hd=async e=>(await import(e)).default,js=(i1(),Jn(Am)).default,Pm=async()=>{if(!yt)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(yi(yt))return[void 0,js()];let e=await Gs(yt);return[e,js(e)]},Ks=(s1(),Jn(Bm)).default,Dm=async(e,t,r)=>{if(!e&&!t&&Ks&&yt&&yi(yt))return[void 0,Ks];{let n="ort-wasm-simd-threaded.jsep.mjs",s=e??pd(n,t),i=r&&s&&!yi(s,t),a=i?await Gs(s):s??fd(n,t);return[i?a:void 0,await hd(a)]}}}),Zs,bi,wn,Qs,md,gd,_d,Lo,Ve,Fr=j(()=>{qo(),bi=!1,wn=!1,Qs=!1,md=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},gd=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},_d=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},Lo=async e=>{if(bi)return Promise.resolve();if(wn)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(Qs)throw new Error("previous call to 'initializeWebAssembly()' failed.");wn=!0;let t=e.initTimeout,r=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!_d())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!gd())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let n=md();r>1&&!n&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+r+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=r=1);let s=e.wasmPaths,i=typeof s=="string"?s:void 0,a=s==null?void 0:s.mjs,o=(a==null?void 0:a.href)??a,u=s==null?void 0:s.wasm,l=(u==null?void 0:u.href)??u,c=e.wasmBinary,[p,h]=await Dm(o,i,r>1),m=!1,g=[];if(t>0&&g.push(new Promise(y=>{setTimeout(()=>{m=!0,y()},t)})),g.push(new Promise((y,x)=>{let w={numThreads:r};if(c)w.wasmBinary=c;else if(l||i)w.locateFile=b=>l??i+b;else if(o&&o.indexOf("blob:")!==0)w.locateFile=b=>new URL(b,o).href;else if(p){let b=Nm();b&&(w.locateFile=k=>b+k)}h(w).then(b=>{wn=!1,bi=!0,Zs=b,y(),p&&URL.revokeObjectURL(p)},b=>{wn=!1,Qs=!0,x(b)})})),await Promise.race(g),m)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},Ve=()=>{if(bi&&Zs)return Zs;throw new Error("WebAssembly is not initialized yet.")}}),Rt,Hi,Pe,Vo=j(()=>{Fr(),Rt=(e,t)=>{let r=Ve(),n=r.lengthBytesUTF8(e)+1,s=r._malloc(n);return r.stringToUTF8(e,s,n),t.push(s),s},Hi=(e,t,r,n)=>{if(typeof e=="object"&&e!==null){if(r.has(e))throw new Error("Circular reference in options");r.add(e)}Object.entries(e).forEach(([s,i])=>{let a=t?t+s:s;if(typeof i=="object")Hi(i,a+".",r,n);else if(typeof i=="string"||typeof i=="number")n(a,i.toString());else if(typeof i=="boolean")n(a,i?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof i}`)})},Pe=e=>{let t=Ve(),r=t.stackSave();try{let n=t.PTR_SIZE,s=t.stackAlloc(2*n);t._OrtGetLastError(s,s+n);let i=Number(t.getValue(s,n===4?"i32":"i64")),a=t.getValue(s+n,"*"),o=a?t.UTF8ToString(a):"";throw new Error(`${e} ERROR_CODE: ${i}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(r)}}}),Um,a1=j(()=>{Fr(),Vo(),Um=e=>{let t=Ve(),r=0,n=[],s=e||{};try{if((e==null?void 0:e.logSeverityLevel)===void 0)s.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log serverity level is not valid: ${e.logSeverityLevel}`);if((e==null?void 0:e.logVerbosityLevel)===void 0)s.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);(e==null?void 0:e.terminate)===void 0&&(s.terminate=!1);let i=0;return(e==null?void 0:e.tag)!==void 0&&(i=Rt(e.tag,n)),r=t._OrtCreateRunOptions(s.logSeverityLevel,s.logVerbosityLevel,!!s.terminate,i),r===0&&Pe("Can't create run options."),(e==null?void 0:e.extra)!==void 0&&Hi(e.extra,"",new WeakSet,(a,o)=>{let u=Rt(a,n),l=Rt(o,n);t._OrtAddRunConfigEntry(r,u,l)!==0&&Pe(`Can't set a run config entry: ${a} - ${o}.`)}),[r,n]}catch(i){throw r!==0&&t._OrtReleaseRunOptions(r),n.forEach(a=>t._free(a)),i}}}),yd,bd,wd,$n,$d,Wm,o1=j(()=>{Fr(),Vo(),yd=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},bd=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},wd=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(r=>(typeof r=="string"?r:r.name)==="webgpu")&&(e.enableMemPattern=!1)},$n=(e,t,r,n)=>{let s=Rt(t,n),i=Rt(r,n);Ve()._OrtAddSessionConfigEntry(e,s,i)!==0&&Pe(`Can't set a session config entry: ${t} - ${r}.`)},$d=async(e,t,r)=>{for(let n of t){let s=typeof n=="string"?n:n.name,i=[];switch(s){case"webnn":if(s="WEBNN",typeof n!="string"){let c=n==null?void 0:n.deviceType;c&&$n(e,"deviceType",c,r)}break;case"webgpu":if(s="JS",typeof n!="string"){let c=n;if(c!=null&&c.preferredLayout){if(c.preferredLayout!=="NCHW"&&c.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${c.preferredLayout}`);$n(e,"preferredLayout",c.preferredLayout,r)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${s}`)}let a=Rt(s,r),o=i.length,u=0,l=0;if(o>0){u=Ve()._malloc(o*Ve().PTR_SIZE),r.push(u),l=Ve()._malloc(o*Ve().PTR_SIZE),r.push(l);for(let c=0;c<o;c++)Ve().setValue(u+c*Ve().PTR_SIZE,i[c][0],"*"),Ve().setValue(l+c*Ve().PTR_SIZE,i[c][1],"*")}await Ve()._OrtAppendExecutionProvider(e,a,u,l,o)!==0&&Pe(`Can't append execution provider: ${s}.`)}},Wm=async e=>{let t=Ve(),r=0,n=[],s=e||{};wd(s);try{let i=yd(s.graphOptimizationLevel??"all"),a=bd(s.executionMode??"sequential"),o=typeof s.logId=="string"?Rt(s.logId,n):0,u=s.logSeverityLevel??2;if(!Number.isInteger(u)||u<0||u>4)throw new Error(`log serverity level is not valid: ${u}`);let l=s.logVerbosityLevel??0;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log verbosity level is not valid: ${l}`);let c=typeof s.optimizedModelFilePath=="string"?Rt(s.optimizedModelFilePath,n):0;if(r=t._OrtCreateSessionOptions(i,!!s.enableCpuMemArena,!!s.enableMemPattern,a,!!s.enableProfiling,0,o,u,l,c),r===0&&Pe("Can't create session options."),s.executionProviders&&await $d(r,s.executionProviders,n),s.enableGraphCapture!==void 0){if(typeof s.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${s.enableGraphCapture}`);$n(r,"enableGraphCapture",s.enableGraphCapture.toString(),n)}if(s.freeDimensionOverrides)for(let[p,h]of Object.entries(s.freeDimensionOverrides)){if(typeof p!="string")throw new Error(`free dimension override name must be a string: ${p}`);if(typeof h!="number"||!Number.isInteger(h)||h<0)throw new Error(`free dimension override value must be a non-negative integer: ${h}`);let m=Rt(p,n);t._OrtAddFreeDimensionOverride(r,m,h)!==0&&Pe(`Can't set a free dimension override: ${p} - ${h}.`)}return s.extra!==void 0&&Hi(s.extra,"",new WeakSet,(p,h)=>{$n(r,p,h,n)}),[r,n]}catch(i){throw r!==0&&t._OrtReleaseSessionOptions(r)!==0&&Pe("Can't release session options."),n.forEach(a=>t._free(a)),i}}}),Nr,ar,Pr,os,Fi,Ho,Fo,Ja,we=j(()=>{Nr=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},ar=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Pr=(e,t)=>{let r=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],n=typeof t=="number"?t:t.reduce((s,i)=>s*i,1);return r>0?Math.ceil(n*r):void 0},os=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Fi=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},Ho=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Fo=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",Ja=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),Go,qm=j(()=>{Wo(),Go=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let r=t.headers.get("Content-Length"),n=r?parseInt(r,10):0;if(n<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let s=t.body.getReader(),i;try{i=new ArrayBuffer(n)}catch(o){if(o instanceof RangeError){let u=Math.ceil(n/65536);i=new WebAssembly.Memory({initial:u,maximum:u}).buffer}else throw o}let a=0;for(;;){let{done:o,value:u}=await s.read();if(o)break;let l=u.byteLength;new Uint8Array(i,a,l).set(u),a+=l}return new Uint8Array(i,0,n)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),vd,xd,Sd,kd,jo,Td,Oe,lr=j(()=>{we(),vd=["V","I","W","E","F"],xd=(e,t)=>{console.log(`[${vd[e]},${new Date().toISOString()}]${t}`)},jo=(e,t)=>{Sd=e,kd=t},Td=(e,t)=>{let r=Fi(e),n=Fi(Sd);r>=n&&xd(r,typeof t=="function"?t():t)},Oe=(...e)=>{kd&&Td(...e)}}),Ed,ln,B,Gi,Lm,Vm,Hm,xe=j(()=>{Ed=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},ln=class{static calcShape(e,t,r=!1){let n=e.length,s=t.length;if(n===0)return t;if(s===0)return e;let i=Math.max(e.length,t.length),a=new Array(i);if(r){if(n<2||s<2)return;let o=Ed.calcMatMulShape([e[n-2],e[n-1]],[t[s-2],t[s-1]]);if(o===void 0)return;[a[i-2],a[i-1]]=o}for(let o=r?3:1;o<=i;o++){let u=n-o<0?1:e[n-o],l=s-o<0?1:t[s-o];if(u!==l&&u>1&&l>1)return;let c=Math.max(u,l);if(u&&l)a[i-o]=Math.max(u,l);else{if(c>1)return;a[i-o]=0}}return a}static isValidBroadcast(e,t){let r=e.length,n=t.length;if(r>n)return!1;for(let s=1;s<=r;s++)if(e[r-s]!==1&&e[r-s]!==t[n-s])return!1;return!0}},B=class Bi{static size(t){return Bi.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,r=4){let n=t.length;if(n===0)return[];let s=new Array(n),i=n-1;for(;i>=0;){if(t[i]%r===0){s[i]=t[i]/r;break}if(r%t[i]!==0)throw new Error("cannot convert shape");s[i]=1,r/=t[i],i--}for(i--;i>=0;i--)s[i]=t[i];return s}static sizeFromDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Bi.getSizeFromDimensionRange(t,r,t.length)}static sizeToDimension(t,r){if(r<0||r>t.length)throw new Error(`invalid dimension of ${r} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Bi.getSizeFromDimensionRange(t,0,r)}static getSizeFromDimensionRange(t,r,n){let s=1;for(let i=r;i<n;i++){if(t[i]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");s*=Number(t[i])}return s}static computeStrides(t){let r=t.length;if(r===0)return[];if(r===1)return[1];let n=new Array(r);n[r-1]=1,n[r-2]=t[r-1];for(let s=r-3;s>=0;--s)n[s]=n[s+1]*t[s+1];return n}static normalizeAxis(t,r){if(t<-r&&t>=r)throw new Error("unsupported axis for this operation.");return t<0?t+r:t}static normalizeAxes(t,r){return t.map(n=>this.normalizeAxis(n,r??t.length))}static sortBasedOnPerm(t,r){return r?r.map(n=>t[n]):t.slice().reverse()}static padShape(t,r){let n=t.length;return t.map((s,i)=>s+r[i]+r[i+n])}static areEqual(t,r){return t.length!==r.length?!1:t.every((n,s)=>n===r[s])}},Gi=class An{static adjustPoolAttributes(t,r,n,s,i,a){if(!t&&n.length!==r.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<r.length-2;o++)o>=n.length?n.push(r[o+2]):n[o]=r[o+2];for(let o=0;o<n.length;o++)if(o<s.length){if(s[o]<0)throw new Error("strides should be greater than or equal to 1")}else s.push(1);for(let o=0;o<n.length;o++)if(o<i.length){if(i[o]<0)throw new Error("dilations should be greater than or equal to 1")}else i.push(1);for(let o=0;o<n.length*2;o++)if(o<a.length){if(a[o]<0)throw new Error("pad should be greater than or equal to 1")}else a.push(0);for(let o=0;o<n.length;o++){if(n[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(a[o]>=n[o]||a[o+n.length]>=n[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,r,n,s,i,a,o){if(o){if(i.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(r.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(s.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)An.adjustPadAndReturnShape(t[u+(a?1:2)],r[u],n[u],s[u],i,u,u+t.length-2,o)}}static computePoolOutputShape(t,r,n,s,i,a,o){if(r.length<=0)throw new Error("input shape must be of size greater than 0");let u=[r[0],r[1]];return An.computeShapeHelper(t,r,u,n,s,i,a,o),u}static computeConvOutputShape(t,r,n,s,i,a,o){if(t.length<=0||r.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],r[0]];return An.computeShapeHelper(!1,t,u,n,s,i,a,o),u}static computeShapeHelper(t,r,n,s,i,a,o,u){if(t)for(let l=0;l<r.length-2;l++)n.push(1);else for(let l=0;l<r.length-2;l++)n.push(An.adjustPadAndReturnShape(r[l+2],s[l],i[l],a[l],o,l,l+r.length-2,u))}static adjustPadAndReturnShape(t,r,n,s,i,a,o,u){let l=n*(s-1)+1;if(u&&u!=="NOTSET")switch(u){case"VALID":return i[a]=0,i[o]=0,Math.floor((t-l)/r+1);case"SAME_LOWER":case"SAME_UPPER":if(n!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let c=((t+r-1)/r-1)*r+s-t;return i[a]=Math.floor(u==="SAME_LOWER"?(c+1)/2:c/2),i[o]=c-i[a],Math.floor((t+c-s)/r+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+i[a]+i[o]-l)/r+1)}},Lm=class{static getShapeOfGemmResult(e,t,r,n,s){if(e.length!==2||r.length!==2)throw new Error("shape need to be of size 2");let i,a,o;t?(i=e[1],a=e[0]):(i=e[0],a=e[1]);let u=-1;if(n?(o=r[0],u=1):(o=r[1],u=0),r[u]!==a)throw new Error("dimension mismatch");if(i<=0||o<=0||a<=0)throw new Error("invalid shape specified");if(s&&!ln.isValidBroadcast(s,[i,o]))throw new Error("gemm: invalid bias shape for broadcast");return[i,o,a]}},Vm=-34028234663852886e22,Hm=34028234663852886e22}),Ko,Fm=j(()=>{we(),Ko=(e,t)=>new(os(t))(e)}),Xs,eo,Ys,Id,Js,Cd,ea,ta,ra,zd,Gm,u1=j(()=>{we(),lr(),Xs=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),eo=(e,t)=>{if(t==="int32")return e;let r=Xs.get(t);if(!r)throw new Error(`WebNN backend does not support data type: ${t}`);let n=r/8;if(e.byteLength%n!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${n}.`);let s=e.byteLength/n,i=new(os(t))(e.buffer,e.byteOffset,s);switch(t){case"int64":case"uint64":{let a=new Int32Array(s);for(let o=0;o<s;o++){let u=i[o];if(u>2147483647n||u<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");a[o]=Number(u)}return new Uint8Array(a.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&i.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let a=Int32Array.from(i,Number);return new Uint8Array(a.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},Ys=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let r=e.byteLength/4,n=new Int32Array(e.buffer,e.byteOffset,r);switch(t){case"int64":{let s=BigInt64Array.from(n,BigInt);return new Uint8Array(s.buffer)}case"uint64":{if(n.some(i=>i<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let s=BigUint64Array.from(n,BigInt);return new Uint8Array(s.buffer)}case"int8":{if(n.some(i=>i<-128||i>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let s=Int8Array.from(n,Number);return new Uint8Array(s.buffer)}case"uint8":{if(n.some(s=>s<0||s>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(n,Number)}case"uint32":{if(n.some(i=>i<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let s=Uint32Array.from(n,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Id=1,Js=()=>Id++,Cd=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),ea=(e,t)=>{let r=Xs.get(e);if(!r)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((n,s)=>n*s)*r/8):0},ta=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:r,tensor:n,dataType:s,shape:i,fallbackDataType:a}=e;this.sessionId=t,this.mlContext=r,this.mlTensor=n,this.dataType=s,this.tensorShape=i,this.fallbackDataType=a}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return ea(this.dataType,this.tensorShape)}destroy(){Oe("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),r=Ys(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(r);return}else return r.buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,r){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===r.length&&this.tensorShape.every((n,s)=>n===r[s])}setIsDataConverted(e){this.isDataConverted=e}},ra=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,r,n){let s=this.tensorManager.getMLContext(e),i;if(!s.opSupportLimits().input.dataTypes.includes(t)){if(i=Cd.get(t),!i||!s.opSupportLimits().input.dataTypes.includes(i))throw new Error(`WebNN backend does not support data type: ${t}`);Oe("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${i}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(s,t,r))return this.wrapper.tensor;if(n){if(this.wrapper.byteLength!==ea(t,r))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let a=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,r,a,!0,!0,i),n&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=eo(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else Oe("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){var t,r;if(this.activeUpload){let n=(t=this.wrapper)!=null&&t.isDataConverted?Ys(this.activeUpload,(r=this.wrapper)==null?void 0:r.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(n):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(n);return}else return n.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},zd=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}reserveTensorId(){let e=Js();return this.tensorTrackersById.set(e,new ra(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,r,n,s){Oe("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${r}, shape: ${n}, copyOld: ${s}}`);let i=this.tensorTrackersById.get(t);if(!i)throw new Error("Tensor not found.");return i.ensureTensor(e,r,n,s)}upload(e,t){let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");r.upload(t)}async download(e,t){Oe("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t==null?void 0:t.byteLength}}`);let r=this.tensorTrackersById.get(e);if(!r)throw new Error("Tensor not found.");return r.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,r,n){let s=this.getMLContext(e),i=Js(),a=new ta({sessionId:e,context:s,tensor:t,dataType:r,shape:n});return this.tensorTrackersById.set(i,new ra(this,a)),this.externalTensors.add(a),i}async getCachedTensor(e,t,r,n,s,i,a){let o=this.getMLContext(e);for(let[l,c]of this.freeTensors.entries())if(c.canReuseTensor(o,t,r)){Oe("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${a?`fallbackDataType: ${a},`:""} shape: ${r}`);let p=this.freeTensors.splice(l,1)[0];return p.sessionId=e,p}Oe("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${a?`fallbackDataType: ${a},`:""} shape: ${r}}`);let u=await o.createTensor({dataType:a??t,shape:r,dimensions:r,usage:n,writable:s,readable:i});return new ta({sessionId:e,context:o,tensor:u,dataType:t,shape:r,fallbackDataType:a})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Gm=(...e)=>new zd(...e)}),vn,Od,jm,l1=j(()=>{we(),Fr(),Fm(),u1(),lr(),vn=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),Od=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let r=Object.keys(e).sort(),n=Object.keys(t).sort();return r.length===n.length&&r.every((s,i)=>s===n[i]&&e[s]===t[s])},jm=class{constructor(e){this.tensorManager=Gm(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,jo(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){Oe("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){Oe("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let r of t)Oe("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${r}}`),this.tensorManager.releaseTensorId(r);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let r=this.mlContextCache.findIndex(n=>n.gpuDevice===e);if(r!==-1)return this.mlContextCache[r].mlContext;{let n=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:n}),n}}else if(e===void 0){let r=this.mlContextCache.findIndex(n=>n.options===void 0&&n.gpuDevice===void 0);if(r!==-1)return this.mlContextCache[r].mlContext;{let n=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:n}),n}}let t=this.mlContextCache.findIndex(r=>Od(r.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:r}),r}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let r=this.sessionIdsByMLContext.get(t);r||(r=new Set,this.sessionIdsByMLContext.set(t,r)),r.add(e),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e);let r=this.sessionIdsByMLContext.get(t);if(r.delete(e),r.size===0){this.sessionIdsByMLContext.delete(t);let n=this.mlContextCache.findIndex(s=>s.mlContext===t);n!==-1&&this.mlContextCache.splice(n,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){Oe("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,r,n,s){let i=vn.get(r);if(!i)throw new Error(`Unsupported ONNX data type: ${r}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,i,n,s)}async createTemporaryTensor(e,t,r){Oe("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${r}}`);let n=vn.get(t);if(!n)throw new Error(`Unsupported ONNX data type: ${t}`);let s=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,s,n,r,!1);let i=this.temporarySessionTensorIds.get(e);return i?i.push(s):this.temporarySessionTensorIds.set(e,[s]),s}uploadTensor(e,t){if(!Ve().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");Oe("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let r=await this.tensorManager.download(e);return Ko(r,t)}}registerMLTensor(e,t,r,n){let s=vn.get(r);if(!s)throw new Error(`Unsupported ONNX data type: ${r}`);let i=this.tensorManager.registerTensor(e,t,s,n);return Oe("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${s}, dimensions: ${n}} -> {tensorId: ${i}}`),i}registerMLConstant(e,t,r,n,s,i,a=!1){if(!i)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let u=i.get(o);if(!u)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+r>u.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let l=u.slice(t,t+r).buffer,c;switch(s.dataType){case"float32":c=new Float32Array(l);break;case"float16":c=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(l):new Uint16Array(l);break;case"int32":c=new Int32Array(l);break;case"uint32":c=new Uint32Array(l);break;case"int64":if(a){let p=eo(new Uint8Array(l),"int64");c=new Int32Array(p.buffer),s.dataType="int32"}else c=new BigInt64Array(l);break;case"uint64":c=new BigUint64Array(l);break;case"int8":c=new Int8Array(l);break;case"int4":case"uint4":case"uint8":c=new Uint8Array(l);break;default:throw new Error(`Unsupported data type: ${s.dataType} in creating WebNN Constant from external data.`)}return Oe("verbose",()=>`[WebNN] registerMLConstant {dataType: ${s.dataType}, shape: ${s.shape}}} ${a?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),n.constant(s,c)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let r=this.sessionGraphInputs.get(e);return r?r.includes(t):!1}isGraphOutput(e,t){let r=this.sessionGraphOutputs.get(e);return r?r.includes(t):!1}isGraphInputOutputTypeSupported(e,t,r=!0){let n=this.mlContextBySessionId.get(e),s=vn.get(Nr(t));return typeof s>"u"?!1:r?!!(n!=null&&n.opSupportLimits().input.dataTypes.includes(s)):!!(n!=null&&n.opSupportLimits().output.dataTypes.includes(s))}flush(){}}}),Zo=j(()=>{}),na,wi,$i,Ad,Rd,ia,to,Bd,Km,d1=j(()=>{lr(),Zo(),na=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),wi=[],$i=e=>Math.ceil(Number(e)/16)*16,Ad=e=>{for(let t=0;t<wi.length;t++){let r=wi[t];if(e<=r)return r}return Math.ceil(e/16)*16},Rd=1,ia=()=>Rd++,to=async(e,t,r,n)=>{let s=$i(r),i=e.device.createBuffer({size:s,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let a=e.getCommandEncoder();e.endComputePass(),a.copyBufferToBuffer(t,0,i,0,s),e.flush(),await i.mapAsync(GPUMapMode.READ);let o=i.getMappedRange();if(n){let u=n();return u.set(new Uint8Array(o,0,r)),u}else return new Uint8Array(o.slice(0,r))}finally{i.destroy()}},Bd=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of na)wi.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let r=t.buffer,n=t.byteOffset,s=t.byteLength,i=$i(s),a=this.storageCache.get(e);if(!a)throw new Error("gpu data for uploading does not exist");if(Number(a.originalSize)!==s)throw new Error(`inconsistent data size. gpu data size=${a.originalSize}, data size=${s}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:i,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),u=o.getMappedRange();new Uint8Array(u).set(new Uint8Array(r,n,s)),o.unmap();let l=this.backend.device.createCommandEncoder();l.copyBufferToBuffer(o,0,a.gpuData.buffer,0,i),this.backend.device.queue.submit([l.finish()]),o.destroy(),Oe("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let r=this.storageCache.get(e);if(!r)throw new Error("source gpu data for memcpy does not exist");let n=this.storageCache.get(t);if(!n)throw new Error("destination gpu data for memcpy does not exist");if(r.originalSize!==n.originalSize)throw new Error("inconsistent source and destination gpu data size");let s=$i(r.originalSize),i=this.backend.getCommandEncoder();this.backend.endComputePass(),i.copyBufferToBuffer(r.gpuData.buffer,0,n.gpuData.buffer,0,s)}registerExternalBuffer(e,t,r){let n;if(r){if(n=r[0],e===r[1])return Oe("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${n}, buffer is the same, skip.`),n;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
             Please use the previous external buffer!`)}else n=ia();return this.storageCache.set(n,{gpuData:{id:n,type:0,buffer:e},originalSize:t}),Oe("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${n}, registered.`),n}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),Oe("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let r=Ad(e),n,s=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,i=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(s||i){let o=(s?this.freeBuffers:this.freeUniformBuffers).get(r);o?o.length>0?n=o.pop():n=this.backend.device.createBuffer({size:r,usage:t}):n=this.backend.device.createBuffer({size:r,usage:t})}else n=this.backend.device.createBuffer({size:r,usage:t});let a={id:ia(),type:0,buffer:n};return this.storageCache.set(a.id,{gpuData:a,originalSize:Number(e)}),Oe("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${a.id}`),a}get(e){var t;return(t=this.storageCache.get(e))==null?void 0:t.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,r=this.storageCache.get(t);if(!r){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return Oe("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${r.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(r.gpuData.buffer),r.originalSize}async download(e,t){let r=this.storageCache.get(Number(e));if(!r)throw new Error("data does not exist");await to(this.backend,r.gpuData.buffer,r.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=na.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let r=this.freeBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let r=this.freeUniformBuffers.get(e.size)||[];t===void 0||r.length>=t?e.destroy():r.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(r=>{r.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(Oe("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(r=>{r.gpuData.buffer.destroy()}),this.storageCache=new Map)}},Km=(...e)=>new Bd(...e)}),Md,Ne,Ke=j(()=>{Md=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},Ne=e=>new Md(e)}),dn,vi,Je,st,he,Ge,ro,en,xr,pe,xn,U,ce,Zm,Qo,Nd,Qm,ke=j(()=>{we(),xe(),dn=64,vi=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},Je=(e,t=1)=>{let r=vi(e,t);return typeof r=="string"?r:r[0]},st=(e,t=1)=>{let r=vi(e,t);return typeof r=="string"?r:r[1]},he=(...e)=>{let t=[];return e.forEach(r=>{r.length!==0&&t.push({type:12,data:r},{type:12,data:B.computeStrides(r)})}),t},Ge=e=>e%4===0?4:e%2===0?2:1,ro=(e="f32",t,r="0")=>!t||t===1?`${e}(${r})`:`vec${t}<${e}>(${r})`,en=(e,t,r)=>e==="f32"?r:t===1?`f32(${r})`:`vec${t}<f32>(${r})`,xr=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,pe=(e,t,r,n)=>e.startsWith("uniforms.")&&r>4?typeof t=="string"?n==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:n==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:r>1?`${e}[${t}]`:e,xn=(e,t,r,n,s)=>{let i=typeof r=="number",a=i?r:r.length,o=[...new Array(a).keys()],u=a<2?"u32":a<=4?`vec${a}<u32>`:`array<u32, ${a}>`,l=vi(t,s),c=typeof l=="string"?l:l[1],p=typeof l=="string"?l:l[0],h={indices:u,value:c,storage:p,tensor:t},m=P=>typeof P=="string"?P:`${P}u`,g={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},y=i?"uniforms.":"",x=`${y}${e}_shape`,w=`${y}${e}_strides`,b="";for(let P=0;P<a-1;P++)b+=`
    let dim${P} = current / ${pe(w,P,a)};
    let rest${P} = current % ${pe(w,P,a)};
    indices[${P}] = dim${P};
    current = rest${P};
    `;b+=`indices[${a-1}] = current;`;let k=a<2?"":`
  fn o2i_${e}(offset: u32) -> ${h.indices} {
    var indices: ${h.indices};
    var current = offset;
    ${b}
    return indices;
  }`,S=P=>(g.offsetToIndices=!0,a<2?P:`o2i_${e}(${P})`),I=[];if(a>=2)for(let P=a-1;P>=0;P--)I.push(`${pe(w,P,a)} * (indices[${P}])`);let z=a<2?"":`
  fn i2o_${e}(indices: ${h.indices}) -> u32 {
    return ${I.join("+")};
  }`,O=P=>(g.indicesToOffset=!0,a<2?P:`i2o_${e}(${P})`),R=(...P)=>a===0?"0u":`${h.indices}(${P.map(m).join(",")})`,N=(P,H)=>a<2?`${P}`:`${pe(P,H,a)}`,G=(P,H,Y)=>a<2?`${P}=${Y};`:`${pe(P,H,a)}=${Y};`,ue={},ne=(P,H)=>{g.broadcastedIndicesToOffset=!0;let Y=`${H.name}broadcastedIndicesTo${e}Offset`;if(Y in ue)return`${Y}(${P})`;let ge=[];for(let Ze=a-1;Ze>=0;Ze--){let W=H.indicesGet("outputIndices",Ze+H.rank-a);ge.push(`${N(w,Ze)} * (${W} % ${N(x,Ze)})`)}return ue[Y]=`fn ${Y}(outputIndices: ${H.type.indices}) -> u32 {
             return ${ge.length>0?ge.join("+"):"0u"};
           }`,`${Y}(${P})`},se=(P,H)=>(()=>{if(h.storage===h.value)return`${e}[${P}]=${H};`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`${e}[${P}]=vec2<u32>(u32(${H}), select(0u, 0xFFFFFFFFu, ${H} < 0));`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`${e}[${P}]=vec2<u32>(u32(${H}), 0u);`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`${e}[${P}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${H}));`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),Se=P=>(()=>{if(h.storage===h.value)return`${e}[${P}]`;if(h.storage==="vec2<u32>"&&h.value==="i32")return`i32(${e}[${P}].x)`;if(h.storage==="vec2<u32>"&&h.value==="u32")return`u32(${e}[${P}].x)`;if(h.storage==="u32"&&h.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${P}] & 0xFFu), bool(${e}[${P}] & 0xFF00u), bool(${e}[${P}] & 0xFF0000u), bool(${e}[${P}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${h.storage} and value type ${h.value} yet`)})(),_e=a<2?"":`
  fn get_${e}ByIndices(indices: ${h.indices}) -> ${c} {
    return ${Se(`i2o_${e}(indices)`)};
  }`,Q=a<2?"":(()=>{let P=o.map(Y=>`d${Y}: u32`).join(", "),H=o.map(Y=>`d${Y}`).join(", ");return`
  fn get_${e}(${P}) -> ${c} {
    return get_${e}ByIndices(${R(H)});
  }`})(),ie=(...P)=>{if(P.length!==a)throw new Error(`indices length must be ${a}`);let H=P.map(m).join(",");return a===0?Se("0u"):a===1?Se(H[0]):(g.get=!0,g.getByIndices=!0,g.indicesToOffset=!0,`get_${e}(${H})`)},K=P=>a<2?Se(P):(g.getByIndices=!0,g.indicesToOffset=!0,`get_${e}ByIndices(${P})`),de=a<2?"":`
  fn set_${e}ByIndices(indices: ${h.indices}, value: ${c}) {
    ${se(`i2o_${e}(indices)`,"value")}
  }`,Re=a<2?"":(()=>{let P=o.map(Y=>`d${Y}: u32`).join(", "),H=o.map(Y=>`d${Y}`).join(", ");return`
  fn set_${e}(${P}, value: ${c}) {
    set_${e}ByIndices(${R(H)}, value);
  }`})();return{impl:()=>{let P=[],H=!1;return g.offsetToIndices&&(P.push(k),H=!0),g.indicesToOffset&&(P.push(z),H=!0),g.broadcastedIndicesToOffset&&(Object.values(ue).forEach(Y=>P.push(Y)),H=!0),g.set&&(P.push(Re),H=!0),g.setByIndices&&(P.push(de),H=!0),g.get&&(P.push(Q),H=!0),g.getByIndices&&(P.push(_e),H=!0),!i&&H&&P.unshift(`const ${x} = ${h.indices}(${r.join(",")});`,`const ${w} = ${h.indices}(${B.computeStrides(r).join(",")});`),P.join(`
`)},type:h,offsetToIndices:S,indicesToOffset:O,broadcastedIndicesToOffset:ne,indices:R,indicesGet:N,indicesSet:G,set:(...P)=>{if(P.length!==a+1)throw new Error(`indices length must be ${a}`);let H=P[a];if(typeof H!="string")throw new Error("value must be string");let Y=P.slice(0,a).map(m).join(",");return a===0?se("0u",H):a===1?se(Y[0],H):(g.set=!0,g.setByIndices=!0,g.indicesToOffset=!0,`set_${e}(${Y}, ${H})`)},setByOffset:se,setByIndices:(P,H)=>a<2?se(P,H):(g.setByIndices=!0,g.indicesToOffset=!0,`set_${e}ByIndices(${P}, ${H});`),get:ie,getByOffset:Se,getByIndices:K,usage:n,name:e,strides:w,shape:x,rank:a}},U=(e,t,r,n=1)=>xn(e,t,r,"input",n),ce=(e,t,r,n=1)=>xn(e,t,r,"output",n),Zm=(e,t,r)=>xn(e,t,r,"atomicOutput",1),Qo=(e,t,r,n=1)=>xn(e,t,r,"internal",n),Nd=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=dn){let t=typeof e=="number"?e:e[0],r=typeof e=="number"?1:e[1],n=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||r>this.limits.maxComputeWorkgroupSizeY||n>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${r}, ${n}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*r*n>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${r}, ${n}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let s=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,i=s?`@builtin(global_invocation_id) global_id : vec3<u32>,
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
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Qm=(e,t)=>new Nd(e,t)}),Pd,sa,Dd,Ud,Wd,qd,xt,Xm,Ym,Er=j(()=>{we(),xe(),Ke(),ke(),Pd=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},sa=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Dd=(e,t)=>B.sortBasedOnPerm(e,sa(e.length,t)),Ud=(e,t,r,n)=>{let s=`fn perm(i: ${n.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`;for(let i=0;i<t;++i)s+=`a[${e[i]}]=i[${i}];`;return s+="return a;}"},Wd=(e,t)=>{let r=[],n=[];for(let s=0;s<e.length;++s)e[s]!==1&&r.push(e[s]),e[t[s]]!==1&&n.push(t[s]);return{newShape:r,newPerm:n}},qd=(e,t)=>{let r=0;for(let n=0;n<e.length;++n)if(t[e[n]]!==1){if(e[n]<r)return!1;r=e[n]}return!0},xt=(e,t)=>{let r=e.dataType,n=e.dims.length,s=sa(n,t),i=Dd(e.dims,s),a=e.dims,o=i,u=n<2||qd(s,e.dims),l;if(u)return l=g=>{let y=U("input",r,a,4),x=ce("output",r,o,4);return`
  ${g.registerUniform("output_size","u32").declareVariables(y,x)}
  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    output[global_idx] = input[global_idx];
  }`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let g=B.size(i);return{outputs:[{dims:i,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(g/64/4)},programUniforms:[{type:12,data:Math.ceil(g/4)}]}},getShaderSource:l};let{newShape:c,newPerm:p}=Wd(e.dims,s),h=B.areEqual(p,[2,3,1]),m=B.areEqual(p,[3,1,2]);if(c.length===2||h||m){a=h?[c[0],c[1]*c[2]]:m?[c[0]*c[1],c[2]]:c,o=[a[1],a[0]];let g=16;return l=y=>{let x=U("a",r,a.length),w=ce("output",r,o.length);return`
  ${y.registerUniform("output_size","u32").declareVariables(x,w)}
  var<workgroup> tile : array<array<${w.type.value}, ${g+1}>, ${g}>;
  ${y.mainStart([g,g,1])}
    let stride = (uniforms.output_shape[1] - 1) / ${g} + 1;
    let workgroup_id_x = workgroup_index % stride;
    let workgroup_id_y = workgroup_index / stride;
    let input_col = workgroup_id_y * ${g}u + local_id.x;
    let input_row = workgroup_id_x * ${g}u + local_id.y;
    if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
      tile[local_id.y][local_id.x] = ${x.getByIndices(`${x.type.indices}(input_row, input_col)`)};
    }
    workgroupBarrier();

    let output_col = workgroup_id_x * ${g}u + local_id.x;
    let output_row = workgroup_id_y * ${g}u + local_id.y;
    if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
      ${w.setByIndices(`${w.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
    }
  }`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let y=B.size(i);return{outputs:[{dims:i,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/g),y:Math.ceil(o[0]/g)},programUniforms:[{type:12,data:y},...he(a,o)]}},getShaderSource:l}}return l=g=>{let y=U("a",r,a.length),x=ce("output",r,o.length);return`
  ${g.registerUniform("output_size","u32").declareVariables(y,x)}

  ${Ud(s,n,y,x)}

  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${x.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${x.setByOffset("global_idx",y.getByIndices("aIndices"))}
  }`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let g=B.size(i);return{outputs:[{dims:i,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:[{type:12,data:g},...he(a,o)]}},getShaderSource:l}},Xm=(e,t)=>{Pd(e.inputs,t.perm),e.compute(xt(e.inputs[0],t.perm))},Ym=e=>Ne({perm:e.perm})}),Ld,Vd,Hd,Fd,Gd,jd,Kd,Zd,Qd,Xd,It,Jm,eg,tg,rg,ng,ig,sg,ag,og,ug,c1=j(()=>{we(),xe(),ke(),Xo(),Er(),Ld={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},Vd={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},Hd={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},Fd={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},Gd=(e,t)=>{let r=[];for(let n=t-e;n<t;++n)r.push(n);return r},jd=(e,t)=>{let r=[],n=e.length;for(let i=0;i<n;i++)t.indexOf(i)===-1&&r.push(e[i]);let s=t.map(i=>e[i]);return[r,s]},Kd=(e,t)=>{let r=e.length+t.length,n=[],s=0;for(let i=0;i<r;i++)t.indexOf(i)===-1?n.push(e[s++]):n.push(1);return n},Zd=(e,t)=>{for(let r=0;r<e.length;++r)if(e[e.length-r-1]!==t-1-r)return!1;return!0},Qd=(e,t)=>{let r=[];if(!Zd(e,t)){for(let n=0;n<t;++n)e.indexOf(n)===-1&&r.push(n);e.forEach(n=>r.push(n))}return r},Xd=(e,t,r,n,s,i,a)=>{let o=r[0].dims,u=B.size(i),l=B.size(a),c=U("_A",r[0].dataType,o),p=ce("output",s,i),h=64;u===1&&(h=256);let m=`
          var<workgroup> aBestValues : array<f32, ${h}>;
       `,g=y=>`
        ${y.registerUniform("reduceSize","u32").declareVariables(c,p)}
        ${m}
        fn DIV_CEIL(a : u32, b : u32) -> u32 {
          return ((a - 1u) / b + 1u);
         }
         ${y.mainStart(h)}

          let outputIndex = global_idx / ${h};
          let offset = outputIndex * uniforms.reduceSize;

          var bestValue = f32(${Hd[n]});
          let Length = uniforms.reduceSize;
          for (var k = local_idx; k < Length; k = k + ${h}) {
           let candidate = f32(${c.getByOffset("offset + k")});
           bestValue = ${Ld[n]};
          }
          aBestValues[local_idx] = bestValue;
          workgroupBarrier();

         var reduceSize = min(Length, ${h}u);
         for (var currentSize = reduceSize / 2u; reduceSize > 1u;
             currentSize = reduceSize / 2u) {
           let interval = DIV_CEIL(reduceSize, 2u);
           if (local_idx < currentSize) {
            let candidate = aBestValues[local_idx + interval];
            bestValue = ${Vd[n]};
            aBestValues[local_idx] = bestValue;
           }
           reduceSize = interval;
           workgroupBarrier();
         }

         if (local_idx == 0u) {
          ${p.setByOffset("outputIndex",`${n==="mean"?`${p.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${p.type.storage}(${Fd[n]})`}`)};
         }
        }`;return{name:e,shaderCache:{hint:`${t};${h}`,inputDependencies:["type"]},getShaderSource:g,getRunData:()=>({outputs:[{dims:i,dataType:s}],dispatchGroup:{x:u},programUniforms:[{type:12,data:l}]})}},It=(e,t,r,n)=>{let s=e.inputs.length===1?r:no(e.inputs,r),i=s.axes;i.length===0&&!s.noopWithEmptyAxes&&(i=e.inputs[0].dims.map((m,g)=>g));let a=B.normalizeAxes(i,e.inputs[0].dims.length),o=a,u=e.inputs[0],l=Qd(o,e.inputs[0].dims.length);l.length>0&&(u=e.compute(xt(e.inputs[0],l),{inputs:[0],outputs:[-1]})[0],o=Gd(o.length,u.dims.length));let[c,p]=jd(u.dims,o),h=c;s.keepDims&&(h=Kd(c,a)),e.compute(Xd(t,s.cacheKey,[u],n,e.inputs[0].dataType,h,p),{inputs:[u]})},Jm=(e,t)=>{It(e,"ReduceMeanShared",t,"mean")},eg=(e,t)=>{It(e,"ReduceL1Shared",t,"l1")},tg=(e,t)=>{It(e,"ReduceL2Shared",t,"l2")},rg=(e,t)=>{It(e,"ReduceLogSumExpShared",t,"logSumExp")},ng=(e,t)=>{It(e,"ReduceMaxShared",t,"max")},ig=(e,t)=>{It(e,"ReduceMinShared",t,"min")},sg=(e,t)=>{It(e,"ReduceProdShared",t,"prod")},ag=(e,t)=>{It(e,"ReduceSumShared",t,"sum")},og=(e,t)=>{It(e,"ReduceSumSquareShared",t,"sumSquare")},ug=(e,t)=>{It(e,"ReduceLogSumShared",t,"logSum")}}),Ct,Yd,ji,no,zt,Jd,ec,tc,rc,nc,ic,sc,ac,oc,uc,Ot,lg,dg,cg,pg,fg,hg,mg,gg,_g,yg,Xo=j(()=>{we(),xe(),Ke(),ke(),c1(),Ct=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},Yd=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],ji=(e,t,r,n,s,i,a=!1,o=!1)=>{let u=[],l=r[0].dims,c=l.length,p=B.normalizeAxes(s,c),h=!o&&p.length===0;l.forEach((y,x)=>{h||p.indexOf(x)>=0?a&&u.push(1):u.push(y)});let m=u.length,g=B.size(u);return{name:e,shaderCache:t,getShaderSource:y=>{let x=[],w=U("_A",r[0].dataType,c),b=ce("output",i,m),k=n(w,b,p),S=k[2];for(let I=0,z=0;I<c;I++)h||p.indexOf(I)>=0?(a&&z++,S=`for(var j${I}: u32 = 0; j${I} < ${l[I]}; j${I}++) {
                  ${k[2].includes("last_index")?`let last_index = j${I};`:""}
                  ${w.indicesSet("input_indices",I,`j${I}`)}
                  ${S}
                }`):(x.push(`${w.indicesSet("input_indices",I,b.indicesGet("output_indices",z))};`),z++);return`

        ${y.registerUniform("output_size","u32").declareVariables(w,b)}

        ${y.mainStart()}
          ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          var input_indices: ${w.type.indices};
          let output_indices = ${b.offsetToIndices("global_idx")};

          ${x.join(`
`)}
          ${k[0]}       // init ops for reduce max/min
          ${k[1]}
          ${S}
          ${k[3]}
          ${k.length===4?b.setByOffset("global_idx","value"):k.slice(4).join(`
`)}
        }`},getRunData:()=>({outputs:[{dims:u,dataType:i}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:[{type:12,data:g},...he(l,u)]})}},no=(e,t)=>{let r=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(n=>r.push(Number(n))),Ne({axes:r,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},zt=(e,t,r,n)=>{let s=e.inputs,i=s.length===1?r:no(s,r);e.compute(ji(t,{hint:i.cacheKey,inputDependencies:["rank"]},[s[0]],i.noopWithEmptyAxes&&i.axes.length===0?Yd:n,i.axes,s[0].dataType,i.keepDims,i.noopWithEmptyAxes),{inputs:[0]})},Jd=(e,t)=>{Ct(e.inputs),zt(e,"ReduceLogSum",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,"value = log(value);"])},ec=(e,t)=>{Ct(e.inputs),zt(e,"ReduceL1",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += abs(${r.getByIndices("input_indices")});`,""])},tc=(e,t)=>{Ct(e.inputs),zt(e,"ReduceL2",t,(r,n)=>[`var t = ${n.type.value}(0); var value = ${n.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},rc=(e,t)=>{Ct(e.inputs),zt(e,"ReduceLogSumExp",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += exp(${r.getByIndices("input_indices")});`,"value = log(value);"])},nc=(e,t)=>{Ct(e.inputs),zt(e,"ReduceMax",t,(r,n,s)=>{let i=[];for(let a=0;a<r.rank;a++)(s.indexOf(a)>=0||s.length===0)&&i.push(r.indicesSet("input_indices",a,0));return[`${i.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = max(value, ${r.getByIndices("input_indices")});`,""]})},ic=(e,t)=>{Ct(e.inputs),zt(e,"ReduceMean",t,(r,n,s)=>{let i=1;for(let a=0;a<r.rank;a++)(s.indexOf(a)>=0||s.length===0)&&(i*=e.inputs[0].dims[a]);return["var sum = f32(0);","",`sum += f32(${r.getByIndices("input_indices")});`,`let value = ${n.type.value}(sum / ${i});`]})},sc=(e,t)=>{Ct(e.inputs),zt(e,"ReduceMin",t,(r,n,s)=>{let i=[];for(let a=0;a<r.rank;a++)(s.indexOf(a)>=0||s.length===0)&&i.push(`input_indices[${a}] = 0;`);return[`${i.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};`,`value = min(value, ${r.getByIndices("input_indices")});`,""]})},ac=(e,t)=>{Ct(e.inputs),zt(e,"ReduceProd",t,(r,n)=>[`var value = ${n.type.storage}(1);`,"",`value *= ${r.getByIndices("input_indices")};`,""])},oc=(e,t)=>{Ct(e.inputs),zt(e,"ReduceSum",t,(r,n)=>[`var value = ${n.type.storage}(0);`,"",`value += ${r.getByIndices("input_indices")};`,""])},uc=(e,t)=>{Ct(e.inputs),zt(e,"ReduceSumSquare",t,(r,n)=>[`var t = ${n.type.value}(0); var value = ${n.type.value}(0);`,"",`t = ${r.getByIndices("input_indices")}; value += t * t;`,""])},Ot=(e,t,r)=>{if(t.length===0)return r;let n=1,s=1;for(let i=0;i<t.length;i++)t.indexOf(i)===-1?n*=e[i]:s*=e[i];return s<32&&n>1024},lg=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ic(e,t):Jm(e,t)},dg=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ec(e,t):eg(e,t)},cg=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?tc(e,t):tg(e,t)},pg=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?rc(e,t):rg(e,t)},fg=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?nc(e,t):ng(e,t)},hg=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?sc(e,t):ig(e,t)},mg=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?ac(e,t):sg(e,t)},gg=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?oc(e,t):ag(e,t)},_g=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?uc(e,t):og(e,t)},yg=(e,t)=>{Ot(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Jd(e,t):ug(e,t)}}),aa,bg,wg,io,p1=j(()=>{we(),Ke(),Xo(),aa=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},bg=(e,t)=>{aa(e.inputs);let r=(n,s,i)=>{let a=[];for(let o=0;o<n.rank;o++)(i.indexOf(o)>=0||i.length===0)&&a.push(`input_indices[${o}] = 0;`);return[`${a.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${n.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
         value = ${n.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",s.setByOffset("global_idx","best_index")]};e.compute(ji("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},wg=(e,t)=>{aa(e.inputs);let r=(n,s,i)=>{let a=[];for(let o=0;o<n.rank;o++)(i.indexOf(o)>=0||i.length===0)&&a.push(`input_indices[${o}] = 0;`);return[`${a.join(`
`)}`,`var value = ${n.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${n.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
         value = ${n.getByIndices("input_indices")};
         best_index = i32(last_index);
       }`,"",s.setByOffset("global_idx","best_index")]};e.compute(ji("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],r,[t.axis],7,t.keepDims),{inputs:[0]})},io=e=>Ne(e)}),lc,xi,dc,cc,pc,ei,fc,$g,Yo=j(()=>{we(),xe(),Zo(),ke(),lc=(e,t)=>{let r=e[0],n=e[1],s=e[2],i=e[3],a=e[4],o=e[5];if(a&&o)throw new Error("Attention cannot have both past and attention_bias");if(r.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let u=r.dims[0],l=r.dims[1],c=r.dims[2];if(s.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(n.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(n.dims[0]!==c)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(s.dims[0]!==n.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let p=s.dims[0]/3,h=p,m=h;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let k of t.qkvHiddenSizes)if(k%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");p=t.qkvHiddenSizes[0],h=t.qkvHiddenSizes[1],m=t.qkvHiddenSizes[2]}let g=l;if(p!==h)throw new Error("qkv_hidden_sizes first element should be same as the second");if(s.dims[0]!==p+h+m)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let y=0;if(a){if(h!==m)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(a.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(a.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(a.dims[1]!==u)throw new Error('Input "past" second dimension must be batch_size');if(a.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(a.dims[4]!==h/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(y=a.dims[3])}let x=g+y,w=-1,b=0;if(i)throw new Error("Mask not supported");if(a)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==u||o.dims[1]!==t.numHeads||o.dims[2]!==l||o.dims[3]!==x)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:l,pastSequenceLength:y,kvSequenceLength:g,totalSequenceLength:x,maxSequenceLength:w,inputHiddenSize:c,hiddenSize:p,vHiddenSize:m,headSize:Math.floor(p/t.numHeads),vHeadSize:Math.floor(m/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:b,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},xi=(e,t,r)=>t&&e?`
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
    `,dc=(e,t,r,n,s,i,a,o)=>{let u=Ge(a?1:i),l=64,c=i/u;c<l&&(l=32);let p=Math.ceil(i/u/l),h=[{type:12,data:t},{type:12,data:r},{type:12,data:n},{type:12,data:s},{type:12,data:c},{type:12,data:p}],m=Je(e.dataType,u),g=st(1,u),y=["type"];a&&y.push("type"),o&&y.push("type");let x=w=>{let b=ce("x",e.dataType,e.dims,u),k=[b],S=a?U("seq_lens",a.dataType,a.dims):void 0;S&&k.push(S);let I=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;I&&k.push(I);let z=st(e.dataType),O=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
  var<workgroup> thread_max: array<f32, ${l}>;
  var<workgroup> thread_sum: array<f32, ${l}>;
  ${w.registerUniforms(O).declareVariables(...k)}
  ${w.mainStart([l,1,1])}
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let sequence_length = uniforms.sequence_length;
    var total_sequence_length = uniforms.total_sequence_length;
    ${xi(S,I,!1)}
    let local_offset = local_idx * uniforms.elements_per_thread;
    let offset = (global_idx / ${l}) * uniforms.total_sequence_length + local_offset;
    let seq_causal_length = ${a?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
    var thread_max_vector = ${g}(-3.402823e+38f);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      thread_max_vector = max(${g}(x[offset + i]), thread_max_vector);
    }
    thread_max[local_idx] = ${(()=>{switch(u){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var max_value =  f32(-3.402823e+38f);
    for (var i = 0u; i < ${l}; i++) {
      max_value = max(thread_max[i], max_value);
    }

    var sum_vector = ${g}(0);
    for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
      sum_vector += exp(${g}(x[offset + i]) - max_value);
    }
    thread_sum[local_idx] = ${(()=>{switch(u){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${u}`)}})()};
    workgroupBarrier();

    var sum: f32 = 0;
    for (var i = 0u; i < ${l}; i++) {
      sum += thread_sum[i];
    }

    if (sum == 0) {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        x[offset + i] = ${b.type.value}(${z}(1.0) / ${z}(seq_causal_length));
      }
    } else {
      for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
        var f32input = ${g}(x[offset + i]);
        x[offset + i] = ${b.type.value}(exp(f32input - max_value) / sum);
      }
    }
      ${a?`
        for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
          x[offset + total_seq_id] = ${b.type.value}(${z}(0));
        }`:""};
  }`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${l};${m};${u}`,inputDependencies:y},getShaderSource:x,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:s,z:t*r},programUniforms:h})}},cc=(e,t,r,n,s,i,a,o,u)=>{let l=a+i.kvSequenceLength,c=[i.batchSize,i.numHeads,i.sequenceLength,l],p=e>1&&n,h=i.kvNumHeads?i.kvNumHeads:i.numHeads,m=p?[i.batchSize,h,l,i.headSize]:void 0,g=i.nReps?i.nReps:1,y=i.scale===0?1/Math.sqrt(i.headSize):i.scale,x=Ge(i.headSize),w=i.headSize/x,b=12,k={x:Math.ceil(l/b),y:Math.ceil(i.sequenceLength/b),z:i.batchSize*i.numHeads},S=[{type:12,data:i.sequenceLength},{type:12,data:w},{type:12,data:l},{type:12,data:i.numHeads},{type:12,data:i.headSize},{type:1,data:y},{type:12,data:a},{type:12,data:i.kvSequenceLength},{type:12,data:g}],I=p&&n&&B.size(n.dims)>0,z=["type","type"];I&&z.push("type"),s&&z.push("type"),o&&z.push("type"),u&&z.push("type");let O=[{dims:c,dataType:t.dataType,gpuDataType:0}];p&&O.push({dims:m,dataType:t.dataType,gpuDataType:0});let R=N=>{let G=U("q",t.dataType,t.dims,x),ue=U("key",r.dataType,r.dims,x),ne=[G,ue];if(I){let de=U("past_key",n.dataType,n.dims,x);ne.push(de)}s&&ne.push(U("attention_bias",s.dataType,s.dims));let se=o?U("seq_lens",o.dataType,o.dims):void 0;se&&ne.push(se);let Se=u?U("total_sequence_length_input",u.dataType,u.dims):void 0;Se&&ne.push(Se);let _e=ce("output",t.dataType,c),Q=[_e];p&&Q.push(ce("present_key",t.dataType,m,x));let ie=st(1,x),K=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${b}u;

  var<workgroup> tileQ: array<${G.type.storage}, ${b*b}>;
  var<workgroup> tileK: array<${G.type.storage}, ${b*b}>;
  ${N.registerUniforms(K).declareVariables(...ne,...Q)}
  ${N.mainStart([b,b,1])}
    // x holds the N and y holds the M
    let headIdx = workgroup_id.z % uniforms.num_heads;
    let kvHeadIdx = ${g===1?"headIdx":"headIdx / uniforms.n_reps"};
    let kv_num_heads = ${g===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
    let batchIdx = workgroup_id.z / uniforms.num_heads;
    let m = workgroup_id.y * TILE_SIZE;
    let n = workgroup_id.x * TILE_SIZE;
    let sequence_length = uniforms.M;
    var total_sequence_length = uniforms.N;
    ${xi(se,Se,!0)}
    let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
    let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
    ${I&&p?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
    let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
    ${p?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
    var value = ${ie}(0);
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
          value += ${ie}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
      }

      workgroupBarrier();
    }

    if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
      let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
      let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
      var sum: f32 = ${(()=>{switch(x){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${x}`)}})()};
        output[outputIdx] = ${_e.type.value} (sum * uniforms.alpha) + ${s?"attention_bias[outputIdx]":"0.0"};
    }
  }`};return{name:"AttentionProbs",shaderCache:{hint:`${x};${s!==void 0};${n!==void 0};${e}`,inputDependencies:z},getRunData:()=>({outputs:O,dispatchGroup:k,programUniforms:S}),getShaderSource:R}},pc=(e,t,r,n,s,i,a=void 0,o=void 0)=>{let u=i+s.kvSequenceLength,l=s.nReps?s.nReps:1,c=s.vHiddenSize*l,p=e>1&&n,h=s.kvNumHeads?s.kvNumHeads:s.numHeads,m=p?[s.batchSize,h,u,s.headSize]:void 0,g=[s.batchSize,s.sequenceLength,c],y=12,x={x:Math.ceil(s.vHeadSize/y),y:Math.ceil(s.sequenceLength/y),z:s.batchSize*s.numHeads},w=[{type:12,data:s.sequenceLength},{type:12,data:u},{type:12,data:s.vHeadSize},{type:12,data:s.numHeads},{type:12,data:s.headSize},{type:12,data:c},{type:12,data:i},{type:12,data:s.kvSequenceLength},{type:12,data:l}],b=p&&n&&B.size(n.dims)>0,k=["type","type"];b&&k.push("type"),a&&k.push("type"),o&&k.push("type");let S=[{dims:g,dataType:t.dataType,gpuDataType:0}];p&&S.push({dims:m,dataType:t.dataType,gpuDataType:0});let I=z=>{let O=U("probs",t.dataType,t.dims),R=U("v",r.dataType,r.dims),N=[O,R];b&&N.push(U("past_value",n.dataType,n.dims));let G=a?U("seq_lens",a.dataType,a.dims):void 0;a&&N.push(G);let ue=o?U("total_sequence_length_input",o.dataType,o.dims):void 0;o&&N.push(ue);let ne=[ce("output",t.dataType,g)];p&&ne.push(ce("present_value",t.dataType,m));let se=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
  const TILE_SIZE = ${y}u;
  var<workgroup> tileQ: array<${O.type.value}, ${y*y}>;
  var<workgroup> tileV: array<${O.type.value}, ${y*y}>;
  ${z.registerUniforms(se).declareVariables(...N,...ne)}
  ${z.mainStart([y,y,1])}
   let headIdx = workgroup_id.z % uniforms.num_heads;
   let batchIdx = workgroup_id.z / uniforms.num_heads;
   let kvHeadIdx = ${l===1?"headIdx":"headIdx / uniforms.n_reps"};
   let kv_num_heads = ${l===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
   let m = global_id.y;
   let n = global_id.x;
   let sequence_length = uniforms.M;
   var total_sequence_length = uniforms.K;
   ${xi(G,ue,!0)}
   let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
   let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
   ${b&&p?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
   let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
   ${p?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
   var value = ${O.type.storage}(0);
   for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
      if (m < uniforms.M && w + local_id.x < uniforms.K) {
        tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
      }
      if (n < uniforms.N && w + local_id.y < uniforms.K) {
        var idx = TILE_SIZE * local_id.y + local_id.x;
        ${b&&p?`
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
  }`};return{name:"AttentionScore",shaderCache:{hint:`${n!==void 0};${e}`,inputDependencies:k},getRunData:()=>({outputs:S,dispatchGroup:x,programUniforms:w}),getShaderSource:I}},ei=(e,t,r,n,s,i,a,o,u,l,c=void 0,p=void 0)=>{let h=Math.min(e.outputCount,1+(a?1:0)+(o?1:0)),m=h>1?l.pastSequenceLength:0,g=m+l.kvSequenceLength,y=u&&B.size(u.dims)>0?u:void 0,x=[t,r];h>1&&a&&B.size(a.dims)>0&&x.push(a),y&&x.push(y),c&&x.push(c),p&&x.push(p);let w=e.compute(cc(h,t,r,a,y,l,m,c,p),{inputs:x,outputs:h>1?[-1,1]:[-1]})[0];e.compute(dc(w,l.batchSize,l.numHeads,m,l.sequenceLength,g,c,p),{inputs:c&&p?[w,c,p]:[w],outputs:[]});let b=[w,n];h>1&&o&&B.size(o.dims)>0&&b.push(o),c&&b.push(c),p&&b.push(p),e.compute(pc(h,w,n,o,l,m,c,p),{inputs:b,outputs:h>1?[0,2]:[0]})},fc=(e,t)=>{let r=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],n=t.sequenceLength,s=t.inputHiddenSize,i=t.headSize,a=12,o={x:Math.ceil(t.headSize/a),y:Math.ceil(t.sequenceLength/a),z:t.batchSize*t.numHeads},u=[e.inputs[0],e.inputs[1],e.inputs[2]],l=[{type:12,data:n},{type:12,data:s},{type:12,data:i},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],c=p=>{let h=ce("output_q",u[0].dataType,r),m=ce("output_k",u[0].dataType,r),g=ce("output_v",u[0].dataType,r),y=U("input",u[0].dataType,u[0].dims),x=U("weight",u[1].dataType,u[1].dims),w=U("bias",u[2].dataType,u[2].dims),b=y.type.storage,k=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
  const TILE_SIZE = ${a}u;
  var<workgroup> tileInput: array<${b}, ${a*a}>;
  var<workgroup> tileWeightQ: array<${b}, ${a*a}>;
  var<workgroup> tileWeightK: array<${b}, ${a*a}>;
  var<workgroup> tileWeightV: array<${b}, ${a*a}>;
  ${p.registerUniforms(k).declareVariables(y,x,w,h,m,g)}
  ${p.mainStart([a,a,1])}
    let batchIndex = workgroup_id.z / uniforms.num_heads;
    let headNumber = workgroup_id.z % uniforms.num_heads;
    let m = global_id.y;
    let n = global_id.x;

    let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
    let biasOffsetQ = headNumber * uniforms.head_size;
    let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
    let biasOffsetV = uniforms.hidden_size + biasOffsetK;

    var valueQ = ${b}(0);
    var valueK = ${b}(0);
    var valueV = ${b}(0);
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
  }`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:r,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:l}),getShaderSource:c},{inputs:u,outputs:[-1,-1,-1]})},$g=(e,t)=>{let r=lc(e.inputs,t),[n,s,i]=fc(e,r);return ei(e,n,s,i,e.inputs[4],void 0,void 0,void 0,e.inputs[5],r)}}),hc,mc,gc,vg,f1=j(()=>{Wt(),we(),xe(),Ke(),ke(),hc=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let r=(n,s,i)=>{let a=s.length;if(a!==n.length)throw new Error(`${i}: num dimensions != ${a}`);s.forEach((o,u)=>{if(o!==n[u])throw new Error(`${i}: dim[${u}] do not match`)})};if(e[0].dims.length>1){let n=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);r(e[1].dims,n,"Invalid input scale"),r(e[2].dims,n,"Invalid input B"),r(e[3].dims,n,"Invalid input mean"),r(e[4].dims,n,"Invalid input var")}else r(e[1].dims,[1],"Invalid input scale"),r(e[2].dims,[1],"Invalid input B"),r(e[3].dims,[1],"Invalid input mean"),r(e[4].dims,[1],"Invalid input var")},mc=(e,t)=>{let{epsilon:r,spatial:n,format:s}=t,i=e[0].dims,a=n?Ge(i[i.length-1]):1,o=s==="NHWC"&&i.length>1?a:1,u=B.size(i)/a,l=n,c=l?i.length:i,p=U("x",e[0].dataType,e[0].dims,a),h=U("scale",e[1].dataType,e[1].dims,o),m=U("bias",e[2].dataType,e[2].dims,o),g=U("inputMean",e[3].dataType,e[3].dims,o),y=U("inputVar",e[4].dataType,e[4].dims,o),x=ce("y",e[0].dataType,c,a),w=()=>{let k="";if(n)k=`let cOffset = ${i.length===1?"0u":s==="NHWC"?`outputIndices[${i.length-1}] / ${a}`:"outputIndices[1]"};`;else if(s==="NCHW")k=`
            ${x.indicesSet("outputIndices","0","0")}
            let cOffset = ${x.indicesToOffset("outputIndices")};`;else{k=`var cIndices = ${h.type.indices}(0);
                       cIndices[0] = outputIndices[${i.length-1}];`;for(let S=1;S<h.rank;S++)k+=`cIndices[${S}] = outputIndices[${S}];`;k+=`let cOffset = ${h.indicesToOffset("cIndices")};`}return k},b=k=>`
  const epsilon = ${r};
  ${k.registerUniform("outputSize","u32").declareVariables(p,h,m,g,y,x)}
  ${k.mainStart()}
  ${k.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
    var outputIndices = ${x.offsetToIndices(`global_idx * ${a}`)};
    ${w()}
    let scale = ${h.getByOffset("cOffset")};
    let bias = ${m.getByOffset("cOffset")};
    let inputMean = ${g.getByOffset("cOffset")};
    let inputVar = ${y.getByOffset("cOffset")};
    let x = ${p.getByOffset("global_idx")};
    let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
    ${x.setByOffset("global_idx","value")}
  }`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${n}_${a}`,inputDependencies:l?["rank","type","type","type","type"]:void 0},getShaderSource:b,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l?[{type:12,data:u},...he(i)]:[{type:12,data:u}]})}},gc=e=>Ne(e),vg=(e,t)=>{let{inputs:r,outputCount:n}=e,s=gc({...t,outputCount:n});if(Le.webgpu.validateInputContent&&hc(r,s),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(mc(r,s))}}),_c,yc,xg,h1=j(()=>{xe(),ke(),_c=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},yc=e=>{let t=e[0].dims,r=e[0].dims[2],n=B.size(t)/4,s=e[0].dataType,i=U("input",s,t,4),a=U("bias",s,[r],4),o=U("residual",s,t,4),u=ce("output",s,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:l=>`
  const channels = ${r}u / 4;
  ${l.declareVariables(i,a,o,u)}

  ${l.mainStart()}
    ${l.guardAgainstOutOfBoundsWorkgroupSizes(n)}
    let value = ${i.getByOffset("global_idx")}
      + ${a.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
    ${u.setByOffset("global_idx","value")}
  }`}},xg=e=>{_c(e.inputs),e.compute(yc(e.inputs))}}),bc,Me,Sg,kg,Tg,Eg,Ig,Cg,zg,Og,Ag,wc,Rg,Bg,Mg,Ng,Rn,Pg,Mi,Dg,Ug,Wg,qg,Lg,Vg,Hg,Fg,Gg,jg,Kg,Zg,Qg,Xg,Yg,Jg,oa,e_,so,ao,t_,r_,n_,$c,vc,i_,Jo=j(()=>{we(),xe(),Ke(),ke(),bc=(e,t,r,n,s,i,a)=>{let o=Math.ceil(t/4),u="";typeof s=="string"?u=`${s}(a)`:u=s("a");let l=U("inputData",r,[o],4),c=ce("outputData",n,[o],4),p=[{name:"vec_size",type:"u32"}];return a&&p.push(...a),`
      ${e.registerUniforms(p).declareVariables(l,c)}

  ${i??""}

  ${e.mainStart()}
    ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

    let a = ${l.getByOffset("global_idx")};
    ${c.setByOffset("global_idx",u)}
  }`},Me=(e,t,r,n,s,i=e.dataType,a,o)=>{let u=[{type:12,data:Math.ceil(B.size(e.dims)/4)}];return a&&u.push(...a),{name:t,shaderCache:{hint:s,inputDependencies:["type"]},getShaderSource:l=>bc(l,B.size(e.dims),e.dataType,i,r,n,o),getRunData:l=>({outputs:[{dims:e.dims,dataType:i}],dispatchGroup:{x:Math.ceil(B.size(l[0].dims)/64/4)},programUniforms:u})}},Sg=e=>{e.compute(Me(e.inputs[0],"Abs","abs"))},kg=e=>{e.compute(Me(e.inputs[0],"Acos","acos"))},Tg=e=>{e.compute(Me(e.inputs[0],"Acosh","acosh"))},Eg=e=>{e.compute(Me(e.inputs[0],"Asin","asin"))},Ig=e=>{e.compute(Me(e.inputs[0],"Asinh","asinh"))},Cg=e=>{e.compute(Me(e.inputs[0],"Atan","atan"))},zg=e=>{e.compute(Me(e.inputs[0],"Atanh","atanh"))},Og=e=>Ne(e),Ag=(e,t)=>{let r;switch(t.to){case 10:r="vec4<f16>";break;case 1:r="vec4<f32>";break;case 12:r="vec4<u32>";break;case 6:r="vec4<i32>";break;case 9:r="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(Me(e.inputs[0],"Cast",r,void 0,t.cacheKey,t.to))},wc=e=>{let t,r,n=e.length>=2&&e[1].data!==0,s=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=n?e[1].getFloat32Array()[0]:-34028234663852886e22,r=s?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=n?e[1].getUint16Array()[0]:64511,r=s?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return Ne({min:t,max:r})},Rg=(e,t)=>{let r=t||wc(e.inputs),n=st(e.inputs[0].dataType);e.compute(Me(e.inputs[0],"Clip",s=>`clamp(${s}, vec4<${n}>(uniforms.min), vec4<${n}>(uniforms.max))`,void 0,r.cacheKey,void 0,[{type:e.inputs[0].dataType,data:r.min},{type:e.inputs[0].dataType,data:r.max}],[{name:"min",type:n},{name:"max",type:n}]),{inputs:[0]})},Bg=e=>{e.compute(Me(e.inputs[0],"Ceil","ceil"))},Mg=e=>{e.compute(Me(e.inputs[0],"Cos","cos"))},Ng=e=>{e.compute(Me(e.inputs[0],"Cosh","cosh"))},Rn=e=>Ne(e),Pg=(e,t)=>{let r=st(e.inputs[0].dataType);e.compute(Me(e.inputs[0],"Elu",n=>`elu_vf32(${n})`,`
  const elu_alpha_ = ${r}(${t.alpha});

  fn elu_f32(a: ${r}) -> ${r} {
  return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
  }

  fn elu_vf32(v: vec4<${r}>) -> vec4<${r}> {
  return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
  }`,t.cacheKey))},Mi=(e="f32")=>`
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
}`,Dg=e=>{let t=st(e.inputs[0].dataType);e.compute(Me(e.inputs[0],"Erf",r=>`erf_vf32(${r})`,Mi(t)))},Ug=e=>{e.compute(Me(e.inputs[0],"Exp","exp"))},Wg=e=>{e.compute(Me(e.inputs[0],"Floor","floor"))},qg=e=>{let t=st(e.inputs[0].dataType);e.compute(Me(e.inputs[0],"Gelu",r=>`0.5 * ${r} * (1.0 + erf_vf32(${r} * 0.7071067811865475))`,Mi(t)))},Lg=(e,t)=>{let r=st(e.inputs[0].dataType);e.compute(Me(e.inputs[0],"LeakyRelu",n=>`select(leaky_relu_alpha_ * ${n}, ${n}, ${n} >= vec4<${r}>(0.0))`,`const leaky_relu_alpha_ = ${r}(${t.alpha});`,t.cacheKey))},Vg=e=>{e.compute(Me(e.inputs[0],"Not",t=>`!${t}`))},Hg=e=>{e.compute(Me(e.inputs[0],"Neg",t=>`-${t}`))},Fg=e=>{e.compute(Me(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Gg=e=>{let t=st(e.inputs[0].dataType);e.compute(Me(e.inputs[0],"Relu",r=>`select(vec4<${t}>(0.0), ${r}, ${r} > vec4<${t}>(0.0))`))},jg=e=>{e.compute(Me(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Kg=e=>Ne(e),Zg=(e,t)=>{let r=st(e.inputs[0].dataType);e.compute(Me(e.inputs[0],"HardSigmoid",n=>`max(vec4<${r}>(0.0), min(vec4<${r}>(1.0), ${t.alpha} * ${n} + vec4<${r}>(${t.beta})))`,void 0,t.cacheKey))},Qg=e=>{e.compute(Me(e.inputs[0],"Sin","sin"))},Xg=e=>{e.compute(Me(e.inputs[0],"Sinh","sinh"))},Yg=e=>{e.compute(Me(e.inputs[0],"Sqrt","sqrt"))},Jg=e=>{e.compute(Me(e.inputs[0],"Tan","tan"))},oa=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,e_=e=>{e.compute(Me(e.inputs[0],"Tanh",oa))},so=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
  return ${oa("v")};
}
`,ao=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,t_=e=>{let t=st(e.inputs[0].dataType);e.compute(Me(e.inputs[0],"FastGelu",ao,so(t),void 0,e.inputs[0].dataType))},r_=(e,t)=>{let r=st(e.inputs[0].dataType);return e.compute(Me(e.inputs[0],"ThresholdedRelu",n=>`select(vec4<${r}>(0.0), ${n}, ${n} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${r}>(${t.alpha});`,t.cacheKey)),0},n_=e=>{e.compute(Me(e.inputs[0],"Log","log"))},$c=(e,t)=>`
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
`,vc=e=>`quick_gelu_impl(${e})`,i_=(e,t)=>{let r=st(e.inputs[0].dataType);e.compute(Me(e.inputs[0],"QuickGelu",vc,$c(r,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),xc,Sc,s_,m1=j(()=>{xe(),ke(),Jo(),xc=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Sc=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let r=U("input",e[0].dataType,e[0].dims,4),n=U("bias",e[0].dataType,[e[0].dims[2]],4),s=ce("output",e[0].dataType,t,4),i=B.size(t)/4,a=Je(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)}}),getShaderSource:o=>`
  const M_SQRT2 = sqrt(2.0);
  const halfChannels = ${e[0].dims[2]/4/2}u;

  ${o.declareVariables(r,n,s)}

  ${Mi(a)}

  ${o.mainStart()}
    ${o.guardAgainstOutOfBoundsWorkgroupSizes(i)}
    let biasIdx = global_idx % halfChannels;
    let batchIndex = global_idx / halfChannels;
    let inputOffset = biasIdx + batchIndex * halfChannels * 2;
    let valueLeft = input[inputOffset] + bias[biasIdx];
    let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
    let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

    ${s.setByOffset("global_idx","valueLeft * geluRight")}
  }`}},s_=e=>{xc(e.inputs),e.compute(Sc(e.inputs))}}),kc,Tc,At,a_,o_,u_,l_,d_,c_,p_,f_,h_,m_,g1=j(()=>{we(),xe(),ke(),kc=(e,t,r,n,s,i,a,o,u,l,c,p)=>{let h,m;typeof o=="string"?h=m=(b,k)=>`${o}((${b}),(${k}))`:typeof o=="function"?h=m=o:(h=o.scalar,m=o.vector);let g=ce("outputData",c,n.length,4),y=U("aData",u,t.length,4),x=U("bData",l,r.length,4),w;if(s)if(i){let b=B.size(t)===1,k=B.size(r)===1,S=t.length>0&&t[t.length-1]%4===0,I=r.length>0&&r[r.length-1]%4===0;b||k?w=g.setByOffset("global_idx",m(b?`${y.type.value}(${y.getByOffset("0")}.x)`:y.getByOffset("global_idx"),k?`${x.type.value}(${x.getByOffset("0")}.x)`:x.getByOffset("global_idx"))):w=`
            let outputIndices = ${g.offsetToIndices("global_idx * 4u")};
            let offsetA = ${y.broadcastedIndicesToOffset("outputIndices",g)};
            let offsetB = ${x.broadcastedIndicesToOffset("outputIndices",g)};
            ${g.setByOffset("global_idx",m(a||S?y.getByOffset("offsetA / 4u"):`${y.type.value}(${y.getByOffset("offsetA / 4u")}[offsetA % 4u])`,a||I?x.getByOffset("offsetB / 4u"):`${x.type.value}(${x.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
          `}else w=g.setByOffset("global_idx",m(y.getByOffset("global_idx"),x.getByOffset("global_idx")));else{if(!i)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let b=(k,S,I="")=>{let z=`aData[indexA${S}][componentA${S}]`,O=`bData[indexB${S}][componentB${S}]`;return`
            let outputIndices${S} = ${g.offsetToIndices(`global_idx * 4u + ${S}u`)};
            let offsetA${S} = ${y.broadcastedIndicesToOffset(`outputIndices${S}`,g)};
            let offsetB${S} = ${x.broadcastedIndicesToOffset(`outputIndices${S}`,g)};
            let indexA${S} = offsetA${S} / 4u;
            let indexB${S} = offsetB${S} / 4u;
            let componentA${S} = offsetA${S} % 4u;
            let componentB${S} = offsetB${S} % 4u;
            ${k}[${S}] = ${I}(${h(z,O)});
          `};c===9?w=`
            var data = vec4<u32>(0);
            ${b("data",0,"u32")}
            ${b("data",1,"u32")}
            ${b("data",2,"u32")}
            ${b("data",3,"u32")}
            outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:w=`
            ${b("outputData[global_idx]",0)}
            ${b("outputData[global_idx]",1)}
            ${b("outputData[global_idx]",2)}
            ${b("outputData[global_idx]",3)}
          `}return`
        ${e.registerUniform("vec_size","u32").declareVariables(y,x,g)}

        ${p??""}

        ${e.mainStart()}
        ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
        ${w}
      }`},Tc=(e,t,r,n,s,i,a=r.dataType)=>{let o=r.dims.map(y=>Number(y)??1),u=n.dims.map(y=>Number(y)??1),l=!B.areEqual(o,u),c=o,p=B.size(o),h=!1,m=!1,g=[l];if(l){let y=ln.calcShape(o,u,!1);if(!y)throw new Error("Can't perform binary op on the given tensors");c=y.slice(),p=B.size(c);let x=B.size(o)===1,w=B.size(u)===1,b=o.length>0&&o[o.length-1]%4===0,k=u.length>0&&u[u.length-1]%4===0;g.push(x),g.push(w),g.push(b),g.push(k);let S=1;for(let I=1;I<c.length;I++){let z=o[o.length-I],O=u[u.length-I];if(z===O)S*=z;else break}S%4===0?(m=!0,h=!0):(x||w||b||k)&&(h=!0)}else h=!0;return g.push(h),{name:e,shaderCache:{hint:t+g.map(y=>y.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:y=>kc(y,o,u,c,h,l,m,s,r.dataType,n.dataType,a,i),getRunData:()=>({outputs:[{dims:c,dataType:a}],dispatchGroup:{x:Math.ceil(p/64/4)},programUniforms:[{type:12,data:Math.ceil(B.size(c)/4)},...he(o,u,c)]})}},At=(e,t,r,n,s,i)=>{e.compute(Tc(t,s??"",e.inputs[0],e.inputs[1],r,n,i))},a_=e=>{At(e,"Add",(t,r)=>`${t}+${r}`)},o_=e=>{At(e,"Div",(t,r)=>`${t}/${r}`)},u_=e=>{At(e,"Equal",{scalar:(t,r)=>`u32(${t}==${r})`,vector:(t,r)=>`vec4<u32>(${t}==${r})`},void 0,void 0,9)},l_=e=>{At(e,"Mul",(t,r)=>`${t}*${r}`)},d_=e=>{let t=U("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;At(e,"Pow",{scalar:(r,n)=>`pow_custom(${r},${n})`,vector:(r,n)=>`pow_vector_custom(${r},${n})`},`
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
      `)},c_=e=>{At(e,"Sub",(t,r)=>`${t}-${r}`)},p_=e=>{At(e,"Greater",{scalar:(t,r)=>`u32(${t}>${r})`,vector:(t,r)=>`vec4<u32>(${t}>${r})`},void 0,void 0,9)},f_=e=>{At(e,"Less",{scalar:(t,r)=>`u32(${t}<${r})`,vector:(t,r)=>`vec4<u32>(${t}<${r})`},void 0,void 0,9)},h_=e=>{At(e,"GreaterOrEqual",{scalar:(t,r)=>`u32(${t}>=${r})`,vector:(t,r)=>`vec4<u32>(${t}>=${r})`},void 0,void 0,9)},m_=e=>{At(e,"LessOrEqual",{scalar:(t,r)=>`u32(${t}<=${r})`,vector:(t,r)=>`vec4<u32>(${t}<=${r})`},void 0,void 0,9)}}),Ec,Ic,Cc,zc,g_,__,_1=j(()=>{we(),xe(),Ke(),ke(),Ec=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let r=0,n=e[r],s=n.dataType,i=n.dims.length;e.forEach((a,o)=>{if(o!==r){if(a.dataType!==s)throw new Error("input tensors should be one type");if(a.dims.length!==i)throw new Error("input tensors should have the same shape");a.dims.forEach((u,l)=>{if(l!==t&&u!==n.dims[l])throw new Error("non concat dimensions must match")})}})},Ic=(e,t)=>`
  fn calculateInputIndex(index: u32) -> u32 {
    let sizeInConcatAxis = array<u32, ${e}u>(${t});
    for (var i: u32 = 0u; i < ${e}; i += 1u ) {
      if (index < sizeInConcatAxis[i]) {
        return i;
      }
    }
    return ${e}u;
  }`,Cc=(e,t)=>{let r=e.length,n=[];for(let s=0;s<r;++s){let i=t.setByOffset("global_idx",e[s].getByIndices("indices"));r===1?n.push(i):s===0?n.push(`if (inputIndex == ${s}u) { ${i} }`):s===r-1?n.push(`else { ${i} }`):n.push(`else if (inputIndex == ${s}) { ${i} }`)}return n.join(`
`)},zc=(e,t,r,n)=>{let s=B.size(r),i=new Array(e.length),a=new Array(e.length),o=0,u=[],l=[],c=[{type:12,data:s}];for(let y=0;y<e.length;++y)o+=e[y].dims[t],i[y]=o,l.push(e[y].dims.length),a[y]=U(`input${y}`,n,l[y]),u.push("rank"),c.push({type:12,data:i[y]});for(let y=0;y<e.length;++y)c.push(...he(e[y].dims));c.push(...he(r));let p=ce("output",n,r.length),h=p.indicesGet("indices",t),m=Array.from(Array(i.length).keys()).map(y=>`uniforms.sizeInConcatAxis${y}`).join(","),g=y=>`

  ${(()=>{y.registerUniform("outputSize","u32");for(let x=0;x<e.length;x++)y.registerUniform(`sizeInConcatAxis${x}`,"u32");return y.declareVariables(...a,p)})()}

  ${Ic(i.length,m)}

  ${y.mainStart()}
    ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

    var indices = ${p.offsetToIndices("global_idx")};

    let inputIndex = calculateInputIndex(${h});
    if (inputIndex != 0u) {
      let sizeInConcatAxis = array<u32, ${i.length}u>(${m});
      ${h} -= sizeInConcatAxis[inputIndex - 1u];
    }

    ${Cc(a,p)}
  }`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:r,dataType:n}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:c}),getShaderSource:g}},g_=(e,t)=>{let r=e.inputs,n=r[0].dims,s=B.normalizeAxis(t.axis,n.length);Ec(r,s);let i=n.slice();i[s]=r.reduce((o,u)=>o+(u.dims.length>s?u.dims[s]:0),0);let a=r.filter(o=>B.size(o.dims)>0);e.compute(zc(a,s,i,r[0].dataType),{inputs:a})},__=e=>Ne({axis:e.axis})}),qr,Lr,Vr,eu,Gr=j(()=>{we(),xe(),qr=(e,t,r="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${r}(uniforms.clip_min)), ${t}(${r}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${r}(uniforms.alpha) * value + ${r}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${r}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
              value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
        `;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Lr=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Vr=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},eu=e=>{let t=(e==null?void 0:e.activation)||"";if(t==="HardSigmoid"){let[r,n]=(e==null?void 0:e.activation_params)||[.2,.5];return{activation:t,alpha:r,beta:n}}else if(t==="Clip"){let[r,n]=(e==null?void 0:e.activation_params)||[Vm,Hm];return{activation:t,clipMax:n,clipMin:r}}else if(t==="LeakyRelu"){let[r]=(e==null?void 0:e.activation_params)||[.01];return{activation:t,alpha:r}}return{activation:t}}}),tt,y_,tu=j(()=>{tt=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},y_=e=>`
      ${e?"value = value + getBiasByOutputCoords(coords);":""}
      `}),b_,y1=j(()=>{b_=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
      shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
  return dot(coords, vec4<i32>(
    i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),Hn,ru,nu=j(()=>{we(),xe(),ke(),Gr(),Hn=(e,t,r,n,s)=>{let i=n-r;return`
      ${Array.from({length:r}).map((a,o)=>`
      if (${pe(t.shape,o,t.rank)} != 1) {
        ${t.indicesSet(e,o,pe(s,o+i,n))}
      } else {
        ${t.indicesSet(e,o,0)}
      }`).join("")}
`},ru=(e,t,r,n,s=!1,i)=>{let a=e[0].dims,o=e[1].dims,u=a[a.length-2],l=o[o.length-1],c=a[a.length-1],p=Ge(l),h=Ge(c),m=Ge(u),g=B.size(r)/p/m,y=e.length>2,x=n?n.slice(0,-2):r.slice(0,-2),w=[B.size(x),u,l],b=[{type:12,data:g},{type:12,data:u},{type:12,data:l},{type:12,data:c}];Lr(t,b),b.push(...he(x,a,o)),y&&b.push(...he(e[2].dims)),b.push(...he(w));let k=S=>{let I=Qo("batch_dims",e[0].dataType,x.length),z=U("a",e[0].dataType,a.length,h),O=U("b",e[1].dataType,o.length,p),R=ce("output",e[0].dataType,w.length,p),N=Je(R.type.tensor),G=qr(t,R.type.value,N),ue=[z,O],ne="";if(y){let _e=s?p:1;ue.push(U("bias",e[2].dataType,e[2].dims.length,_e)),ne=`${s?`value += bias[col / ${_e}];`:`value += ${R.type.value}(bias[row + i]);`}`}let se=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Vr(t,se);let Se=()=>{let _e=`var a_data: ${z.type.value};`;for(let Q=0;Q<h;Q++)_e+=`
              let b_data${Q} = b[(b_offset + (k + ${Q}) * uniforms.N + col) / ${p}];`;for(let Q=0;Q<m;Q++){_e+=`a_data = a[(a_offset + (row + ${Q}) * uniforms.K + k) / ${h}];`;for(let ie=0;ie<h;ie++)_e+=`
            values[${Q}] = fma(${O.type.value}(a_data${h===1?"":`[${ie}]`}), b_data${ie}, values[${Q}]);
`}return _e};return`
  ${S.registerUniforms(se).registerInternalVariables(I).declareVariables(...ue,R)}
  ${S.mainStart()}
    ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let col = (global_idx % (uniforms.N / ${p})) * ${p};
    var index1 = global_idx / (uniforms.N / ${p});
    let stride1 = uniforms.M / ${m};
    let row = (index1 % stride1) * ${m};
    let batch = index1 / stride1;

    ${r.length===2?"":`let batch_indices = ${I.offsetToIndices("batch")};`}

    var a_indices: ${z.type.indices};
    ${Hn("a_indices",z,z.rank-2,I.rank,"batch_indices")}
    ${z.indicesSet("a_indices",z.rank-2,0)}
    ${z.indicesSet("a_indices",z.rank-1,0)}
    let a_offset = ${z.indicesToOffset("a_indices")};

    var b_indices: ${O.type.indices};
    ${Hn("b_indices",O,O.rank-2,I.rank,"batch_indices")}
    ${O.indicesSet("b_indices",O.rank-2,0)}
    ${O.indicesSet("b_indices",O.rank-1,0)}
    let b_offset = ${O.indicesToOffset("b_indices")};
    var values: array<${R.type.value}, ${m}>;
    for (var k: u32 = 0u; k < uniforms.K; k = k + ${h}) {
      ${Se()}
    }
    for (var i = 0u; i < ${m}u; i++) {
      var value = values[i];
      ${ne}
      ${G}
      let cur_indices = ${R.type.indices}(batch, row + i, col);
      let offset = ${R.indicesToOffset("cur_indices")};
      ${R.setByOffset(`offset / ${p}`,"value")};
    }
  }
  `};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${p};${h};${m};${s}`,inputDependencies:y?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(g/64)},programUniforms:b}),getShaderSource:k}}}),Oc,Ac,oo,ua,Rc,uo,Bc,Ki,iu=j(()=>{we(),xe(),ke(),Gr(),nu(),tu(),Oc=(e,t)=>e?`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          kStart + inputRow,
          globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
        `:`
        mm_Asub[inputRow][inputCol] = mm_readA(batch,
          globalRow + innerRow,
          kStart / innerElementSize + inputCol${t?", batchIndices":""});
        `,Ac=(e,t)=>e?`
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
        }`,oo=(e,t,r="f32",n,s=!1,i=32,a=!1,o=32)=>{let u=t[1]*e[1],l=t[0]*e[0],c=s?u:i,p=s?i:u,h=c/t[0],m=i/t[1];if(!((s&&h===4&&e[1]===4||!s&&(h===3||h===4))&&c%t[0]===0&&i%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${s} is true, innerElementSize ${h} and workPerThread[1] ${e[1]} must be 4.
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
          ${Oc(s,n)}
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

          ${Ac(s,h)}
      }

      workgroupBarrier();
  }

  for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
      mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
  }
}`},ua=(e,t)=>e?`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              kStart + inputRow,
              globalRowStart + inputCol${t?", batchIndices":""});
            `:`
            mm_Asub[inputRow][inputCol] = mm_readA(batch,
              globalRowStart + inputRow,
              kStart + inputCol${t?", batchIndices":""});
            `,Rc=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",uo=(e,t,r="f32",n,s=!1,i=32,a=!1,o=32,u=!1)=>{let l=e[1]*t[1],c=e[0]*t[0],p=s?l:i,h=s?i:l;if(!(h%t[1]===0&&p%t[0]===0&&i%t[1]===0))throw new Error(`tileAHight ${h} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${p} must be divisible by workgroupSize[0]${t[0]}, tileInner ${i} must be divisible by workgroupSize[1]${t[1]}`);let m=h/t[1],g=p/t[0],y=i/t[1],x=u?`
    let localRow = i32(localId.y);
    let localCol = i32(localId.x);
    let globalRowStart = i32(workgroupId.y) * ${l};
    let globalColStart = i32(workgroupId.x) * ${c};

    // Loop over shared dimension.
    for (var t = 0; t < num_tiles; t = t + 1) {
      // Load one tile of A into local memory.
      for (var inputRow = localRow; inputRow < ${h}; inputRow = inputRow + ${t[1]}) {
        for (var inputCol = localCol; inputCol < ${p}; inputCol = inputCol + ${t[0]}) {
          ${ua(s,n)}
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
let tileColA = i32(localId.x) * ${g};
let tileRowB = i32(localId.y) * ${y};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
  // Load one tile of A into local memory.
  for (var innerRow = 0; innerRow < ${m}; innerRow = innerRow + 1) {
    for (var innerCol = 0; innerCol < ${g}; innerCol = innerCol + 1) {
      let inputRow = tileRowA + innerRow;
      let inputCol = tileColA + innerCol;
      ${ua(s,n)}
    }
  }

  // Load one tile of B into local memory.
  for (var innerRow = 0; innerRow < ${y}; innerRow = innerRow + 1) {
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
      ${Rc(s)}
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
`},Bc=(e,t,r,n,s=!1)=>{let[i,a,o,u]=n,l=Je(n[0].type.tensor);return`
    fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${i.type.indices}) -> ${tt(e,l)} {
      var value = ${tt(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
      {
        var aIndices: ${a.type.indices};
        ${Hn("aIndices",a,a.rank-2,i.rank,"batchIndices")}
        ${a.indicesSet("aIndices",a.rank-2,"u32(row)")}
        ${a.indicesSet("aIndices",a.rank-1,"u32(colIn)")}
        value = ${a.getByIndices("aIndices")};
      }
      return value;
    }

    fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${i.type.indices}) -> ${tt(e,l)} {
      var value = ${tt(e,l)}(0.0);
      let col = colIn * ${e};
      if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
      {
        var bIndices: ${o.type.indices};
        ${Hn("bIndices",o,o.rank-2,i.rank,"batchIndices")}
        ${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
        ${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
        value = ${o.getByIndices("bIndices")};
      }
      return value;
    }

    fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${tt(e,l)}) {
      let col = colIn * ${e};
      if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
        var value = valueIn;
        let coords = vec3<i32>(batch, row, colIn);
        ${t?`value = value + ${s?"bias[colIn]":`${tt(e,l)}(bias[row])`};`:""}
        ${r}
        ${u.setByIndices("vec3<u32>(coords)","value")}
      }
    }
    `},Ki=(e,t,r,n,s=!1,i)=>{let a=e[0].dims,o=e[1].dims,u=a.slice(0,-2),l=o.slice(0,-2),c=n?n.slice(0,-2):r.slice(0,-2),p=B.size(c),h=a[a.length-2],m=a[a.length-1],g=o[o.length-1],y=m%4===0&&g%4===0,x=h<=8?[4,1,1]:[4,4,1],w=[8,8,1],b=[Math.ceil(g/w[0]/x[0]),Math.ceil(h/w[1]/x[1]),Math.ceil(p/w[2]/x[2])],k=y?4:1,S=[...u,h,m/k],I=S.length,z=[...l,m,g/k],O=z.length,R=[p,h,g/k],N=[{type:6,data:h},{type:6,data:g},{type:6,data:m}];Lr(t,N),N.push(...he(c,S,z));let G=["rank","rank"],ue=e.length>2;ue&&(N.push(...he(e[2].dims)),G.push("rank")),N.push(...he(R));let ne=se=>{let Se=c.length,_e=Qo("batchDims",e[0].dataType,Se,1),Q=Je(e[0].dataType),ie=U("a",e[0].dataType,I,k),K=U("b",e[1].dataType,O,k),de=ce("result",e[0].dataType,R.length,k),Re=[ie,K];if(ue){let Ze=s?k:1;Re.push(U("bias",e[2].dataType,e[2].dims.length,Ze))}let P=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Vr(t,P);let H=Je(de.type.tensor),Y=qr(t,de.type.value,H),ge=Bc(k,ue,Y,[_e,ie,K,de],s);return`
  ${se.registerUniforms(P).registerInternalVariables(_e).declareVariables(...Re,de)}
  ${ge}
  ${y?oo(x,w,Q,_e):uo(x,w,Q,_e)}
                   `};return{name:"MatMul",shaderCache:{hint:`${x};${t.activation};${y};${s}`,inputDependencies:G},getRunData:()=>({outputs:[{dims:i?i(r):r,dataType:e[0].dataType}],dispatchGroup:{x:b[0],y:b[1],z:b[2]},programUniforms:N}),getShaderSource:ne}}}),Mc,w_,b1=j(()=>{we(),lr(),ke(),Gr(),tu(),y1(),iu(),Mc=(e,t,r,n,s=!1,i,a=4,o=4,u=4,l="f32")=>{let c=N=>{switch(N){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${l}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${N} is not supported.`)}},p=N=>{switch(N){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${N} is not supported.`)}},h=e?`
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
    `,g=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",y=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",x=e?"row":"col",w=e?"col":"row",b=`
    let inChannels = i32(uniforms.w_shape[2]);
    let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
    let outRow = ${x} / outWidth;
    let outCol = ${x} % outWidth;

    let WRow = ${w} / (i32(uniforms.w_shape[1]) * inChannels);
    let WCol = ${w} / inChannels % i32(uniforms.w_shape[1]);
    let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
    let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
    let xCh = ${w} % inChannels;
    var resData = ${tt(a,l)}(0.0);
    // The bounds checking is always needed since we use it to pad zero for
    // the 'same' padding type.
    if (xRow >= 0 && xRow < ${g} && xCol >= 0 && xCol < ${y}) {
      ${h}
      let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
      ${c(a)}
    }
    return resData;`,k=e?t&&n?`
    let col = colIn * ${a};
    ${b}`:`
    let col = colIn * ${a};
    if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
      ${b}
    }
    return ${tt(a,l)}(0.0);`:n&&r?`
    let col = colIn * ${a};
    ${b}`:`
    let col = colIn * ${a};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${b}
    }
    return ${tt(a,l)}(0.0);`,S=e?n&&r?p(o):`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
      ${p(o)}
    }
    return ${tt(o,l)}(0.0);`:`
    let col = colIn * ${o};
    if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
      ${p(o)}
    }
    return ${tt(o,l)}(0.0);`,I=tt(u,l),z=tt(e?a:o,l),O=tt(e?o:a,l),R=qr(i,I,l);return`
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
      ${y_(s)}
      ${R}
      setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
      }
    }`},w_=(e,t,r,n,s,i,a,o,u)=>{let l=t.format==="NHWC",c=l?e[0].dims[3]:e[0].dims[1],p=r[0],h=l?r[2]:r[3],m=l?r[1]:r[2],g=l?r[3]:r[1],y=l&&(c%4===0||c%3===0)&&g%4===0,x=l?g:h*m,w=l?h*m:g,b=[8,8,1],k=n<=8?[4,1,1]:[4,4,1],S=[Math.ceil(x/b[0]/k[0]),Math.ceil(w/b[1]/k[1]),Math.ceil(p/b[2]/k[2])];Oe("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${S}`);let I=y?l&&c%4!==0?3:4:1,z=b[1]*k[1],O=b[0]*k[0],R=Math.max(b[0]*I,b[1]),N=n%z===0,G=s%O===0,ue=i%R===0,ne=y?[I,4,4]:[1,1,1],se=[{type:6,data:n},{type:6,data:s},{type:6,data:i},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Lr(t,se),se.push(...he(e[0].dims,e[1].dims));let Se=["rank","rank"];a&&(se.push(...he(e[2].dims)),Se.push("rank")),se.push(...he(r));let _e=Q=>{let ie=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Vr(t,ie);let K=y?4:1,de=Je(e[0].dataType),Re=`
      fn setOutputAtIndex(flatIndex : i32, value : ${y?`vec4<${de}>`:de}) {
        result[flatIndex] = ${y?`vec4<${de}>`:de}(value);
      }
      fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${y?`vec4<${de}>`:de}) {
        let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
        setOutputAtIndex(flatIndex ${y?"/ 4":""}, value);
      }`,P=U("x",e[0].dataType,e[0].dims.length,I===3?1:I),H=U("w",e[1].dataType,e[1].dims.length,K),Y=[P,H],ge=ce("result",e[0].dataType,r.length,K);if(a){let Ze=U("bias",e[2].dataType,e[2].dims.length,K);Y.push(Ze),Re+=`
        fn getBiasByOutputCoords(coords : vec4<i32>) -> ${y?`vec4<${de}>`:de} {
          return bias[coords.${l?"w":"y"}${y?"/ 4":""}];
        }`}return`
        ${b_("uniforms.result_strides")}
        //struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
        //  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
        //  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
        ${Q.registerUniforms(ie).declareVariables(...Y,ge)}
        ${Re}
        ${Mc(l,N,G,ue,a,t,ne[0],ne[1],ne[2],de)}
        ${y?oo(k,b,de,void 0,!l,R):uo(k,b,de,void 0,!l,R,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${I};${y};${N};${G};${ue};${z};${O};${R}`,inputDependencies:Se},getRunData:()=>({outputs:[{dims:u?u(r):r,dataType:e[0].dataType}],dispatchGroup:{x:S[0],y:S[1],z:S[2]},programUniforms:se}),getShaderSource:_e}}}),Nc,la,Sn,Pc,da,Dc,$_,v_,w1=j(()=>{we(),lr(),xe(),ke(),Gr(),tu(),Nc=e=>{let t=1;for(let r=0;r<e.length;r++)t*=e[r];return t},la=e=>typeof e=="number"?[e,e,e]:e,Sn=(e,t)=>t<=1?e:e+(e-1)*(t-1),Pc=(e,t,r,n=1)=>{let s=Sn(t,n);return Math.floor((e[0]*(r-1)-r+s)/2)},da=(e,t,r,n,s)=>{s==null&&(s=Pc(e,t[0],n[0]));let i=[0,0,0,r];for(let a=0;a<3;a++)e[a]+2*s>=t[a]&&(i[a]=Math.trunc((e[a]-t[a]+2*s)/n[a]+1));return i},Dc=(e,t,r,n,s,i,a,o,u,l)=>{let c,p,h,m;if(e==="VALID"&&(e=0),typeof e=="number"){c={top:e,bottom:e,left:e,right:e,front:e,back:e};let g=da([t,r,n,1],[o,u,l],1,[s,i,a],e);p=g[0],h=g[1],m=g[2]}else if(Array.isArray(e)){if(!e.every((y,x,w)=>y===w[0]))throw Error(`Unsupported padding parameter: ${e}`);c={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let g=da([t,r,n,1],[o,u,l],1,[s,i,a],e[0]);p=g[0],h=g[1],m=g[2]}else if(e==="SAME_UPPER"){p=Math.ceil(t/s),h=Math.ceil(r/i),m=Math.ceil(n/a);let g=(p-1)*s+o-t,y=(h-1)*i+u-r,x=(m-1)*a+l-n,w=Math.floor(g/2),b=g-w,k=Math.floor(y/2),S=y-k,I=Math.floor(x/2),z=x-I;c={top:k,bottom:S,left:I,right:z,front:w,back:b}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:c,outDepth:p,outHeight:h,outWidth:m}},$_=(e,t,r,n,s,i=!1,a="channelsLast")=>{let o,u,l,c,p;if(a==="channelsLast")[o,u,l,c,p]=e;else if(a==="channelsFirst")[o,p,u,l,c]=e;else throw new Error(`Unknown dataFormat ${a}`);let[h,,m,g,y]=t,[x,w,b]=la(r),[k,S,I]=la(n),z=Sn(m,k),O=Sn(g,S),R=Sn(y,I),{padInfo:N,outDepth:G,outHeight:ue,outWidth:ne}=Dc(s,u,l,c,x,w,b,z,O,R),se=i?h*p:h,Se=[0,0,0,0,0];return a==="channelsFirst"?Se=[o,se,G,ue,ne]:a==="channelsLast"&&(Se=[o,G,ue,ne,se]),{batchSize:o,dataFormat:a,inDepth:u,inHeight:l,inWidth:c,inChannels:p,outDepth:G,outHeight:ue,outWidth:ne,outChannels:se,padInfo:N,strideDepth:x,strideHeight:w,strideWidth:b,filterDepth:m,filterHeight:g,filterWidth:y,effectiveFilterDepth:z,effectiveFilterHeight:O,effectiveFilterWidth:R,dilationDepth:k,dilationHeight:S,dilationWidth:I,inShape:e,outShape:Se,filterShape:t}},v_=(e,t,r,n,s,i)=>{let a=i==="channelsLast";a?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],u={x:r.map((x,w)=>w)},l=[Math.ceil(Nc(u.x.map(x=>r[x]))/o[0]),1,1];Oe("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${l}`);let c=1,p=B.size(r),h=[{type:12,data:p},{type:12,data:n},{type:12,data:s},{type:12,data:t.strides},{type:12,data:t.dilations}];Lr(t,h),h.push(...he(e[0].dims,e[1].dims));let m=["rank","rank"],g=e.length===3;g&&(h.push(...he(e[2].dims)),m.push("rank")),h.push(...he(r));let y=x=>{let w=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:n.length},{name:"pads",type:"u32",length:s.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Vr(t,w);let b=1,k=Je(e[0].dataType),S=U("x",e[0].dataType,e[0].dims.length,c),I=U("W",e[1].dataType,e[1].dims.length,b),z=[S,I],O=ce("result",e[0].dataType,r.length,b),R="";if(g){let ue=U("bias",e[2].dataType,e[2].dims.length,b);z.push(ue),R+=`
        fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${k} {
          return bias[${a?pe("coords",4,5):pe("coords",1,5)}];
        }`}let N=tt(c,k),G=qr(t,N,k);return`
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
              let batch = ${pe("coords",0,S.rank)};
              let d2 = ${a?pe("coords",S.rank-1,S.rank):pe("coords",1,S.rank)};
              let xFRCCorner = vec3<u32>(${a?pe("coords",1,S.rank):pe("coords",2,S.rank)},
              ${a?pe("coords",2,S.rank):pe("coords",3,S.rank)},
              ${a?pe("coords",3,S.rank):pe("coords",4,S.rank)}) * uniforms.strides - uniforms.pads;
              let xFCorner = xFRCCorner.x;
              let xRCorner = xFRCCorner.y;
              let xCCorner = xFRCCorner.z;
              let xShapeY = ${a?pe("uniforms.x_shape",1,S.rank):pe("uniforms.x_shape",2,S.rank)};
              let xShapeZ = ${a?pe("uniforms.x_shape",2,S.rank):pe("uniforms.x_shape",3,S.rank)};
              let xShapeW = ${a?pe("uniforms.x_shape",3,S.rank):pe("uniforms.x_shape",4,S.rank)};
              let xShapeU = ${a?pe("uniforms.x_shape",4,S.rank):pe("uniforms.x_shape",1,S.rank)};
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
              ${g?"value = value + getBiasByOutputCoords(coords)":""};
              ${G}
              result[global_idx] = f32(value);
          }`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${a};${c};${g}`,inputDependencies:m},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:l[0],y:l[1],z:l[2]},programUniforms:h}),getShaderSource:y}}}),x_,S_,$1=j(()=>{we(),xe(),ke(),Gr(),x_=(e,t,r,n)=>{let s=e.length>2,i=s?"value += b[output_channel];":"",a=e[0].dims,o=e[1].dims,u=t.format==="NHWC",l=u?r[3]:r[1],c=l/t.group,p=u&&c>=4?Ge(l):1,h=B.size(r)/p,m=[{type:12,data:h},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:c}];Lr(t,m),m.push(...he(a,[o[0],o[1],o[2],o[3]/p]));let g=s?["rank","rank","rank"]:["rank","rank"];m.push(...he([r[0],r[1],r[2],r[3]/p]));let y=x=>{let w=ce("output",e[0].dataType,r.length,p),b=Je(w.type.tensor),k=qr(t,w.type.value,b),S=U("x",e[0].dataType,a.length),I=U("w",e[1].dataType,o.length,p),z=[S,I];s&&z.push(U("b",e[2].dataType,e[2].dims,p));let O=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Vr(t,O);let R=u?`
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
  }`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${p}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:m}),getShaderSource:y}},S_=(e,t,r,n)=>{let s=e.length>2,i=Ge(r[3]),a=Ge(r[2]),o=B.size(r)/i/a,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/i],l=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/i],c=[r[0],r[1],r[2],r[3]/i],p=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Lr(t,p),p.push(...he(u,l,c));let h=(a-1)*t.strides[1]+l[1],m=g=>{let y=ce("output",e[0].dataType,c.length,i),x=Je(y.type.tensor),w=qr(t,y.type.value,x),b=U("x",e[0].dataType,u.length,i),k=U("w",e[1].dataType,l.length,i),S=[b,k];s&&S.push(U("b",e[2].dataType,e[2].dims,i));let I=s?"value += b[output_channel];":"",z=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Vr(t,z),`
  ${g.registerUniforms(z).declareVariables(...S,y)}
  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let width0 = uniforms.output_shape[3];
    let output_channel = global_idx % width0;
    var index1 = global_idx / width0;
    let width1 = uniforms.output_shape[2] / ${a}u;
    let col = (index1 % width1) * ${a}u;
    index1 = index1 / width1;
    let row = index1 % uniforms.output_shape[1];
    let batch = index1 / uniforms.output_shape[1];

    let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

    var x_vals: array<${b.type.value}, ${h}>;
    var values: array<${y.type.value}, ${a}>;
    let input_channel = output_channel;
    // Use constant instead of uniform can give better performance for w's height/width.
    for (var w_height: u32 = 0u; w_height < ${l[0]}; w_height++) {
      let x_height = x_corner.x + i32(w_height);
      if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
        for (var i = 0; i < ${h}; i++) {
          let x_width = x_corner.y + i;
          if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
            x_vals[i] = ${b.get("batch","u32(x_height)","u32(x_width)","input_channel")};
          } else {
            x_vals[i] = ${b.type.value}(0);
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
      ${y.set("batch","row","col + i","output_channel","value")};
    }
  }`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${i};${a};${h};${l[0]};${l[1]}`,inputDependencies:s?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(r):r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p}),getShaderSource:m}}}),Uc,Si,Wc,ki,lo,ca,qc,Lc,co,v1=j(()=>{xe(),b1(),w1(),iu(),$1(),Gr(),nu(),Er(),Uc=(e,t,r,n,s,i)=>{let a=e[0],o=e.slice(i?1:2,i?3:4),u=o.length,l=t[0],c=t.slice(2).map((h,m)=>h+(h-1)*(r[m]-1)),p=o.map((h,m)=>h+n[m]+n[m+u]).map((h,m)=>Math.floor((h-c[m]+s[m])/s[m]));return p.splice(0,0,a),p.splice(i?3:1,0,l),p},Si=[2,3,1,0],Wc=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],n=e[1].dims[1]*t.group;if(r!==n)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let s=e[0].dims.length-2;if(t.dilations.length!==s)throw new Error(`dilations should be ${s}D`);if(t.strides.length!==s)throw new Error(`strides should be ${s}D`);if(t.pads.length!==s*2)throw new Error(`pads should be ${s*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},ki=(e,t)=>{let r=e.kernelShape.slice();r.length<t[1].dims.length-2&&r.push(...Array(t[1].dims.length-2-r.length).fill(0));for(let i=2;i<t[1].dims.length;++i)r[i-2]===0&&(r[i-2]=t[1].dims[i]);let n=e.pads.slice();Gi.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,r,n,e.format==="NHWC",e.autoPad);let s=Object.assign({},e);return Object.assign(s,{kernelShape:r,pads:n}),s},lo=e=>{let t=eu(e),r=e.format,n=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],s=e.dilations,i=e.group,a=e.kernel_shape,o=e.pads,u=e.strides,l=e.w_is_const();return{autoPad:n,format:r,dilations:s,group:i,kernelShape:a,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},ca=(e,t,r,n)=>{let s=r.format==="NHWC",i=Uc(t[0].dims,t[1].dims,r.dilations,r.pads,r.strides,s);if(r.group!==1){let z=[t[0]];if(s){let O=e.kernelCustomData.wT??e.compute(xt(t[1],Si),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=O),z.push(O)}else z.push(t[1]);t.length===3&&z.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&s&&t[1].dims[0]===r.group&&t[1].dims[1]===1&&r.dilations[0]===1&&r.dilations[1]===1?e.compute(S_(z,r,i,n),{inputs:z}):e.compute(x_(z,r,i,n),{inputs:z});return}let a=t.length===3,o=t[0].dims[s?1:2],u=t[0].dims[s?2:3],l=t[0].dims[s?3:1],c=t[1].dims[2],p=t[1].dims[3],h=i[s?1:2],m=i[s?2:3],g=i[s?3:1],y=s&&c===o&&p===u&&r.pads[0]===0&&r.pads[1]===0;if(y||c===1&&p===1&&r.dilations[0]===1&&r.dilations[1]===1&&r.strides[0]===1&&r.strides[1]===1&&r.pads[0]===0&&r.pads[1]===0){let z=i[0],O,R,N,G=[];if(s){let se=e.kernelCustomData.wT??e.compute(xt(t[1],Si),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];if(r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=se),y){let Se=o*u*l;O=t[0].reshape([1,z,Se]),R=se.reshape([1,Se,g]),N=[1,z,g]}else O=t[0].reshape([z,o*u,l]),R=se.reshape([1,l,g]),N=[z,h*m,g];G.push(O),G.push(R)}else O=t[0].reshape([z,l,o*u]),R=t[1].reshape([1,g,l]),N=[z,g,h*m],G.push(R),G.push(O);a&&G.push(t[2]);let ue=N[2],ne=G[0].dims[G[0].dims.length-1];ue<8&&ne<8?e.compute(ru(G,r,i,N,s,n),{inputs:G}):e.compute(Ki(G,r,i,N,s,n),{inputs:G});return}let x=!0,w=e.kernelCustomData.wT??e.compute(xt(t[1],Si),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=w);let b=[t[0],w];a&&b.push(t[2]);let k=s?h*m:g,S=s?g:h*m,I=c*p*l;e.compute(w_(b,r,i,k,S,I,a,x,n),{inputs:b})},qc=(e,t)=>{let r=t.format==="NHWC",n=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&n.push(e.inputs[2]);let s=[0,t.pads[0],0,t.pads[1]],i=[1].concat(t.strides),a=[1].concat(t.dilations),o=[1].concat(t.kernelShape),u=ki({...t,pads:s,strides:i,dilations:a,kernelShape:o},n);ca(e,n,u,l=>r?[l[0],l[2],l[3]]:[l[0],l[1],l[3]])},Lc=(e,t,r)=>{let n=r.format==="NHWC"?"channelsLast":"channelsFirst",s=ki(r,t),i=r.autoPad==="NOTSET"?r.pads:r.autoPad,a=$_(t[0].dims,t[1].dims,r.strides,r.dilations,i,!1,n);e.compute(v_(t,s,a.outShape,[a.filterDepth,a.filterHeight,a.filterWidth],[a.padInfo.front,a.padInfo.top,a.padInfo.left],n))},co=(e,t)=>{if(Wc(e.inputs,t),e.inputs[0].dims.length===3)qc(e,t);else if(e.inputs[0].dims.length===5)Lc(e,e.inputs,t);else{let r=ki(t,e.inputs);ca(e,e.inputs,r)}}}),k_,x1=j(()=>{we(),lr(),xe(),ke(),k_=(e,t,r)=>{let n=e.length>2,s=t.outputShape,i=t.format==="NHWC",a=t.group,o=e[1].dims,u=o[2]/a,l=o[3],c=i?Ge(u):1,p=i&&l===1&&u>=4,h=p?Math.floor(u/4)*4:Math.floor(u/c)*c,m=u-h,g=i?Ge(l):1,y=i?l===1?c:g:1,x=B.size(s)/g,w=[Math.ceil(x/64),1,1];Oe("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${w}`);let b=["rank","rank"],k=[t.strides[0],t.strides[1]],S=[t.kernelShape[i?1:2],t.kernelShape[i?2:3]],I=[t.dilations[0],t.dilations[1]],z=[S[0]+(t.dilations[0]<=1?0:(t.kernelShape[i?1:2]-1)*(t.dilations[0]-1)),S[1]+(t.dilations[1]<=1?0:(t.kernelShape[i?2:3]-1)*(t.dilations[1]-1))],O=[z[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),z[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],R=[{type:12,data:x},{type:12,data:k},{type:12,data:S},{type:12,data:I},{type:12,data:z},{type:6,data:O},{type:12,data:h},{type:12,data:u},{type:12,data:l},...he(e[0].dims,e[1].dims)];n&&(R.push(...he(e[2].dims)),b.push("rank")),R.push(...he(s));let N=G=>{let ue=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:k.length},{name:"filter_dims",type:"u32",length:S.length},{name:"dilations",type:"u32",length:S.length},{name:"effective_filter_dims",type:"u32",length:z.length},{name:"pads",type:"i32",length:O.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],ne=Je(e[0].dataType),se=i?1:2,Se=i?2:3,_e=i?3:1,Q=U("W",e[1].dataType,e[1].dims.length,y),ie=U("Dy",e[0].dataType,e[0].dims.length,c),K=[ie,Q];n&&K.push(U("bias",e[2].dataType,[s[_e]].length,g));let de=ce("result",e[0].dataType,s.length,g),Re=()=>{let Y="";if(p)c===4?Y+=`
        let xValue = ${ie.getByOffset("x_offset")};
        let wValue = ${Q.getByOffset("w_offset")};
        dotProd = dotProd + dot(xValue, wValue);
        x_offset += 1u;
        w_offset += 1u;`:c===2?Y+=`
          dotProd = dotProd + dot(vec4<${ne}>(${ie.getByOffset("x_offset")}, ${ie.getByOffset("x_offset + 1u")}), vec4<${ne}>(${Q.getByOffset("w_offset")}, ${Q.getByOffset("w_offset + 1u")}));
          x_offset += 2u;
          w_offset += 2u;`:c===1&&(Y+=`
          dotProd = dotProd + dot(vec4<${ne}>(${ie.getByOffset("x_offset")}, ${ie.getByOffset("x_offset + 1u")}, ${ie.getByOffset("x_offset + 2u")}, ${ie.getByOffset("x_offset + 3u")}), vec4<${ne}>(${Q.getByOffset("w_offset")}, ${Q.getByOffset("w_offset + 1u")}, ${Q.getByOffset("w_offset + 2u")}, ${Q.getByOffset("w_offset + 3u")}));
          x_offset += 4u;
          w_offset += 4u;`);else if(Y+=`
                  let xValue = ${i?ie.getByOffset(`${ie.indicesToOffset(`${ie.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c}`):ie.get("batch","inputChannel","idyR","idyC")};
        `,c===1)Y+=`
          let w_offset = ${Q.indicesToOffset(`${Q.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
          let wValue = ${Q.getByOffset(`w_offset / ${y}`)};
          dotProd = dotProd + xValue * wValue;`;else for(let ge=0;ge<c;ge++)Y+=`
            let wValue${ge} = ${Q.getByOffset(`${Q.indicesToOffset(`${Q.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${ge}, wOutChannel)`)} / ${y}`)};
            dotProd = dotProd + xValue[${ge}] * wValue${ge};`;return Y},P=()=>{if(m===0)return"";if(!p)throw new Error(`packInputAs4 ${p} is not true.`);let Y="";if(c===1){Y+="dotProd = dotProd";for(let ge=0;ge<m;ge++)Y+=`
            + ${ie.getByOffset(`x_offset + ${ge}`)} * ${Q.getByOffset(`w_offset + ${ge}`)}`;Y+=";"}else if(c===2){if(m!==2)throw new Error(`Invalid inputChannelsRemainder ${m}.`);Y+=`
          let xValue = ${ie.getByOffset("x_offset")};
          let wValue = ${Q.getByOffset("w_offset")};
          dotProd = dotProd + dot(xValue, wValue);`}return Y},H=`
            let outputIndices = ${de.offsetToIndices(`global_idx * ${g}`)};
            let batch = ${de.indicesGet("outputIndices",0)};
            let d1 = ${de.indicesGet("outputIndices",_e)};
            let r = ${de.indicesGet("outputIndices",se)};
            let c = ${de.indicesGet("outputIndices",Se)};
            let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
            let dyRCorner = dyCorner.x;
            let dyCCorner = dyCorner.y;
            let groupId = d1 / uniforms.output_channels_per_group;
            let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
            // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
            // ? = to be determined. : = across all values in that axis.
            var dotProd = ${de.type.value}(0.0);
            var wR: u32 = 0;
            if (uniforms.dilations.x == 1) {
              // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
              wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
            }
            for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
              if (wR % uniforms.dilations.x != 0) {
                continue;
              }
              let dyR = (${ne}(dyRCorner) + ${ne}(wR)) / ${ne}(uniforms.strides[0]);
              let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
              if (dyR < 0.0 || dyR >= ${ne}(uniforms.Dy_shape[${se}]) || fract(dyR) > 0.0 ||
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
                let dyC = (${ne}(dyCCorner) + ${ne}(wC)) / ${ne}(uniforms.strides.y);
                let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
                if (dyC < 0.0 || dyC >= ${ne}(uniforms.Dy_shape[${Se}]) ||
                    fract(dyC) > 0.0 || wCPerm < 0) {
                  continue;
                }
                let idyC: u32 = u32(dyC);
                var inputChannel = groupId * uniforms.input_channels_per_group;
                ${p?`
                var x_offset = ${ie.indicesToOffset(`${ie.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${c};
                var w_offset = ${Q.indicesToOffset(`${Q.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${y};
                  `:""}
                for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${p?4:c}) {
                  ${Re()}
                  inputChannel = inputChannel + ${p?4:c};
                }
                ${P()}
                wC = wC + uniforms.strides.y - 1;
              }
              wR = wR + uniforms.strides[0] - 1;
            }
            let value = dotProd${n?` + bias[d1 / ${g}]`:""};
            ${de.setByOffset("global_idx","value")};
          `;return`
    ${G.registerUniforms(ue).declareVariables(...K,de)}
      ${G.mainStart()}
      ${G.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
    ${H}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${c}${y}${g}${p}${m}`,inputDependencies:b},getRunData:()=>({dispatchGroup:{x:w[0],y:w[1],z:w[2]},outputs:[{dims:r?r(s):s,dataType:e[0].dataType}],programUniforms:R}),getShaderSource:N}}}),Vc,Hc,Fc,pa,T_,Gc,fa,jc,E_,S1=j(()=>{x1(),Gr(),Er(),Vc=(e,t,r,n,s,i)=>(e-1)*t+r+(n-1)*s+1-i,Hc=(e,t,r,n,s)=>{let i=Math.floor(e/2);t==="SAME_UPPER"?(r[n]=i,r[s]=e-i):t==="SAME_LOWER"&&(r[n]=e-i,r[s]=i)},Fc=(e,t,r,n,s,i,a,o,u,l)=>{let c=e.length-2,p=l.length===0;u.length<c&&u.push(...Array(c-u.length).fill(0));let h=e[0],m=t[o?3:1]*s;for(let g=0,y=e.length-c-(o?1:0);g<c;++g,++y){let x=e[y],w=p?x*a[g]:l[g],b=Vc(x,a[g],i[g],t[y],r[g],w);Hc(b,n,i,g,g+c),p&&l.push(a[g]*(x-1)+u[g]+(t[y]-1)*r[g]+1-i[g]-i[g+c])}l.splice(0,0,h),l.splice(o?3:1,0,m)},pa=(e,t)=>{let r=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((p,h)=>p*h,1)===0){r.length=0;for(let p=2;p<t[1].dims.length;++p)r.push(t[1].dims[p])}let n=e.format==="NHWC";r.splice(0,0,t[1].dims[0]),r.splice(n?3:1,0,t[1].dims[1]);let s=e.pads.slice(),i=e.outputShape.slice(),a=e.outputPadding.slice(),o=t[0].dims,u=e.dilations.slice();if(u.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;u=new Array(p).fill(1)}let l=e.strides.slice();if(l.reduce((p,h)=>p+h,0)===0){let p=t[0].dims.length-2;l=new Array(p).fill(1)}Fc(o,r,u,e.autoPad,e.group,s,l,n,a,i);let c=Object.assign({},e);return Object.assign(c,{kernelShape:r,pads:s,outputPadding:a,outputShape:i,dilations:u,strides:l}),c},T_=e=>{let t=eu(e),r=e.format,n=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],s=e.dilations,i=e.group,a=e.kernelShape,o=e.pads,u=e.strides,l=e.wIsConst(),c=e.outputPadding,p=e.outputShape;return{autoPad:n,format:r,dilations:s,group:i,kernelShape:a,outputPadding:c,outputShape:p,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},Gc=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let r=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],n=e[1].dims[0];if(r!==n)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let s=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==s))throw new Error("invalid bias");let i=e[0].dims.length-2;if(t.dilations.reduce((a,o)=>a+o,0)>0&&t.dilations.length!==i)throw new Error(`dilations should be ${i}D`);if(t.strides.reduce((a,o)=>a+o,0)>0&&t.strides.length!==i)throw new Error(`strides should be ${i}D`);if(t.pads.reduce((a,o)=>a+o,0)>0&&t.pads.length!==i*2)throw new Error(`pads should be ${i*2}D`);if(t.outputPadding.length!==i&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${i}D`);if(t.kernelShape.reduce((a,o)=>a+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},fa=(e,t,r,n)=>{let s=e.kernelCustomData.wT??e.compute(xt(t[1],[2,3,0,1]),{inputs:[1],outputs:[r.wIsConst?-2:-1]})[0];r.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=s);let i=[t[0],s];t.length===3&&i.push(t[2]),e.compute(k_(i,r,n),{inputs:i})},jc=(e,t)=>{let r=t.format==="NHWC",n=[e.inputs[0].reshape(r?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&n.push(e.inputs[2]);let s=t.kernelShape;(s.length===0||s[0]===0)&&(s=[e.inputs[1].dims[2]]);let i=t.dilations;(i.length===0||i[0]===0)&&(i=[1]);let a=t.strides;(a.length===0||a[0]===0)&&(a=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],a=[1].concat(a),i=[1].concat(i),s=[1].concat(s);let u=t.outputPadding;u=[0].concat(u);let l=pa({...t,pads:o,strides:a,dilations:i,kernelShape:s,outputPadding:u},n);fa(e,n,l,c=>r?[c[0],c[2],c[3]]:[c[0],c[1],c[3]])},E_=(e,t)=>{if(Gc(e.inputs,t),e.inputs[0].dims.length===3)jc(e,t);else{let r=pa(t,e.inputs);fa(e,e.inputs,r)}}}),Kc,I_,C_,k1=j(()=>{we(),xe(),Ke(),ke(),Kc=(e,t,r,n)=>{let s=B.size(t),i=t.length,a=U("input",e,i),o=ce("output",e,i),u=r.dataType===6?r.getInt32Array()[0]:Number(r.getBigInt64Array()[0]),l=B.normalizeAxis(u,i),c=p=>{let h=` i32(${a.indicesGet("inputIndices","uniforms.axis")}) `,m=pe("uniforms.input_shape","uniforms.axis",i),g=n.reverse?h+(n.exclusive?" + 1":""):"0",y=n.reverse?m:h+(n.exclusive?"":" + 1");return`
                ${p.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(a,o)}
                ${p.mainStart()}
                  ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
                  var inputIndices = ${o.offsetToIndices("global_idx")};
                  var sum = ${o.type.value}(0);
                  let first : i32 = ${g};
                  let last : i32 = ${y};
                  for (var i : i32 = first; i < last; i++) {
                    ${a.indicesSet("inputIndices","uniforms.axis","u32(i)")};
                    sum = sum + ${a.getByIndices("inputIndices")};
                  }
                  ${o.setByOffset("global_idx","sum")};
                }`};return{name:"CumSum",shaderCache:{hint:n.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:[{type:12,data:s},{type:12,data:l},...he(t,t)]}),getShaderSource:c}},I_=(e,t)=>{let r=e.inputs[0].dims,n=e.inputs[0].dataType,s=e.inputs[1];e.compute(Kc(n,r,s,t),{inputs:[0]})},C_=e=>{let t=e.exclusive===1,r=e.reverse===1;return Ne({exclusive:t,reverse:r})}}),Zc,Qc,Xc,z_,O_,T1=j(()=>{we(),xe(),Ke(),ke(),Zc=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Qc=(e,t,r,n)=>{let s=[];s.push(`fn perm(i: ${n.type.indices}) -> ${r.type.indices} {
    var a: ${r.type.indices};`);for(let i=0;i<t;++i)s.push(r.indicesSet("a",e[i],`i[${i}]`));return s.push("return a;}"),s.join(`
`)},Xc=(e,t)=>{let r,n,s,i,a,o,u=t.format==="NHWC",l=t.blocksize,c=t.mode==="DCR";u?([r,n,s,i]=e.dims,a=c?[r,n,s,l,l,i/l**2]:[r,n,s,i/l**2,l,l],o=c?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([r,n,s,i]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],a=c?[r,l,l,i/l**2,n,s]:[r,i/l**2,l,l,n,s],o=c?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let p=e.reshape(a),h=p.dims.length,m=e.dataType,g=U("a",m,h),y=ce("output",m,h),x=w=>`
  ${w.registerUniform("output_size","u32").declareVariables(g,y)}

  ${Qc(o,h,g,y)}

  ${w.mainStart()}
    ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let indices = ${y.offsetToIndices("global_idx")};
    let aIndices = perm(indices);

    ${y.setByOffset("global_idx",g.getByIndices("aIndices"))}
  }`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:w=>{let b=u?[r,n*l,s*l,i/l**2]:[r,i/l**2,n*l,s*l],k=B.size(b),S=p.dims,I=B.sortBasedOnPerm(S,o);return{outputs:[{dims:b,dataType:w[0].dataType}],dispatchGroup:{x:Math.ceil(k/64)},programUniforms:[{type:12,data:k},...he(S,I)]}},getShaderSource:x}},z_=(e,t)=>{Zc(e.inputs),e.compute(Xc(e.inputs[0],t))},O_=e=>Ne({blocksize:e.blocksize,mode:e.mode,format:e.format})}),Ti,kn,ha,Yc,Jc,ep,tp,ma,rp,A_,R_,E1=j(()=>{we(),xe(),Ke(),ke(),Ti="[a-zA-Z]|\\.\\.\\.",kn="("+Ti+")+",ha="^"+kn+"$",Yc="("+kn+",)*"+kn,Jc="^"+Yc+"$",ep=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let r=this.symbolToIndices.get(e);r===void 0?r=[t]:r.push(t),this.symbolToIndices.set(e,r)}},tp=class{constructor(e,t){var s;this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[r,n]=t.includes("->")?t.split("->",2):[t,""];if(!r.match(RegExp(Jc)))throw new Error("Invalid LHS term");if(r.split(",").forEach((i,a)=>{let o=e[a].dims.slice();if(!i.match(RegExp(ha)))throw new Error("Invalid LHS term");let u=this.processTerm(i,!0,o,a);this.lhs.push(u)}),n==="")n+=[...this.symbolToInfo.entries()].filter(([i,a])=>a.count===1||i==="...").map(([i])=>i).join("");else if(!n.match(RegExp(kn)))throw new Error("Invalid RHS");(s=n.match(RegExp(Ti,"g")))==null||s.forEach(i=>{if(i==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let a=this.symbolToInfo.get(i);if(a===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(a.dimValue)}}),this.rhs=this.processTerm(n,!1,this.outputDims)}addSymbol(e,t,r){let n=this.symbolToInfo.get(e);if(n!==void 0){if(n.dimValue!==t&&n.count!==1)throw new Error("Dimension mismatch");n.count++,n.inputIndices.push(r)}else n={count:1,dimValue:t,inputIndices:[r]};this.symbolToInfo.set(e,n)}processTerm(e,t,r,n=-1){let s=r.length,i=!1,a=[],o=0;if(!e.match(RegExp(ha))&&!t&&e!=="")throw new Error("Invalid LHS term");let u=e.match(RegExp(Ti,"g")),l=new ep(n);return u==null||u.forEach((c,p)=>{if(c==="..."){if(i)throw new Error("Only one ellipsis is allowed per input term");i=!0;let h=s-u.length+1;if(h<0)throw new Error("Ellipsis out of bounds");if(a=r.slice(o,o+h),this.hasEllipsis){if(this.ellipsisDims.length!==a.length||this.ellipsisDims.toString()!==a.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=a;else throw new Error("Ellipsis must be specified in the LHS");for(let m=0;m<a.length;m++){let g=String.fromCharCode(48+m);l.addSymbol(g,p+m),this.addSymbol(g,r[o++],n)}}else l.addSymbol(c,p+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(c,r[o++],n)}),l}},ma=e=>e+"_max",rp=(e,t,r,n)=>{let s=e.map(l=>l.length).map((l,c)=>U(`input${c}`,t,l)),i=B.size(n),a=ce("output",t,n.length),o=[...r.symbolToInfo.keys()].filter(l=>!r.rhs.symbolToIndices.has(l)),u=l=>{let c=[],p="var prod = 1.0;",h="var sum = 0.0;",m="sum += prod;",g=[],y=[],x=[],w=[],b=r.symbolToInfo.size===r.rhs.symbolToIndices.size;r.symbolToInfo.forEach((S,I)=>{var z;if(r.rhs.symbolToIndices.has(I)){let O=(z=r.rhs.symbolToIndices.get(I))==null?void 0:z[0];O!==void 0&&r.lhs.forEach((R,N)=>{if(S.inputIndices.includes(N)){let G=R.symbolToIndices.get(I);if(G===void 0)throw new Error("Invalid symbol error");G.forEach(ue=>{c.push(`${s[N].indicesSet(`input${N}Indices`,ue,a.indicesGet("outputIndices",O))}`)})}})}else r.lhs.forEach((O,R)=>{if(S.inputIndices.includes(R)){let N=O.symbolToIndices.get(I);if(N===void 0)throw new Error("Invalid symbol error");N.forEach(G=>{g.push(`${s[R].indicesSet(`input${R}Indices`,G,`${I}`)}`)}),w.push(`prod *= ${s[R].getByIndices(`input${R}Indices`)};`)}}),y.push(`for(var ${I}: u32 = 0; ${I} < uniforms.${ma(I)}; ${I}++) {`),x.push("}")});let k=b?[...c,`let sum = ${s.map((S,I)=>S.getByIndices(`input${I}Indices`)).join(" * ")};`]:[...c,h,...y,...g,p,...w,m,...x];return`
            ${l.registerUniforms(o.map(S=>({name:`${ma(S)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...s,a)}

            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
            var outputIndices = ${a.offsetToIndices("global_idx")};
            ${s.map((S,I)=>`var input${I}Indices: ${s[I].type.indices};`).join(`
`)}
            ${k.join(`
`)};
            ${a.setByOffset("global_idx","sum")};
          }`};return{name:"Einsum",shaderCache:{hint:r.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let l=o.filter(p=>r.symbolToInfo.has(p)).map(p=>{var h;return{type:12,data:((h=r.symbolToInfo.get(p))==null?void 0:h.dimValue)||0}});l.push({type:12,data:i});let c=e.map((p,h)=>[...he(p)]).reduce((p,h)=>p.concat(h),l);return c.push(...he(n)),{outputs:[{dims:n,dataType:t}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:c}},getShaderSource:u}},A_=(e,t)=>{let r=new tp(e.inputs,t.equation),n=r.outputDims,s=e.inputs.map((i,a)=>i.dims);e.compute(rp(s,e.inputs[0].dataType,r,n))},R_=e=>{let t=e.equation.replace(/\s+/g,"");return Ne({equation:t})}}),np,ga,ip,sp,B_,I1=j(()=>{we(),xe(),ke(),np=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),n=r.length<t.length?0:r.length-t.length,s=t.length<r.length?0:t.length-r.length;for(;n<r.length&&s<t.length;++n,++s)if(r[n]!==t[s]&&r[n]!==1&&t[s]!==1)throw new Error("Expand requires shape to be broadcastable to input")},ga=(e,t)=>{let r=e.length-t.length,n=[];for(let s=0;s<r;++s)n.push(e[s]);for(let s=0;s<t.length;++s)n.push(t[s]===1?e[s+r]:t[s]);return n},ip=(e,t)=>e.length>t.length?ga(e,t):ga(t,e),sp=e=>{let t=e[0].dims,r=Array.from(e[1].getBigInt64Array(),Number),n=ip(t,r),s=e[0].dataType,i=s===9||B.size(t)===1,a=s===9||t.length>0&&t[t.length-1]%4===0?4:1,o=i||n.length>0&&n[n.length-1]%4===0?4:1,u=Math.ceil(B.size(n)/o),l=p=>{let h=U("input",s,t.length,a),m=ce("output",s,n.length,o),g;if(s===9){let y=(x,w,b="")=>`
          let outputIndices${w} = ${m.offsetToIndices(`outputOffset + ${w}u`)};
          let offset${w} = ${h.broadcastedIndicesToOffset(`outputIndices${w}`,m)};
          let index${w} = offset${w} / 4u;
          let component${w} = offset${w} % 4u;
          ${x}[${w}] = ${b}(${h.getByOffset(`index${w}`)}[component${w}]);
        `;g=`
        let outputOffset = global_idx * ${o};
        var data = vec4<u32>(0);
        ${y("data",0,"u32")}
        ${y("data",1,"u32")}
        ${y("data",2,"u32")}
        ${y("data",3,"u32")}
        ${m.setByOffset("global_idx","data")}
      }`}else g=`
        let outputIndices = ${m.offsetToIndices(`global_idx * ${o}`)};
        let inputOffset = ${h.broadcastedIndicesToOffset("outputIndices",m)};
        let data = ${m.type.value}(${h.getByOffset(`inputOffset / ${a}`)});
        ${m.setByOffset("global_idx","data")}
      }`;return`
    ${p.registerUniform("vec_size","u32").declareVariables(h,m)}
    ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
    ${g}`},c=[{type:12,data:u},...he(t,n)];return{name:"Expand",shaderCache:{hint:`${n.length};${a}${o}`,inputDependencies:["rank"]},getShaderSource:l,getRunData:()=>({outputs:[{dims:n,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:c})}},B_=e=>{np(e.inputs),e.compute(sp(e.inputs),{inputs:[0]})}}),ap,M_,C1=j(()=>{we(),xe(),ke(),Jo(),ap=e=>{let t=e[0].dataType,r=B.size(e[0].dims),n=B.size(e[1].dims),s=n%4===0,i=a=>{let o=U("x",t,[1],4),u=U("bias",t,[1],4),l=ce("y",t,[1],4),c=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],p=m=>`
      let bias${m}_offset: u32 = (global_idx * 4 + ${m}) % uniforms.bias_size;
      let bias${m} = ${u.getByOffset(`bias${m}_offset / 4`)}[bias${m}_offset % 4];`,h=s?`
      let bias = ${u.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${p(0)}${p(1)}${p(2)}${p(3)}
      let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${a.registerUniforms(c).declareVariables(o,u,l)}

    ${so(st(t))}

    ${a.mainStart(dn)}
      ${a.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

      let x = ${o.getByOffset("global_idx")};
      ${h}
      let x_in = x + bias;
      ${l.setByOffset("global_idx",ao("x_in"))}
    }`};return{name:"FastGeluWithBias",shaderCache:{hint:`${s}`,inputDependencies:["type","type"]},getShaderSource:i,getRunData:a=>({outputs:[{dims:a[0].dims,dataType:a[0].dataType}],programUniforms:[{type:12,data:Math.ceil(r/4)},{type:12,data:n}],dispatchGroup:{x:Math.ceil(r/dn/4)}})}},M_=e=>{e.inputs.length<2||B.size(e.inputs[1].dims)===0?t_(e):e.compute(ap(e.inputs))}}),op,up,N_,P_,z1=j(()=>{we(),xe(),Ke(),ke(),op=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},up=(e,t)=>{let r=e[0].dims,n=e[1].dims,s=r.length,i=B.normalizeAxis(t.axis,s),a=r.slice(0);a.splice(i,1,...n);let o=r[i],u=e[0].dataType===9?4:1,l=Math.ceil(B.size(a)/u),c=[{type:12,data:l},{type:6,data:o},{type:12,data:i},...he(e[0].dims,e[1].dims,a)],p=h=>{let m=U("data",e[0].dataType,e[0].dims.length,u),g=U("inputIndices",e[1].dataType,e[1].dims.length),y=ce("output",e[0].dataType,a.length,u),x=b=>{let k=n.length,S=`var indicesIndices${b}  = ${g.type.indices}(0);`;for(let I=0;I<k;I++)S+=`${k>1?`indicesIndices${b}[${I}]`:`indicesIndices${b}`} = ${a.length>1?`outputIndices${b}[uniforms.axis + ${I}]`:`outputIndices${b}`};`;S+=`
          var idx${b} = ${g.getByIndices(`indicesIndices${b}`)};
          if (idx${b} < 0) {
            idx${b} = idx${b} + uniforms.axisDimLimit;
          }
          var dataIndices${b} : ${m.type.indices};
        `;for(let I=0,z=0;I<s;I++)I===i?(S+=`${s>1?`dataIndices${b}[${I}]`:`dataIndices${b}`} = u32(idx${b});`,z+=k):(S+=`${s>1?`dataIndices${b}[${I}]`:`dataIndices${b}`} = ${a.length>1?`outputIndices${b}[${z}]`:`outputIndices${b}`};`,z++);return S},w;if(e[0].dataType===9){let b=(k,S,I="")=>`
          let outputIndices${S} = ${y.offsetToIndices(`outputOffset + ${S}u`)};
          ${x(S)};
          let offset${S} = ${m.indicesToOffset(`dataIndices${S}`)};
          let index${S} = offset${S} / 4u;
          let component${S} = offset${S} % 4u;
          ${k}[${S}] = ${I}(${m.getByOffset(`index${S}`)}[component${S}]);
        `;w=`
        let outputOffset = global_idx * ${u};
        var value = vec4<u32>(0);
        ${b("value",0,"u32")}
        ${b("value",1,"u32")}
        ${b("value",2,"u32")}
        ${b("value",3,"u32")}
        ${y.setByOffset("global_idx","value")}
      `}else w=`
      let outputIndices = ${y.offsetToIndices("global_idx")};
      ${x("")};
      let value = ${m.getByIndices("dataIndices")};
      ${y.setByOffset("global_idx","value")};
      `;return`
      ${h.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(m,g,y)}
      ${h.mainStart()}
        ${h.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        ${w}
      }`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:c}),getShaderSource:p}},N_=e=>Ne({axis:e.axis}),P_=(e,t)=>{let r=e.inputs;op(r),e.compute(up(e.inputs,t))}}),lp,D_,U_,O1=j(()=>{we(),xe(),ke(),lp=(e,t,r,n,s,i,a,o,u)=>{let l=[{type:12,data:i},{type:12,data:n},{type:12,data:s},{type:12,data:r},{type:12,data:a},{type:12,data:o},{type:12,data:u}],c=[i];l.push(...he(t.dims,c));let p=h=>{let m=U("indices_data",t.dataType,t.dims.length),g=ce("input_slice_offsets_data",12,1,1),y=[m,g],x=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:s.length},{name:"sizes_from_slice_dims_data",type:"u32",length:r.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
  ${h.registerUniforms(x).declareVariables(...y)}
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
  }`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${s.length}_${r.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:c,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:l}),getShaderSource:p},{inputs:[t],outputs:[-1]})[0]},D_=(e,t)=>{let r=e.inputs,n=r[0].dims,s=r[0].dataType,i=r[1].dims,a=i[i.length-1],o=B.sizeToDimension(i,i.length-1),u=B.sizeFromDimension(n,t.batchDims+a),l=B.sizeToDimension(n,t.batchDims),c=B.sizeFromDimension(n,t.batchDims),p=o/l,h=new Array(a),m=u;for(let S=0;S<a;++S)h[a-1-S]=m,m*=n[t.batchDims+a-1-S];let g=lp(e,r[1],h,t.batchDims,n,o,p,c,a),y=t.batchDims+a;if(y>n.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let x=i.slice(0,-1).concat(n.slice(y)),w=B.size(x),b=[{type:12,data:w},{type:12,data:u},...he(r[0].dims,g.dims,x)],k=S=>{let I=U("data",r[0].dataType,r[0].dims.length),z=U("slice_offsets",12,g.dims.length),O=ce("output",r[0].dataType,x.length);return`
          ${S.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(I,z,O)}
            ${S.mainStart()}
            ${S.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
          output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
        }`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:x,dataType:s}],dispatchGroup:{x:Math.ceil(w/64)},programUniforms:b}),getShaderSource:k},{inputs:[r[0],g]})},U_=e=>({batchDims:e.batch_dims,cacheKey:""})}),dp,cp,W_,q_,A1=j(()=>{we(),xe(),Ke(),ke(),dp=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let r=B.normalizeAxis(t.quantizeAxis,e[0].dims.length),n=t.blockSize,s=e[0],i=e[2],a=e.length===4?e[3]:void 0;if(i.dims.length!==s.dims.length||!s.dims.map((o,u)=>u===r?Math.ceil(o/n)===i.dims[u]:o===i.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(a){if(a.dataType!==s.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(a.dims.length!==i.dims.length||!a.dims.map((o,u)=>o===i.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},cp=(e,t)=>{let r=e[0].dims,n=e[1].dims,s=r.length,i=B.normalizeAxis(t.gatherAxis,s),a=B.normalizeAxis(t.quantizeAxis,s),o=r.slice(0);o.splice(i,1,...n);let u=B.size(o),l=e[2].dataType,c=e[0].dataType===22,p=[{type:12,data:u},{type:12,data:a},{type:12,data:i},{type:12,data:t.blockSize},...he(...e.map((m,g)=>m.dims),o)],h=m=>{let g=U("data",e[0].dataType,e[0].dims.length),y=U("inputIndices",e[1].dataType,e[1].dims.length),x=U("scales",e[2].dataType,e[2].dims.length),w=e.length>3?U("zeroPoint",e[3].dataType,e[3].dims.length):void 0,b=ce("output",l,o.length),k=[g,y,x];w&&k.push(w);let S=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
        ${m.registerUniforms(S).declareVariables(...k,b)}
        ${m.mainStart()}
        let output_indices = ${b.offsetToIndices("global_idx")};
        var indices_indices = ${y.type.indices}(0);
        ${n.length>1?`
          for (var i: u32 = 0; i < ${n.length}; i++) {
            let index = ${b.indicesGet("output_indices","uniforms.gather_axis + i")};
            ${y.indicesSet("indices_indices","i","index")};
          }`:`indices_indices = ${b.indicesGet("output_indices","uniforms.gather_axis")};`};
        var data_indices = ${g.type.indices}(0);
        for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
          let index = ${b.indicesGet("output_indices","i")};
          ${g.indicesSet("data_indices","i","index")};
        }
        var index_from_indices = ${y.getByIndices("indices_indices")};
        if (index_from_indices < 0) {
          index_from_indices += ${r[i]};
        }
        ${g.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
        for (var i = uniforms.gather_axis + 1; i < ${o.length}; i++) {
          let index = ${b.indicesGet("output_indices",`i + ${n.length} - 1`)};
          ${g.indicesSet("data_indices","i","index")};
        }
        let data_offset = ${g.indicesToOffset("data_indices")};
        let data_index = data_offset % 8;
        // Convert 4-bit packed data to 8-bit packed data.
        let packed_4bit_quantized_data = ${g.getByOffset("data_offset / 8")};
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
        let dequantized_data = ${st(l)}(quantized_data - zero_point) * scale;
        ${b.setByOffset("global_idx","dequantized_data")};
    }`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((m,g)=>g!==1).map(m=>m.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(m,g)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:l}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:p}),getShaderSource:h}},W_=(e,t)=>{let r=e.inputs;dp(r,t),e.compute(cp(e.inputs,t))},q_=e=>Ne({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),pp,fp,L_,V_,R1=j(()=>{we(),xe(),Ke(),ke(),pp=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
                     indices input tensors be of same rank.`)},fp=(e,t)=>{let r=e[0].dims,n=e[0].dataType,s=r.length,i=e[1].dims,a=e[1].dataType,o=B.normalizeAxis(t.axis,s),u=r[o],l=i.slice(0),c=B.size(l),p=U("input",n,s),h=U("indicesInput",a,i.length),m=ce("output",n,l.length),g=[{type:12,data:c},{type:6,data:u},{type:12,data:o}];return g.push(...he(r,i,l)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:l,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:g}),getShaderSource:y=>`
      ${y.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(p,h,m)}
      ${y.mainStart()}
      ${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

      let outputIndices = ${m.offsetToIndices("global_idx")};

      var idx = ${h.getByOffset("global_idx")};
      if (idx < 0) {
        idx = idx + uniforms.axisDimLimit;
      }
      var inputIndices = ${p.type.indices}(outputIndices);
      ${p.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
      let value = ${p.getByIndices("inputIndices")};

      ${m.setByOffset("global_idx","value")};
  }`}},L_=e=>Ne({axis:e.axis}),V_=(e,t)=>{let r=e.inputs;pp(r),e.compute(fp(e.inputs,t))}}),hp,mp,H_,F_,B1=j(()=>{we(),xe(),ke(),hp=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},mp=(e,t)=>{let r=e[0].dims.slice(),n=e[1].dims.slice(),[s,i,a]=Lm.getShapeOfGemmResult(r,t.transA,n,t.transB,e.length===3?e[2].dims:void 0),o=[s,i];if(!o)throw new Error("Can't use gemm on the given tensors");let u=16,l=Math.ceil(i/u),c=Math.ceil(s/u),p=!0,h=B.size(o),m=[{type:12,data:p?l:h},{type:12,data:s},{type:12,data:i},{type:12,data:a},{type:1,data:t.alpha},{type:1,data:t.beta}],g=["type","type"];e.length===3&&(m.push(...he(e[2].dims)),g.push("rank")),m.push(...he(o));let y=w=>{let b="";t.transA&&t.transB?b="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?b="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?b="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(b="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let k=t.alpha===1?"":"value *= uniforms.alpha;",S=U("a",e[0].dataType,e[0].dims),I=U("b",e[1].dataType,e[1].dims),z=S.type.value,O=null,R=[S,I];e.length===3&&(O=U("c",e[2].dataType,e[2].dims.length),R.push(O));let N=ce("output",e[0].dataType,o.length);R.push(N);let G=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
  ${w.registerUniforms(G).declareVariables(...R)}

  ${w.mainStart()}
    ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

    let m = global_idx / uniforms.N;
    let n = global_idx % uniforms.N;

    var value = ${z}(0);
    for (var k: u32 = 0u; k < uniforms.K; k++) {
      ${b}
    }

    ${k}
    ${O!=null?`let cOffset = ${O.broadcastedIndicesToOffset("vec2(m, n)",N)}; value += ${z}(uniforms.beta) * ${O.getByOffset("cOffset")};`:""}
    output[global_idx] = value;
  }`},x=w=>{let b=U("a",e[0].dataType,e[0].dims),k=U("b",e[1].dataType,e[1].dims),S=null,I=[b,k];e.length===3&&(S=U("c",e[2].dataType,e[2].dims.length),I.push(S));let z=ce("output",e[0].dataType,o.length);I.push(z);let O=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],R="",N="";t.transA&&t.transB?(N=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(N=`
      var col = tile_row_start + local_id.x;
      var row = k_start + local_id.y;
      if (col < uniforms.M && row < uniforms.K) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = tile_col_start + local_id.x;
      row = k_start + local_id.y;
      if (col < uniforms.N && row < uniforms.K) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(N=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
      }

      col = k_start + local_id.x;
      row = tile_col_start + local_id.y;
      if (col < uniforms.K && row < uniforms.N) {
        tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
      } else {
        tile_b[local_id.y][local_id.x] = ${k.type.value}(0);
      }
      `,R="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(N=`
      var col = k_start + local_id.x;
      var row = tile_row_start + local_id.y;
      if (col < uniforms.K && row < uniforms.M) {
        tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
      } else {
        tile_a[local_id.y][local_id.x] = ${b.type.value}(0);
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
  var<workgroup> tile_a: array<array<${b.type.storage}, ${u}>, ${u}>;
  var<workgroup> tile_b: array<array<${k.type.storage}, ${u}>, ${u}>;
  ${w.mainStart([u,u,1])}
    let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${u};
    let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${u};
    let num_tiles = (uniforms.K - 1) / ${u} + 1;
    var k_start = 0u;
    var value = ${z.type.value}(0);
    for (var t: u32 = 0u; t < num_tiles; t++) {
      ${N}
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
  }`};return p?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:l*c},programUniforms:m}),getShaderSource:x}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:m}),getShaderSource:y}},H_=e=>{let t=e.transA,r=e.transB,n=e.alpha,s=e.beta;return{transA:t,transB:r,alpha:n,beta:s,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},F_=(e,t)=>{hp(e.inputs),e.compute(mp(e.inputs,t))}}),Ft,rr,zr,Or,gp,_p,yp,bp,wp,$p,vp,xp,G_,j_,M1=j(()=>{we(),xe(),Ke(),ke(),[Ft,rr,zr,Or]=[0,1,2,3],gp=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},_p=`
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
`,yp=e=>`
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
`,bp=e=>`
  fn gs_denormalize(n: f32, length: i32) -> f32 {
    ${e.alignCorners===0?`
    // alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
    return ((n + 1.0) * f32(length) - 1.0) / 2.0;
    `:`
    // alignCorners: true => [-1, 1] to [0, length - 1]
    return (n + 1.0) / 2.0 * (f32(length - 1));
    `}
  }
`,wp=e=>`
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
`,$p=(e,t,r)=>`
  fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
     var pixel = ${t}(0);
     var indices = vec4<u32>(0);
     indices[${Ft}] = batch;
     indices[${rr}] = channel;`+(()=>{switch(r.paddingMode){case"zeros":return`
          if (r >= 0 && r < H && c >=0 && c < W) {
            indices[${zr}] = u32(r);
            indices[${Or}] = u32(c);
          } else {
            return ${t}(0);
          }
        `;case"border":return`
          indices[${zr}] = u32(clamp(r, 0, H - 1));
          indices[${Or}] = u32(clamp(c, 0, W - 1));
        `;case"reflection":return`
          indices[${zr}] = gs_reflect(r, border[1], border[3]);
          indices[${Or}] = gs_reflect(c, border[0], border[2]);
        `;default:throw new Error(`padding mode ${r.paddingMode} is not supported`)}})()+`
    return ${e.getByIndices("indices")};
  }
`,vp=(e,t,r)=>(()=>{switch(r.mode){case"nearest":return`
          let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Ft}], indices[${rr}], border);
        `;case"bilinear":return`
          let x1 = i32(floor(x));
          let y1 = i32(floor(y));
          let x2 = x1 + 1;
          let y2 = y1 + 1;

          let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Ft}], indices[${rr}], border);
          let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Ft}], indices[${rr}], border);
          let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Ft}], indices[${rr}], border);
          let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Ft}], indices[${rr}], border);

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
              p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Ft}], indices[${rr}], border);
            }
          }

          let dx = x - f32(x0 + 1);
          let dy = y - f32(y0 + 1);
          let result = gs_bicubic_interpolate(p, dx, dy);
        `;default:throw new Error(`mode ${r.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,xp=(e,t)=>{let r=U("x",e[0].dataType,e[0].dims.length),n=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],s=U("grid",e[1].dataType,n.length,2),i=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(i=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Ft,rr,zr,Or]=[0,3,1,2]);let a=ce("output",e[0].dataType,i.length),o=r.type.value,u=B.size(i),l=[{type:12,data:u},...he(e[0].dims,n,i)],c=p=>`
  ${p.registerUniform("output_size","u32").declareVariables(r,s,a)}
  ${_p}
  ${yp(o)}
  ${bp(t)}
  ${wp(t)}
  ${$p(r,o,t)}

  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let H_in = i32(uniforms.x_shape[${zr}]);
      let W_in = i32(uniforms.x_shape[${Or}]);

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
      var grid_indices = vec3<u32>(indices[${Ft}], indices[${zr}], indices[${Or}]);
      let nxy = ${s.getByIndices("grid_indices")};
      var x = gs_denormalize(f32(nxy[0]), W_in);
      var y = gs_denormalize(f32(nxy[1]), H_in);

      ${vp(a,o,t)}
  }`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:p=>{let h=B.size(i);return{outputs:[{dims:i,dataType:p[0].dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:l}},getShaderSource:c}},G_=(e,t)=>{gp(e.inputs),e.compute(xp(e.inputs,t))},j_=e=>Ne({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),dt,Sp,K_,_a,kp,Bn,Z_,Q_=j(()=>{we(),xe(),Ke(),Zo(),Yo(),ke(),Er(),dt=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Sp=(e,t)=>{let r=e[0],n=dt(e,1),s=dt(e,2),i=dt(e,3),a=dt(e,4),o=dt(e,5),u=dt(e,6),l=dt(e,7);if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let c=r.dims[0],p=r.dims[1],h=r.dims.length===3?r.dims[2]:t.numHeads*r.dims[4],m=p,g=0,y=0,x=Math.floor(h/t.numHeads);if(u&&l&&B.size(u.dims)&&B.size(l.dims)){if(u.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(u.dims[0]!==c||u.dims[1]!==t.numHeads||u.dims[3]!==x)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[0]!==c||l.dims[1]!==t.numHeads||l.dims[3]!==x)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(u.dims[2]!==l.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(l.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');g=u.dims[2],y=u.dims[2]}else if(u&&B.size(u.dims)||l&&B.size(l.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let w;if(n&&B.size(n.dims)>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(n.dims.length<3||n.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(n.dims.length===3){if(n.dims[2]!==r.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');w=2,m=n.dims[1]}else if(n.dims.length===5){if(n.dims[2]!==t.numHeads||n.dims[3]!==2||n.dims[4]!==x)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(s)throw new Error('Expect "value" be none when "key" has packed kv format.');w=5,m=n.dims[1]}else{if(n.dims[1]!==t.numHeads||n.dims[3]!==x)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');w=0,m=n.dims[2]}}else{if(r.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(r.dims[2]!==t.numHeads||r.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');w=3}if(i&&B.size(i.dims)>0){if(i.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(n&&n.dims.length===5&&n.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let b=g+m,k=0;if(a&&B.size(a.dims)>0){k=8;let O=a.dims;throw O.length===1?O[0]===c?k=1:O[0]===3*c+2&&(k=3):O.length===2&&O[0]===c&&O[1]===b&&(k=5),k===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let S=!1,I=h;if(s&&B.size(s.dims)>0){if(s.dims.length!==3&&s.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==s.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(s.dims.length===3){if(m!==s.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');I=s.dims[2]}else{if(m!==s.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');I=s.dims[1]*s.dims[3],S=!0}}let z=!1;if(a&&B.size(a.dims)>0)throw new Error("Key padding mask is not supported");if(o&&B.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==c||o.dims[1]!==t.numHeads||o.dims[2]!==p||o.dims[3]!==b)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:c,sequenceLength:p,pastSequenceLength:g,kvSequenceLength:m,totalSequenceLength:b,maxSequenceLength:y,inputHiddenSize:0,hiddenSize:h,vHiddenSize:I,headSize:x,vHeadSize:Math.floor(I/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:k,scale:t.scale,broadcastResPosBias:z,passPastInKv:S,qkvFormat:w}},K_=e=>Ne({...e}),_a=Ne({perm:[0,2,1,3]}),kp=(e,t,r,n,s,i,a)=>{let o=[n,s,i],u=B.size(o),l=[{type:12,data:u},{type:12,data:a},{type:12,data:i}],c=p=>{let h=ce("qkv_with_bias",t.dataType,o),m=U("qkv",t.dataType,o),g=U("bias",r.dataType,o),y=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
  ${p.registerUniforms(y).declareVariables(m,g,h)}
  ${p.mainStart()}
    ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
    let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

    qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
  }`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:c},{inputs:[t,r],outputs:[-1]})[0]},Bn=(e,t,r,n,s,i,a,o)=>{let u=i;if(a&&B.size(a.dims)>0){if(n===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return u=kp(e,i,a,t,n,r*s,o),u=u.reshape([t,n,r,s]),r===1||n===1?u:e.compute(xt(u,_a.perm),{inputs:[u],outputs:[-1]})[0]}else return i.dims.length===3&&(u=i.reshape([t,n,r,s])),r===1||n===1?u:e.compute(xt(u,_a.perm),{inputs:[u],outputs:[-1]})[0]},Z_=(e,t)=>{let r=Sp(e.inputs,t),n=e.inputs[0],s=dt(e.inputs,1),i=dt(e.inputs,2),a=dt(e.inputs,3),o=dt(e.inputs,4),u=dt(e.inputs,5),l=dt(e.inputs,6),c=dt(e.inputs,7);if(n.dims.length===5)throw new Error("Packed QKV is not implemented");if((s==null?void 0:s.dims.length)===5)throw new Error("Packed KV is not implemented");let p=s&&i&&s.dims.length===4&&i.dims.length===4,h=Bn(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,n,a,0);if(p)return ei(e,h,s,i,o,void 0,l,c,u,r);if(!s||!i)throw new Error("key and value must be provided");let m=Bn(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.headSize,s,a,r.hiddenSize),g=Bn(e,r.batchSize,r.numHeads,r.kvSequenceLength,r.vHeadSize,i,a,2*r.hiddenSize);ei(e,h,m,g,o,void 0,l,c,u,r)}}),Tp,Ep,Ip,Cp,po,X_,Y_,J_=j(()=>{we(),xe(),Ke(),ke(),Tp=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Ep=(e,t)=>{let r=[],n=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(s=>r.push(Number(s))),n=r.length),Ne({numOutputs:n,axis:t.axis,splitSizes:r})},Ip=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
    for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
    if (index < ${pe("uniforms.size_in_split_axis","i",e)}) {
        return i;
    }
    }
    return ${e}u;
}`,Cp=e=>{let t=e.length,r=[];for(let n=0;n<t;++n){let s=e[n].setByIndices("indices","input[global_idx]");t===1?r.push(s):n===0?r.push(`if (output_number == ${n}u) { ${s} }`):n===t-1?r.push(`else { ${s} }`):r.push(`else if (output_number == ${n}) { ${s} }`)}return`
      fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
        ${r.join(`
`)}
      }`},po=(e,t)=>{let r=e[0].dims,n=B.size(r),s=e[0].dataType,i=B.normalizeAxis(t.axis,r.length),a=new Array(t.numOutputs),o=U("input",s,r.length),u=new Array(t.numOutputs),l=[],c=[],p=0,h=[{type:12,data:n}];for(let g=0;g<t.numOutputs;g++){p+=t.splitSizes[g],u[g]=p;let y=r.slice();y[i]=t.splitSizes[g],c.push(y),a[g]=ce(`output${g}`,s,y.length),l.push({dims:c[g],dataType:e[0].dataType})}h.push({type:12,data:u},...he(r,...c));let m=g=>`
  ${g.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(o,...a)}
  ${Ip(u.length)}
  ${Cp(a)}

  ${g.mainStart()}
    ${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

    var indices = ${o.offsetToIndices("global_idx")};
    var index = ${o.indicesGet("indices",i)};
    let output_number = calculateOutputIndex(index);
    if (output_number != 0) {
      index -= ${pe("uniforms.size_in_split_axis","output_number - 1u",u.length)};
      ${o.indicesSet("indices",i,"index")};
    }
    writeBufferData(output_number, indices, global_idx);
  }`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:m,getRunData:()=>({outputs:l,dispatchGroup:{x:Math.ceil(n/64)},programUniforms:h})}},X_=(e,t)=>{Tp(e.inputs);let r=e.inputs.length===1?t:Ep(e.inputs,t);e.compute(po(e.inputs,r),{inputs:[0]})},Y_=e=>{let t=e.axis,r=e.splitSizes,n=e.numOutputs<0?r.length:e.numOutputs;if(n!==r.length)throw new Error("numOutputs and splitSizes lengh must be equal");return Ne({axis:t,numOutputs:n,splitSizes:r})}}),zp,Zi,ey,ty=j(()=>{we(),xe(),Ke(),ke(),zp=(e,t)=>{let[r,n,s,i]=e,{numHeads:a,rotaryEmbeddingDim:o}=t;if(r.dims.length!==3&&r.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${r.dims.length}`);if(!B.areEqual(n.dims,[])&&!B.areEqual(n.dims,[1])&&n.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${n.dims.length}`);if(s.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${s.dims.length}`);if(i.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${i.dims.length}`);if(!B.areEqual(s.dims,i.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&a===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let u=r.dims[0],l=r.dims[r.dims.length-2],c=s.dims[0],p=B.sizeFromDimension(r.dims,1)/l,h=o===0?s.dims[1]*2:p/a;if(o>h)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(n.dims.length===2){if(u!==n.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${n.dims[0]}`);if(l!==n.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${n.dims[1]}`)}if(h/2!==s.dims[1]&&o/2!==s.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${s.dims[1]}`);if(l>c)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},Zi=(e,t)=>{let{interleaved:r,numHeads:n,rotaryEmbeddingDim:s,scale:i}=t,a=e[0].dims[0],o=B.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],l=o/u,c=e[2].dims[1],p=s===0?c*2:l/n,h=new Array(a,u,l/p,p-c),m=B.computeStrides(h),g=[{type:1,data:i},{type:12,data:h},{type:12,data:m},...e[0].dims.length===3?new Array({type:12,data:[o,l,p,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,p,u*p,1]}):[],...he(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],y=x=>{let w=U("input",e[0].dataType,e[0].dims.length),b=U("position_ids",e[1].dataType,e[1].dims.length),k=U("cos_cache",e[2].dataType,e[2].dims.length),S=U("sin_cache",e[3].dataType,e[3].dims.length),I=ce("output",e[0].dataType,e[0].dims.length);return x.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:h.length},{name:"global_strides",type:"u32",length:m.length},{name:"input_output_strides",type:"u32",length:m.length}]),`
        ${x.declareVariables(w,b,k,S,I)}

        ${x.mainStart(dn)}
          let half_rotary_emb_dim = uniforms.${k.name}_shape[1];
          let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
          let size = uniforms.global_shape[0] * uniforms.global_strides[0];
          ${x.guardAgainstOutOfBoundsWorkgroupSizes("size")}

          if (bsnh[3] < half_rotary_emb_dim) {
            let position_ids_idx =
                ${b.broadcastedIndicesToOffset("bsnh.xy",ce("",b.type.tensor,2))};
            let position_id =
                u32(${b.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
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
        }`};return{name:"RotaryEmbedding",shaderCache:{hint:Ne({interleaved:r}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:y,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(B.size(h)/dn)},programUniforms:g})}},ey=(e,t)=>{zp(e.inputs,t),e.compute(Zi(e.inputs,t))}}),Op,Ap,ya,Rp,ry,N1=j(()=>{Ke(),we(),Yo(),Q_(),J_(),Er(),ty(),ke(),Op=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let r=e[0],n=e[1],s=e[2],i=e[3],a=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(r.dims.length!==3&&r.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,u=r.dims[0],l=r.dims[1],c=r.dims.length===3?o?r.dims[2]/3:r.dims[2]:t.numHeads*r.dims[4],p=l,h=0,m=!n||n.dims.length===0,g=Math.floor(m?c/(t.numHeads+2*t.kvNumHeads):c/t.numHeads);m&&(c=g*t.numHeads);let y=i&&i.dims.length!==0,x=a&&a.dims.length!==0;if(y&&i.dims.length===4&&i.dims[0]===u&&i.dims[1]!==t.kvNumHeads&&i.dims[2]===t.kvNumHeads&&i.dims[3]===g)throw new Error("BSNH pastKey/pastValue is not supported");if(y&&x){if(i.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(a.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');h=i.dims[2]}else if(y||x)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let w=1;if(n&&n.dims.length>0){if(r.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(n.dims.length<3||n.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(r.dims[0]!==n.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(n.dims.length===3){if(r.dims[2]%n.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');p=n.dims[1]}else if(n.dims.length===5){if(n.dims[2]!==t.numHeads||n.dims[3]!==2||n.dims[4]!==g)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(s)throw new Error('Expect "value" be none when "key" has packed kv format.');p=n.dims[1]}else{if(n.dims[1]!==t.numHeads||n.dims[3]!==g)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');p=n.dims[2]}}else{if(r.dims.length!==3&&r.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(r.dims.length===5&&(r.dims[2]!==t.numHeads||r.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');w=3}let b=0,k=!1,S=t.kvNumHeads?g*t.kvNumHeads:c;if(s&&s.dims.length>0){if(s.dims.length!==3&&s.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(r.dims[0]!==s.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(s.dims.length===3){if(p!==s.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');S=s.dims[2]}else{if(p!==s.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');S=s.dims[1]*s.dims[3],k=!0}}let I=e.length>4?e[5]:void 0;if(I&&I.dims.length!==1&&I.dims[0]!==u)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:u,sequenceLength:l,pastSequenceLength:h,kvSequenceLength:p,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:c,vHiddenSize:S,headSize:g,vHeadSize:Math.floor(S/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:b,scale:t.scale,broadcastResPosBias:!1,passPastInKv:k,qkvFormat:w}},Ap=Ne({perm:[0,2,1,3]}),ya=(e,t,r)=>{let n=t,s=r.kvNumHeads;return t.dims.length===3&&r.kvSequenceLength!==0&&(n=t.reshape([r.batchSize,r.kvSequenceLength,s,r.headSize]),n=e.compute(xt(n,Ap.perm),{inputs:[n],outputs:[-1]})[0]),n},Rp=(e,t,r,n)=>{let s=7,i=["type","type"],a=[e*t],o=e*t,u=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],l=c=>{let p=U("seq_lens",r.dataType,r.dims),h=U("total_seq_lens",n.dataType,n.dims),m=ce("pos_ids",s,a),g=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
  ${c.registerUniforms(g).declareVariables(p,h,m)}
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
  `};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:i},getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u}),getShaderSource:l}},ry=(e,t)=>{var S;let r=Op(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(((S=e.inputs[1])==null?void 0:S.dims.length)===5)throw new Error("Packed KV is not implemented");let n=e.inputs[0],s=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,i=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,a=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,l=e.inputs.length>5?e.inputs[6]:void 0,c=r.kvNumHeads?r.kvNumHeads:r.numHeads,p=Ne({axis:2,numOutputs:3,splitSizes:[r.numHeads*r.headSize,c*r.headSize,c*r.headSize]}),[h,m,g]=!s&&!i?e.compute(po([n],p),{inputs:[n],outputs:[-1,-1,-1]}):[n,s,i],y,x;if(t.doRotary){let I=e.compute(Rp(r.batchSize,r.sequenceLength,u,l),{inputs:[u,l],outputs:[-1]})[0],z=e.inputs[7],O=e.inputs[8],R=Ne({interleaved:t.rotaryInterleaved!==0,numHeads:r.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),N=[h,I,z,O],G=[-1];y=e.compute(Zi(N,R),{inputs:N,outputs:G})[0],N.splice(0,1,m);let ue=Ne({interleaved:t.rotaryInterleaved!==0,numHeads:r.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});x=e.compute(Zi(N,ue),{inputs:N,outputs:G})[0]}let w=Bn(e,r.batchSize,r.numHeads,r.sequenceLength,r.headSize,t.doRotary?y:h,void 0,0),b=ya(e,t.doRotary?x:m,r),k=ya(e,g,r);ei(e,w,b,k,void 0,void 0,a,o,void 0,r,u,l)}}),ba,Bp,Mp,ny,P1=j(()=>{we(),xe(),Er(),ke(),ba=(e,t,r,n,s,i,a,o)=>{let u=Ge(i),l=u===1?"f32":`vec${u}f`,c=u===1?"vec2f":`mat2x${u}f`,p=s*a,h=64;p===1&&(h=256);let m=[s,a,i/u],g=[s,a,2],y=["rank","type","type"],x=[];x.push(...he(m,g));let w=b=>{let k=U("x",t.dataType,3,u),S=U("scale",r.dataType,r.dims),I=U("bias",n.dataType,n.dims),z=ce("output",1,3,2),O=[k,S,I,z];return`
  var<workgroup> workgroup_shared : array<${c}, ${h}>;
  const workgroup_size = ${h}u;
  ${b.declareVariables(...O)}
  ${b.mainStart(h)}
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
      let sum_final = ${xr("workgroup_shared[0][0]",u)} / f32(hight * ${u});
      let squared_sum_final = ${xr("workgroup_shared[0][1]",u)} / f32(hight * ${u});

      let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
      let channel_scale = inv_std_dev * f32(scale[channel]);
      let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
      output[workgroup_index] = vec2f(channel_scale, channel_shift);
    }
  }`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${o};${h}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:g,dataType:1}],dispatchGroup:{x:p},programUniforms:x}),getShaderSource:w},{inputs:[t,r,n],outputs:[-1]})[0]},Bp=(e,t,r)=>{let n=t[0].dims,s=n,i=2,a=n[0],o=n[1],u=B.sizeFromDimension(n,i),l=Ge(u),c=B.size(s)/l,p=ba(e,t[0],t[1],t[2],a,u,o,r.epsilon),h=[a,o,u/l],m=[a,o],g=["type","none"],y=x=>{let w=U("x",t[0].dataType,h.length,l),b=U("scale_shift",1,m.length,2),k=ce("output",t[0].dataType,h.length,l),S=[w,b,k];return`
  ${x.registerUniform("output_size","u32").declareVariables(...S)}
  ${x.mainStart()}
  ${x.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
      let outputIndices = ${k.offsetToIndices("global_idx")};
      let batch = outputIndices[0];
      let channel = outputIndices[1];
      let scale_shift = ${b.getByIndices("vec2<u32>(batch, channel)")};
      let value = ${w.getByOffset("global_idx")} * ${k.type.value}(scale_shift.x) + ${k.type.value}(scale_shift.y);
      ${k.setByOffset("global_idx","value")};
  }`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${l}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:s,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:[{type:12,data:c},...he(h,m,h)]}),getShaderSource:y},{inputs:[t[0],p]})},Mp=(e,t,r)=>{let n=t[0].dims,s=n,i=n[0],a=n[n.length-1],o=B.sizeFromDimension(n,1)/a,u=Ge(a),l=B.size(s)/u,c=[{type:12,data:o},{type:12,data:Math.floor(a/u)}],p=["type","type"],h=!1,m=[0,n.length-1];for(let w=0;w<n.length-2;w++)h=h||n[w+1]!==1,m.push(w+1);h=h&&n[n.length-1]!==1;let g=h?e.compute(xt(e.inputs[0],m),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:n.length},(w,b)=>n[m[b]])),y=ba(e,g,t[1],t[2],i,o,a,r.epsilon),x=w=>{let b=Je(t[0].dataType),k=u===1?"vec2f":`mat${u}x2f`,S=O=>{let R=O===0?"x":"y",N=u===1?"f32":`vec${u}f`;switch(u){case 1:return`${b}(${N}(scale.${R}))`;case 2:return`vec2<${b}>(${N}(scale[0].${R}, scale[1].${R}))`;case 4:return`vec4<${b}>(${N}(scale[0].${R}, scale[1].${R}, scale[2].${R}, scale[3].${R}))`;default:throw new Error(`Not supported compoents ${u}`)}},I=U("input",t[0].dataType,t[0].dims,u),z=ce("output",t[0].dataType,s,u);return`
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
  }`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${u}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:s,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:c}),getShaderSource:x},{inputs:[t[0],y]})},ny=(e,t)=>{t.format==="NHWC"?Mp(e,e.inputs,t):Bp(e,e.inputs,t)}}),Np,Pp,iy,D1=j(()=>{we(),xe(),ke(),Np=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},Pp=(e,t,r)=>{let n=t.simplified,s=e[0].dims,i=e[1],a=!n&&e[2],o=s,u=B.normalizeAxis(t.axis,s.length),l=B.sizeToDimension(s,u),c=B.sizeFromDimension(s,u),p=B.size(i.dims),h=a?B.size(a.dims):0;if(p!==c||a&&h!==c)throw new Error(`Size of X.shape()[axis:] == ${c}.
       Size of scale and bias (if provided) must match this.
       Got scale size of ${p} and bias size of ${h}`);let m=[];for(let I=0;I<s.length;++I)I<u?m.push(s[I]):m.push(1);let g=Ge(c),y=["type","type"],x=[{type:12,data:l},{type:1,data:c},{type:12,data:Math.floor(c/g)},{type:1,data:t.epsilon}];a&&y.push("type");let w=r>1,b=r>2,k=I=>{let z=Je(e[0].dataType),O=[U("x",e[0].dataType,e[0].dims,g),U("scale",i.dataType,i.dims,g)];a&&O.push(U("bias",a.dataType,a.dims,g)),O.push(ce("output",e[0].dataType,o,g)),w&&O.push(ce("mean_data_output",1,m)),b&&O.push(ce("inv_std_output",1,m));let R=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
  ${I.registerUniforms(R).declareVariables(...O)}
  ${I.mainStart()}
    ${I.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
    let offset = global_idx * uniforms.norm_size_vectorized;
    var mean_vector = ${ro("f32",g)};
    var mean_square_vector = ${ro("f32",g)};

    for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
      let value = ${en(z,g,"x[h + offset]")};
      mean_vector += value;
      mean_square_vector += value * value;
    }
    let mean = ${xr("mean_vector",g)} / uniforms.norm_size;
    let inv_std_dev = inverseSqrt(${xr("mean_square_vector",g)} / uniforms.norm_size ${n?"":"- mean * mean"} + uniforms.epsilon);

    for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
      let f32input = ${en(z,g,"x[j + offset]")};
      let f32scale = ${en(z,g,"scale[j]")};
      output[j + offset] = ${O[0].type.value}((f32input ${n?"":"- mean"}) * inv_std_dev * f32scale
        ${a?`+ ${en(z,g,"bias[j]")}`:""}
      );
    }

    ${w?"mean_data_output[global_idx] = mean":""};
    ${b?"inv_std_output[global_idx] = inv_std_dev":""};
  }`},S=[{dims:o,dataType:e[0].dataType}];return w&&S.push({dims:m,dataType:1}),b&&S.push({dims:m,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${g};${r};${n}`,inputDependencies:y},getRunData:()=>({outputs:S,dispatchGroup:{x:Math.ceil(l/64)},programUniforms:x}),getShaderSource:k}},iy=(e,t)=>{Np(e.inputs),e.compute(Pp(e.inputs,t,e.outputCount))}}),Dp,sy,U1=j(()=>{xe(),nu(),iu(),Dp=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},sy=e=>{Dp(e.inputs);let t=ln.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let r=t[t.length-1],n=e.inputs[0].dims[e.inputs[0].dims.length-1];if(r<8&&n<8)e.compute(ru(e.inputs,{activation:""},t));else{let s=t[t.length-2],i=B.size(e.inputs[0].dims.slice(0,-2)),a=B.size(e.inputs[1].dims.slice(0,-2));if(i!==1&&s===1&&a===1){let o=e.inputs[0].reshape([1,i,n]),u=e.inputs[1].reshape([1,n,r]),l=[1,i,r],c=[o,u];e.compute(Ki(c,{activation:""},t,l),{inputs:c})}else e.compute(Ki(e.inputs,{activation:""},t))}}}),Up,Wp,qp,ay,oy,W1=j(()=>{we(),xe(),Ke(),ke(),Up=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let r=e[0],n=r.dims.length;if(r.dims[n-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let s=Math.floor((t.k+t.blockSize-1)/t.blockSize),i=t.blockSize/8*t.bits,a=e[1];if(!B.areEqual(a.dims,[t.n,s,i]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(B.size(o)!==t.n*s)throw new Error("scales input size error.");if(e.length===4){let u=e[3].dims,l=t.bits>4?t.n*s:t.n*Math.floor((s+1)/2);if(B.size(u)!==l)throw new Error("zeroPoints input size error.")}},Wp=(e,t)=>{let r=e[0].dims,n=r.length,s=r[n-2],i=t.k,a=t.n,o=r.slice(0,n-2),u=B.size(o),l=e[1].dims[2]/4,c=e[0].dataType,p=Ge(t.k),h=Ge(l),m=Ge(a),g=o.concat([s,a]),y=s>1&&a/m%2===0?2:1,x=B.size(g)/m/y,w=64,b=[],k=[u,s,i/p],S=B.convertShape(e[1].dims).slice();S.splice(-1,1,l/h),b.push(...he(k)),b.push(...he(S)),b.push(...he(e[2].dims)),e.length===4&&b.push(...he(B.convertShape(e[3].dims)));let I=[u,s,a/m];b.push(...he(I));let z=O=>{let R=k.length,N=U("a",e[0].dataType,R,p),G=U("b",12,S.length,h),ue=U("scales",e[2].dataType,e[2].dims.length),ne=[N,G,ue],se=e.length===4?U("zero_points",12,e[3].dims.length):void 0;se&&ne.push(se);let Se=I.length,_e=ce("output",e[0].dataType,Se,m),Q=Je(e[0].dataType),ie=(()=>{switch(p){case 1:return`array<${Q}, 8>`;case 2:return`mat4x2<${Q}>`;case 4:return`mat2x4<${Q}>`;default:throw new Error(`${p}-component is not supported.`)}})(),K=()=>{let P=`
          // reuse a data
            var input_offset = ${N.indicesToOffset(`${N.type.indices}(batch, row, word_offset)`)};
            var a_data: ${ie};
            for (var j: u32 = 0; j < ${8/p}; j++) {
              a_data[j] = ${N.getByOffset("input_offset")};
              input_offset++;
            }
          `;for(let H=0;H<m*y;H++)P+=`
            b_value = ${h===1?`b${H}_data`:`b${H}_data[i]`};
            b_value_lower = unpack4xU8(b_value & b_mask);
            b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
            b_quantized_values = ${ie}(${Array.from({length:4},(Y,ge)=>`${Q}(b_value_lower[${ge}]), ${Q}(b_value_upper[${ge}])`).join(", ")});
            b_dequantized_values = ${p===1?`${ie}(${Array.from({length:8},(Y,ge)=>`(b_quantized_values[${ge}] - ${se?`zero_point${H}`:"zero_point"}) * scale${H}`).join(", ")});`:`(b_quantized_values - ${ie}(${Array(8).fill(`${se?`zero_point${H}`:"zero_point"}`).join(",")})) * scale${H};`};
            workgroup_shared[local_id.x * ${y} + ${Math.floor(H/m)}]${m>1?`[${H%m}]`:""} += ${Array.from({length:8/p},(Y,ge)=>`${p===1?`a_data[${ge}] * b_dequantized_values[${ge}]`:`dot(a_data[${ge}], b_dequantized_values[${ge}])`}`).join(" + ")};
          `;return P},de=()=>{let P=`
            var col_index = col * ${m};
            ${se?`
            let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
            var zero_point_byte_count: u32;
            var zero_point_word_index: u32;
            var zero_point_byte_offset: u32;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            var zero_point_bits_offset: u32;
            var zero_point_word: u32;`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${Q}(8);`}
            `;for(let H=0;H<m*y;H++)P+=`
            let scale${H} = ${ue.getByOffset("col_index * nBlocksPerCol + block")};
            ${se?`
            zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
            zero_point_word_index = zero_point_byte_count >> 0x2u;
            zero_point_byte_offset = zero_point_byte_count & 0x3u;
            zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            zero_point_word = ${se.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point${H} = ${Q}((zero_point_word) & 0xFu);`:""}
            col_index += 1;`;return P},Re=()=>{let P=`col_index = col * ${m};`;for(let H=0;H<m*y;H++)P+=`
            let b${H}_data = ${G.getByIndices(`${G.type.indices}(col_index, block, word)`)};
            col_index += 1;`;return P+=`
            var b_value: u32;
            let b_mask: u32 = 0x0F0F0F0Fu;
            var b_value_lower: vec4<u32>;
            var b_value_upper: vec4<u32>;
            var b_quantized_values: ${ie};
            var b_dequantized_values: ${ie};`,P};return`
        var<workgroup> workgroup_shared: array<${_e.type.value}, ${y*w}>;
        ${O.declareVariables(...ne,_e)}
        ${O.mainStart([w,1,1])}
          let output_indices = ${_e.offsetToIndices(`(global_idx / ${w}) * ${y}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let nBlocksPerCol = uniforms.b_shape[1];

          for (var block = local_id.x; block < nBlocksPerCol; block += ${w}) {
            //process one block
            var word_offset: u32 = block * ${t.blockSize/p};
            ${de()}
            for (var word: u32 = 0; word < ${l}; word += ${h}) {
              ${Re()}
              for (var i: u32 = 0; i < ${h}; i++) {
                ${K()}
                word_offset += ${8/p};
              }
            }
          }
          workgroupBarrier();

          if (local_id.x < ${y}) {
            var output_value: ${_e.type.value} = ${_e.type.value}(0);
            var workgroup_shared_offset: u32 = local_id.x;
            for (var b: u32 = 0u; b < ${w}u; b++) {
              output_value += workgroup_shared[workgroup_shared_offset];
              workgroup_shared_offset += ${y};
            }
            ${_e.setByIndices(`${_e.type.indices}(batch, row, col + local_id.x)`,"output_value")};
          }
        }`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${p};${h};${m};${y};${w}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:g,dataType:c}],dispatchGroup:{x},programUniforms:b}),getShaderSource:z}},qp=(e,t)=>{let r=e[0].dims,n=r.length,s=r[n-2],i=t.k,a=t.n,o=r.slice(0,n-2),u=B.size(o),l=e[1].dims[2]/4,c=e[0].dataType,p=Ge(t.k),h=Ge(l),m=o.concat([s,a]),g=128,y=a%8===0?8:a%4===0?4:1,x=g/y,w=x*h*8,b=w/p,k=w/t.blockSize,S=B.size(m)/y,I=[],z=[u,s,i/p],O=B.convertShape(e[1].dims).slice();O.splice(-1,1,l/h),I.push(...he(z)),I.push(...he(O)),I.push(...he(e[2].dims)),e.length===4&&I.push(...he(B.convertShape(e[3].dims)));let R=[u,s,a];I.push(...he(R));let N=G=>{let ue=z.length,ne=U("a",e[0].dataType,ue,p),se=U("b",12,O.length,h),Se=U("scales",e[2].dataType,e[2].dims.length),_e=[ne,se,Se],Q=e.length===4?U("zero_points",12,e[3].dims.length):void 0;Q&&_e.push(Q);let ie=R.length,K=ce("output",e[0].dataType,ie),de=Je(e[0].dataType),Re=()=>{switch(p){case 1:return`
          let a_data0 = vec4<${de}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
          let a_data1 = vec4<${de}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
          let a_data0 = vec4<${de}>(sub_a[word_offset], sub_a[word_offset + 1]);
          let a_data1 = vec4<${de}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
          let a_data0 = sub_a[word_offset];
          let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${p}-component is not supported.`)}};return`
        var<workgroup> sub_a: array<${ne.type.value}, ${b}>;
        var<workgroup> inter_results: array<array<${K.type.value}, ${x}>, ${y}>;
        ${G.declareVariables(..._e,K)}
        ${G.mainStart([x,y,1])}
          let output_indices = ${K.offsetToIndices(`workgroup_index * ${y}`)};
          let col = output_indices[2];
          let row = output_indices[1];
          let batch = output_indices[0];
          let n_blocks_per_col = uniforms.b_shape[1];
          let num_tiles =  (n_blocks_per_col - 1) / ${k} + 1;

          // Loop over shared dimension.
          for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
            let a_col_start = tile * ${b};
            // load one tile A data into shared memory.
            for (var a_offset = local_idx; a_offset < ${b}; a_offset += ${g})
            {
              let a_col = a_col_start + a_offset;
              if (a_col < uniforms.a_shape[2])
              {
                sub_a[a_offset] = ${ne.getByIndices(`${ne.type.indices}(batch, row, a_col)`)};
              } else {
                sub_a[a_offset] = ${ne.type.value}(0);
              }
            }
            workgroupBarrier();

            // each thread process one block
            let b_row = col + local_id.y;
            let block = tile * ${k} + local_id.x;
            ${Q?`
            let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
            let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
            let zero_point_word_index = zero_point_byte_count >> 0x2u;
            let zero_point_byte_offset = zero_point_byte_count & 0x3u;
            let zero_point_nibble_offset: u32 = block & 0x1u;
            let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
            let zero_point_word = ${Q.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
            let zero_point = ${de}((zero_point_word) & 0xFu);`:`
            // The default zero point is 8 for unsigned 4-bit quantization.
            let zero_point = ${de}(8);`}
            let scale = ${Se.getByOffset("b_row * n_blocks_per_col + block")};
            let b_data = ${se.getByIndices(`${se.type.indices}(b_row, block, 0)`)};
            var word_offset = local_id.x * ${t.blockSize/p};
            for (var i: u32 = 0; i < ${h}; i++) {
              ${Re()}
              let b_value = ${h===1?"b_data":"b_data[i]"};
              let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
              let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
              let b_quantized_values = mat2x4<${de}>(${Array.from({length:4},(P,H)=>`${de}(b_value_lower[${H}]), ${de}(b_value_upper[${H}])`).join(", ")});
              let b_dequantized_values = (b_quantized_values - mat2x4<${de}>(${Array(8).fill("zero_point").join(",")})) * scale;
              inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(P,H)=>`${`dot(a_data${H}, b_dequantized_values[${H}])`}`).join(" + ")};
              word_offset += ${8/p};
            }
            workgroupBarrier();
          }

          if (local_idx < ${y}) {
            var output_value: ${K.type.value} = ${K.type.value}(0);
            for (var b = 0u; b < ${x}; b++) {
              output_value += inter_results[local_idx][b];
            }
            if (col + local_idx < uniforms.output_shape[2])
            {
              ${K.setByIndices(`${K.type.indices}(batch, row, col + local_idx)`,"output_value")}
            }
          }
        }`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${p};${h};${x};${y}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:m,dataType:c}],dispatchGroup:{x:S},programUniforms:I}),getShaderSource:N}},ay=(e,t)=>{Up(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(qp(e.inputs,t)):e.compute(Wp(e.inputs,t))},oy=e=>Ne(e)}),Lp,Vp,Hp,Fp,Gp,jp,Kp,Zp,uy,q1=j(()=>{we(),xe(),ke(),Lp=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},Vp=(e,t,r)=>{let n="";for(let s=t-1;s>=0;--s)n+=`
            k = i32(${e.indicesGet("indices",s)}) - ${pe("uniforms.pads",s,r)};
            if (k < 0) {
              break;
            }
            if (k >= i32(${pe("uniforms.x_shape",s,t)})) {
              break;
            }
            offset += k * i32(${pe("uniforms.x_strides",s,t)});
        `;return`
          value = ${e.type.value}(uniforms.constant_value);
          for (var i = 0; i < 1; i++) {
            var offset = 0;
            var k = 0;
            ${n}
            value = x[offset];
          }
      `},Hp=(e,t,r)=>{let n="";for(let s=t-1;s>=0;--s)n+=`
                k = i32(${e.indicesGet("indices",s)}) - ${pe("uniforms.pads",s,r)};
                if (k < 0) {
                  k = -k;
                }
                {
                  let _2n_1 = 2 * (i32(${pe("uniforms.x_shape",s,t)}) - 1);
                  k = k % _2n_1;
                  if(k >= i32(${pe("uniforms.x_shape",s,t)})) {
                    k = _2n_1 - k;
                  }
                }
                offset += k * i32(${pe("uniforms.x_strides",s,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},Fp=(e,t,r)=>{let n="";for(let s=t-1;s>=0;--s)n+=`
                k = i32(${e.indicesGet("indices",s)}) - ${pe("uniforms.pads",s,r)};
                if (k < 0) {
                  k = 0;
                }
                if (k >= i32(${pe("uniforms.x_shape",s,t)})) {
                  k = i32(${pe("uniforms.x_shape",s,t)}) - 1;
                }
                offset += k * i32(${pe("uniforms.x_strides",s,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},Gp=(e,t,r)=>{let n="";for(let s=t-1;s>=0;--s)n+=`
                k = i32(${e.indicesGet("indices",s)}) - ${pe("uniforms.pads",s,r)};
                if (k < 0)  {
                  k += i32(${pe("uniforms.x_shape",s,t)}]);
                }
                if (k >= i32(${pe("uniforms.x_shape",s,t)})) {
                  k -= i32(${pe("uniforms.x_shape",s,t)});
                }
                offset += k * i32(${pe("uniforms.x_strides",s,t)});
            `;return`
              var offset = 0;
              var k = 0;
              ${n}
              value = x[offset];
          `},jp=(e,t,r)=>{switch(r.mode){case 0:return Vp(e,t,r.pads.length);case 1:return Hp(e,t,r.pads.length);case 2:return Fp(e,t,r.pads.length);case 3:return Gp(e,t,r.pads.length);default:throw new Error("Invalid mode")}},Kp=(e,t)=>{let r=B.padShape(e[0].dims.slice(),t.pads),n=e[0].dims,s=B.size(r),i=[{type:12,data:s},{type:6,data:t.pads}],a=e.length>=3&&e[2].data;t.mode===0&&i.push({type:a?e[2].dataType:1,data:t.value}),i.push(...he(e[0].dims,r));let o=["rank"],u=l=>{let c=ce("output",e[0].dataType,r.length),p=U("x",e[0].dataType,n.length),h=p.type.value,m=jp(c,n.length,t),g=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&g.push({name:"constant_value",type:a?h:"f32"}),`
            ${l.registerUniforms(g).declareVariables(p,c)}
            ${l.mainStart()}
            ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

            let indices = ${c.offsetToIndices("global_idx")};

            var value = ${h}(0);
            ${m}
            output[global_idx] = value;
        }`};return{name:"Pad",shaderCache:{hint:`${t.mode}${a}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(B.size(r)/64)},programUniforms:i}),getShaderSource:u}},Zp=(e,t)=>{if(e.length>1){let r=e[1].getBigInt64Array(),n=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,s=e[0].dims.length,i=new Int32Array(2*s).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let u=0;u<o.length;u++)i[Number(o[u])]=Number(r[u]),i[Number(o[u])+s]=Number(r[u+o.length])}else r.forEach((o,u)=>i[Number(u)]=Number(o));let a=[];return i.forEach(o=>a.push(o)),{mode:t.mode,value:n,pads:a}}else return t},uy=(e,t)=>{Lp(e.inputs);let r=Zp(e.inputs,t);e.compute(Kp(e.inputs,r),{inputs:[0]})}}),Tn,wa,$a,va,xa,Qp,Xp,Sa,ka,ly,dy,Ta,cy,py,Ea,fy,hy,my,gy,L1=j(()=>{Wt(),we(),xe(),ke(),Tn=e=>{if(Le.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},wa=(e,t,r)=>{let n=t.format==="NHWC",s=e.dims.slice();n&&s.splice(1,0,s.pop());let i=Object.hasOwnProperty.call(t,"dilations"),a=t.kernelShape.slice(),o=t.strides.slice(),u=i?t.dilations.slice():[],l=t.pads.slice();Gi.adjustPoolAttributes(r,s,a,o,u,l);let c=Gi.computePoolOutputShape(r,s,o,u,a,l,t.autoPad),p=Object.assign({},t);i?Object.assign(p,{kernelShape:a,strides:o,pads:l,dilations:u,cacheKey:t.cacheKey}):Object.assign(p,{kernelShape:a,strides:o,pads:l,cacheKey:t.cacheKey});let h=c.slice();return h.push(h.splice(1,1)[0]),[p,n?h:c]},$a=(e,t)=>{let r=t.format==="NHWC",n=B.size(e),s=B.size(t.kernelShape),i=[{type:12,data:n},{type:12,data:s}],a=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],u=t.strides[t.strides.length-1],l=t.pads[t.pads.length/2-1],c=t.pads[t.pads.length-1],p=!!(l+c);i.push({type:12,data:o},{type:12,data:u},{type:12,data:l},{type:12,data:c}),a.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let h=!1;if(t.kernelShape.length===2){let m=t.kernelShape[t.kernelShape.length-2],g=t.strides[t.strides.length-2],y=t.pads[t.pads.length/2-2],x=t.pads[t.pads.length-2];h=!!(y+x),i.push({type:12,data:m},{type:12,data:g},{type:12,data:y},{type:12,data:x}),a.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[i,a,!0,p,h]}else{if(r)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=B.computeStrides(t.kernelShape);i.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),a.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let u=t.pads.reduce((l,c)=>l+c);return[i,a,!!u,!1,!1]}},va=(e,t,r,n,s,i,a,o,u,l,c,p)=>{let h=s.format==="NHWC",m=t.type.value,g=ce("output",t.type.tensor,n);if(s.kernelShape.length<=2){let y="",x="",w="",b=r-(h?2:1);if(c?y=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${b}] = indices[${b}] * uniforms.sw - uniforms.pwStart + i;
                  if (xIndices[${b}] < 0 || xIndices[${b}]
                      >= uniforms.x_shape[${b}]) {
                    pad++;
                    continue;
                  }
                  let x_val = x[${t.indicesToOffset("xIndices")}];
                  ${i}
                }`:y=`
                for (var i: u32 = 0u; i < uniforms.kw; i++) {
                  xIndices[${b}] = indices[${b}] * uniforms.sw - uniforms.pwStart + i;
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
            ${e.registerUniforms(u).declareVariables(t,g)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

              let indices = ${g.offsetToIndices("global_idx")};
              var xIndices = ${g.offsetToIndices("global_idx")};

              var value = ${m}(${o});
              var pad = 0;
              ${x}
              ${y}
              ${w}
              ${a}

              output[global_idx] = value;
            }`}else{if(h)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let y=s.kernelShape.length,x=s.pads.length,w="";return l?w=`
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
            ${e.registerUniforms(u).declareVariables(t,g)}

            ${e.mainStart()}
              ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
              let indices = ${g.offsetToIndices("global_idx")};
              var xIndices = ${g.offsetToIndices("global_idx")};

              var offsets: array<u32, ${y}>;

              var value = ${m}(${o});
              var pad = 0;
              var isPad = false;

              for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
                var offset = i;
                for (var j = 0u; j < ${y-1}u; j++) {
                  offsets[j] = offset / ${pe("uniforms.kernelStrides","j",y)};
                  offset -= offsets[j] * ${pe("uniforms.kernelStrides","j",y)};
                }
                offsets[${y-1}] = offset;

                isPad = false;
                for (var j = ${r-y}u; j < ${r}u; j++) {
                  xIndices[j] = indices[j] * ${pe("uniforms.strides",`j - ${r-y}u`,y)}
                    + offsets[j - ${r-y}u] - ${pe("uniforms.pads","j - 2u",x)};
                  ${w}
              }
              ${a}

              output[global_idx] = value;
            }`}},xa=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,Qp=e=>`${xa(e)};${e.countIncludePad}`,Xp=e=>`${xa(e)};${e.storageOrder};${e.dilations}`,Sa=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),ka=(e,t,r,n)=>{let[s,i]=wa(t,n,r),a=U("x",t.dataType,t.dims.length),o=a.type.value,u="value += x_val;",l="";s.countIncludePad?l+=`value /= ${o}(uniforms.kernelSize);`:l+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[c,p,h,m,g]=$a(i,s);c.push(...he(t.dims,i));let y=["rank"];return{name:e,shaderCache:{hint:`${n.cacheKey};${h};${m};${g}`,inputDependencies:y},getRunData:()=>({outputs:[{dims:i,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(B.size(i)/64)},programUniforms:c}),getShaderSource:x=>va(x,a,t.dims.length,i.length,s,u,l,0,p,h,m,g)}},ly=e=>{let t=e.count_include_pad!==0,r=Sa(e);if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let n={countIncludePad:t,...r,cacheKey:""};return{...n,cacheKey:Qp(n)}},dy=(e,t)=>{Tn(e.inputs),e.compute(ka("AveragePool",e.inputs[0],!1,t))},Ta={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},cy=e=>{let t=e.format;return{format:t,...Ta,cacheKey:t}},py=(e,t)=>{Tn(e.inputs),e.compute(ka("GlobalAveragePool",e.inputs[0],!0,t))},Ea=(e,t,r,n)=>{let[s,i]=wa(t,n,r),a=`
      value = max(x_val, value);
    `,o="",u=U("x",t.dataType,t.dims.length),l=["rank"],[c,p,h,m,g]=$a(i,s);return c.push(...he(t.dims,i)),{name:e,shaderCache:{hint:`${n.cacheKey};${h};${m};${g}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:i,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(B.size(i)/64)},programUniforms:c}),getShaderSource:y=>va(y,u,t.dims.length,i.length,s,a,o,t.dataType===10?-65504:-1e5,p,h,m,g)}},fy=(e,t)=>{Tn(e.inputs),e.compute(Ea("MaxPool",e.inputs[0],!1,t))},hy=e=>{let t=e.storage_order,r=e.dilations,n=Sa(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(n.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let s={storageOrder:t,dilations:r,...n,cacheKey:""};return{...s,cacheKey:Xp(s)}},my=e=>{let t=e.format;return{format:t,...Ta,cacheKey:t}},gy=(e,t)=>{Tn(e.inputs),e.compute(Ea("GlobalMaxPool",e.inputs[0],!0,t))}}),Yp,Jp,_y,yy,V1=j(()=>{we(),xe(),Ke(),ke(),Yp=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((r,n)=>r===e[2].dims[n]).reduce((r,n)=>r&&n,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((s,i)=>i===t.axis||s===e[0].dims[i]).reduce((s,i)=>s&&i,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let r=e[0].dims[t.axis],n=e[1].dims[t.axis];if(t.blockSize<Math.ceil(r/n)||t.blockSize>Math.ceil(r/(n-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Jp=(e,t)=>{let r=B.normalizeAxis(t.axis,e[0].dims.length),n=e[0].dataType,s=n===3,i=e[0].dims,a=e[1].dataType,o=B.size(i),u=n===3||n===2,l=u?[Math.ceil(B.size(e[0].dims)/4)]:e[0].dims,c=e[1].dims,p=e.length>2?e[2]:void 0,h=p?u?[Math.ceil(B.size(p.dims)/4)]:p.dims:void 0,m=c.length===0||c.length===1&&c[0]===1,g=m===!1&&c.length===1,y=Ge(o),x=m&&(!u||y===4),w=x?y:1,b=x&&!u?y:1,k=U("input",u?12:n,l.length,b),S=U("scale",a,c.length),I=p?U("zero_point",u?12:n,h.length):void 0,z=ce("output",a,i.length,w),O=[k,S];I&&O.push(I);let R=[l,c];p&&R.push(h);let N=[{type:12,data:o/w},{type:12,data:r},{type:12,data:t.blockSize},...he(...R,i)],G=ue=>{let ne=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
      ${ue.registerUniforms(ne).declareVariables(...O,z)}
      ${ue.mainStart()}
          ${ue.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
          let output_indices = ${z.offsetToIndices("global_idx")};

          // Set input x
          ${u?`
            let input = ${k.getByOffset("global_idx / 4")};
            let x_vec = ${s?"unpack4xI8(input)":"unpack4xU8(input)"};
            let x_value = ${w===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${k.getByOffset("global_idx")};`};

          // Set scale input
          ${m?`let scale_value= ${S.getByOffset("0")}`:g?`
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
                let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${I.getByOffset("0")}`:g?u?`
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
      }`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:I?["rank","rank","rank"]:["rank","rank"]},getShaderSource:G,getRunData:()=>({outputs:[{dims:i,dataType:a}],dispatchGroup:{x:Math.ceil(o/w/64),y:1,z:1},programUniforms:N})}},_y=(e,t)=>{Yp(e.inputs,t),e.compute(Jp(e.inputs,t))},yy=e=>Ne({axis:e.axis,blockSize:e.blockSize})}),ef,tf,by,H1=j(()=>{Wt(),we(),ke(),ef=(e,t,r)=>{let n=e===t,s=e<t&&r<0,i=e>t&&r>0;if(n||s||i)throw new Error("Range these inputs' contents are invalid.")},tf=(e,t,r,n)=>{let s=Math.abs(Math.ceil((t-e)/r)),i=[s],a=s,o=[{type:12,data:a},{type:n,data:e},{type:n,data:r},...he(i)],u=l=>{let c=ce("output",n,i.length),p=c.type.value,h=[{name:"outputSize",type:"u32"},{name:"start",type:p},{name:"delta",type:p}];return`
        ${l.registerUniforms(h).declareVariables(c)}
        ${l.mainStart()}
        ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
        output[global_idx] = uniforms.start + ${p}(global_idx) * uniforms.delta;
      }`};return{name:"Range",shaderCache:{hint:`${n}`},getShaderSource:u,getRunData:()=>({outputs:[{dims:i,dataType:n}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:o})}},by=e=>{let t=0,r=0,n=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],r=e.inputs[1].getInt32Array()[0],n=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],r=e.inputs[1].getFloat32Array()[0],n=e.inputs[2].getFloat32Array()[0]),Le.webgpu.validateInputContent&&ef(t,r,n),e.compute(tf(t,r,n,e.inputs[0].dataType),{inputs:[]})}}),rf,Ia,Ca,nf,wy,$y,F1=j(()=>{we(),xe(),Ke(),ke(),rf=(e,t,r,n)=>{if(e!=="none"&&n!=="i32"&&n!=="u32"&&n!=="f32")throw new Error(`Input ${n} is not supported with reduction ${e}.`);let s=`{
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
                ${s}max(bitcast<f32>(oldValue), (${r}))${i}`;case"min":return n==="i32"||n==="u32"?`atomicMin(&${t}, bitcast<${n}>(${r}));`:`${s}min(bitcast<${n}>(oldValue), (${r}))${i}`;case"mul":return`${s}(bitcast<${n}>(oldValue) * (${r}))${i}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Ia=(e,t)=>`${e===1?`
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
    data_offset += u32((u32(index) * element_count_dim));`,Ca=(e,t,r)=>`for (var i = 0u; i < uniforms.num_updates_elements; i++) {
        let value = updates[uniforms.num_updates_elements * ${r?"global_idx":"idx"} + i];
        ${rf(e.reduction,"output[data_offset + i]","value",t)}
      }`,nf=(e,t)=>{let r=e[0].dims,n=e[1].dims,s=r,i=1,a=Math.ceil(B.size(n)/i),o=n[n.length-1],u=B.sizeFromDimension(r,o),l=B.sizeFromDimension(n,0)/o,c=[{type:12,data:a},{type:12,data:o},{type:12,data:u},...he(e[1].dims,e[2].dims,s)],p=h=>{let m=U("indices",e[1].dataType,e[1].dims.length),g=U("updates",e[2].dataType,e[2].dims.length,i),y=t.reduction!=="none"&&t.reduction!==""?Zm("output",e[0].dataType,s.length):ce("output",e[0].dataType,s.length,i);return`
      ${h.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(m,g,y)}
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
        ${Ia(r.length,!1)}
      }
      ${Ca(t,y.type.value,!1)}
    }
    return;
  }

  var data_offset = 0u;
  var indices_start = uniforms.last_index_dimension * global_idx;
  var indices_end = indices_start + uniforms.last_index_dimension;
  for (var i = indices_start; i < indices_end; i++) {
    var index = i32(indices[i].x);
    ${Ia(r.length,!0)}
  }
  ${Ca(t,y.type.value,!0)}
  }`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:c}),getShaderSource:p}},wy=e=>Ne({reduction:e.reduction}),$y=(e,t)=>{e.compute(nf(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),sf,af,of,za,uf,lf,df,cf,pf,ff,hf,mf,Oa,gf,_f,yf,bf,wf,vy,xy,G1=j(()=>{we(),xe(),Ke(),ke(),sf=(e,t)=>{if(e.every(r=>r>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
            one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},af=(e,t,r)=>{t.every(s=>s>=0&&s<r||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let n=new Array(r).fill(1);return t.forEach((s,i)=>n[s]=e[i]),n},of=(e,t,r,n,s,i)=>{let[a,o,u]=r>10?[1,2,3]:[-1,e.length>1?1:-1,-1],l=e[0].dims.length;if(a>0&&e.length>a&&e[a].dims.length>0)e[a].getFloat32Array().forEach(c=>i.push(c));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(c=>n.push(c)),n.length!==0&&n.length!==l&&r>=18&&n.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");sf(n,t),t.axes.length>0&&af(n,t.axes,l).forEach((c,p)=>n[p]=c)}if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(c=>s.push(Number(c))),s.length!==0&&s.length!==l&&r>=18&&s.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(n.length!==0&&n.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(s.length!==0&&s.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof n<"u"&&typeof s<"u"&&n.length>0&&s.length>l)throw new Error("Resize requires only of scales or sizes to be specified")},za=(e,t,r,n)=>`
  // The whole part and the fractional part are calculated separately due to inaccuracy of floating
  // point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
  // offset-by-one error later in floor().
  let big = (${e}) * (${t});
  let whole = ${n}(big / (${r}));
  let fract = ${n}(big % (${r})) / ${n}(${r});
  return whole + fract;
`,uf=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
     lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
          if (xScale < 1.0 || floor(xScale) != xScale) {
            return ${t}(xResized) / ${t}(xScale);
          } else {
            ${za("xResized","lengthOriginal","lengthResized",t)}
          }
        `;case"pytorch_half_pixel":return`if (lengthResized > 1) {
                    return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
                  } else {
                    return 0.0;
                  }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
                    return 0.0;
                  } else {
                    ${za("xResized","lengthOriginal - 1","lengthResized - 1",t)}
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
                  return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",lf=(e,t,r)=>`fn getNearestPixelFromOriginal(xOriginal: ${r}, isDownSample: bool) -> ${r} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",df=(e,t,r)=>{let n=new Array(r).fill(0).concat(new Array(r).fill(1)),s=e.length===0?n:e.slice();return t.length>0?(t.forEach((i,a)=>{n[i]=s[a],n[a+r]=s[t.length+a]}),n):s},cf=(e,t,r,n)=>{let s=[];if(r.length>0)if(n.length>0){if(e.forEach(i=>s.push(i)),Math.max(...n)>e.length)throw new Error("axes is out of bound");n.forEach((i,a)=>s[i]=r[a])}else r.forEach(i=>s.push(i));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");s=e.map((i,a)=>Math.round(i*t[a]))}return s},pf=(e,t,r)=>{let n=(()=>{switch(r.keepAspectRatioPolicy){case"not_larger":return r.axes.length>0?Math.min(...r.axes.map(i=>t[i]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return r.axes.length>0?Math.max(...r.axes.map(i=>t[i]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${r.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let s=e.slice();return r.axes.length>0?(r.axes.forEach(i=>t[i]=n),r.axes.forEach(i=>s[i]=Math.round(e[i]*t[i]))):(t.fill(n,0,t.length),s.forEach((i,a)=>s[a]=Math.round(i*t[a]))),s},ff=(e,t,r,n,s)=>`
    fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${r.length}> {
      var original_indices: array<${e.type.value}, ${r.length}>;
      for (var i:u32 = 0; i < ${r.length}; i++) {
        var output_index = ${e.indicesGet("output_indices","i")};
        var scale = ${pe("uniforms.scales","i",n)};
        var roi_low = ${pe("uniforms.roi","i",s)};
        var roi_hi = ${pe("uniforms.roi",`i + ${t.length}`,s)};
        if (scale == 1.0) {
          original_indices[i] = ${e.type.value}(output_index);
        } else {
          var input_shape_i = ${pe("uniforms.input_shape","i",t.length)};
          var output_shape_i = ${pe("uniforms.output_shape","i",r.length)};
          original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                           input_shape_i, roi_low, roi_hi);
        }
      }
      return original_indices;
    }`,hf=(e,t,r,n,s,i,a)=>`
    fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
      var input_indices: ${e.type.indices};
      for (var i:u32 = 0; i < ${n.length}; i++) {
        var output_index = ${t.indicesGet("output_indices","i")};
        var input_index: u32;
        var scale = ${pe("uniforms.scales","i",s)};
        if (scale == 1.0) {
          input_index = output_index;
        } else {
          var roi_low = ${pe("uniforms.roi","i",i)};
          var roi_hi = ${pe("uniforms.roi",`i + ${r.length}`,i)};
          var input_shape_i = ${pe("uniforms.input_shape","i",r.length)};
          var output_shape_i = ${pe("uniforms.output_shape","i",n.length)};
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
    }`,mf=(e,t)=>`
    fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
      for (var i:u32 = 0; i < ${t.length}; i++) {
        var input_index = ${e.indicesGet("input_indices","i")};
        if (input_index < 0 || input_index >= ${pe("uniforms.input_shape","i",t.length)}) {
          return false;
        }
      }
      return true;
    }`,Oa=(e,t,r,n)=>e.rank>n?`
    ${e.indicesSet("input_indices",t,"channel")};
    ${e.indicesSet("input_indices",r,"batch")};
`:"",gf=(e,t,r,n,s)=>{let[i,a,o,u]=r.length===2?[-1,0,1,-1]:[0,2,3,1],l=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${l} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",a,`max(0, min(row, ${r[a]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(col, ${r[o]} - 1))`)};
      ${Oa(e,u,i,2)}
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
    }`},_f=(e,t,r,n,s,i,a,o,u,l)=>{let c=r.length===2,[p,h]=c?[0,1]:[2,3],m=e.type.value,g=y=>{let x=y===p?"row":"col";return`
      fn ${x}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${m} {
        var output_index = ${t.indicesGet("output_indices",y)};
        var originalIdx: ${m} = getOriginalCoordinateFromResizedCoordinate(output_index, ${s[y]},
        ${n[y]}, ${r[y]}, ${i[y]}, ${i[y]} + ${r.length});
        var fractOriginalIdx: ${m} = originalIdx - floor(originalIdx);
        var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

        if (${o} && (originalIdx < 0 || originalIdx > (${r[y]} - 1))) {
          return ${u};
        }
        var data: array<${m}, 4> = array<${m}, 4>(0.0, 0.0, 0.0, 0.0);
        for (var i: i32 = -1; i < 3; i++) {
          var ${x}: ${m} = originalIdx + ${m}(i);
          if (${x} < 0 || ${x} >= ${r[y]}) {
            ${l?`coefs[i + 1] = 0.0;
                        continue;`:o?`return ${u};`:`${x} = max(0, min(${x}, ${r[y]} - 1));`};
          }
        var input_indices_copy: ${e.type.indices} = input_indices;
          ${e.indicesSet("input_indices_copy",y,`u32(${x})`)};
          data[i + 1] = ${y===p?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
        }
        return cubicInterpolation1D(data, coefs);
      }`};return`
    ${g(p)};
    ${g(h)};
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
    `},yf=(e,t,r,n,s)=>{let[i,a,o,u,l]=r.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],c=e.type.value;return`
    fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${c} {
      var input_indices: ${e.type.indices};
      ${e.indicesSet("input_indices",a,`max(0, min(depth, ${r[a]} - 1))`)};
      ${e.indicesSet("input_indices",o,`max(0, min(height, ${r[o]} - 1))`)};
      ${e.indicesSet("input_indices",u,`max(0, min(width, ${r[u]} - 1))`)};
      ${Oa(e,l,i,3)}
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
    }`},bf=(e,t,r,n,s,i)=>{let a=e.dims,o=df(i,t.axes,a.length),u=cf(a,n,s,t.axes),l=n.slice();n.length===0&&(l=a.map((b,k)=>b===0?1:u[k]/b),t.keepAspectRatioPolicy!=="stretch"&&(u=pf(a,l,t)));let c=ce("output",e.dataType,u.length),p=U("input",e.dataType,a.length),h=B.size(u),m=a.length===u.length&&a.every((b,k)=>b===u[k]),g=t.coordinateTransformMode==="tf_crop_and_resize",y=t.extrapolationValue,x=p.type.value,w=b=>`
      ${m?"":`
      ${uf(t.coordinateTransformMode,x)};
      ${(()=>{switch(t.mode){case"nearest":return`
              ${mf(p,a)};
              ${lf(t.nearestMode,r,x)};
              ${hf(p,c,a,u,l.length,o.length,g)};
              `;case"linear":return`
              ${ff(c,a,u,l.length,o.length)};
              ${(()=>{if(a.length===2||a.length===4)return`${gf(p,c,a,g,y)}`;if(a.length===3||a.length===5)return`${yf(p,c,a,g,y)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
            `;case"cubic":return`
            ${(()=>{if(a.length===2||a.length===4)return`${_f(p,c,a,u,l,o,t.cubicCoeffA,g,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
            `;default:throw Error("Invalid resize mode")}})()};
      `}
      ${b.registerUniform("output_size","u32").registerUniform("scales","f32",l.length).registerUniform("roi","f32",o.length).declareVariables(p,c)}
      ${b.mainStart()}
        ${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
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
      }`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${r}|${l.length>0?t.mode==="cubic"?l:l.length:""}|${s.length>0?s:""}|${o.length>0?o:""}|${m}|${t.mode==="nearest"?a.length:a}`,inputDependencies:["rank"]},getShaderSource:w,getRunData:()=>({outputs:[{dims:u,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(h/64)},programUniforms:[{type:12,data:h},{type:1,data:l},{type:1,data:o},...he(a,u)]})}},wf=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},vy=(e,t)=>{let r=[],n=[],s=[],i=wf(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");of(e.inputs,t,i,r,n,s),e.compute(bf(e.inputs[0],t,i,r,n,s),{inputs:[0]})},xy=e=>{let t=e.antialias,r=e.axes,n=e.coordinateTransformMode,s=e.cubicCoeffA,i=e.excludeOutside!==0,a=e.extrapolationValue,o=e.keepAspectRatioPolicy,u=e.mode,l=e.nearestMode===""?"simple":e.nearestMode;return Ne({antialias:t,axes:r,coordinateTransformMode:n,cubicCoeffA:s,excludeOutside:i,extrapolationValue:a,keepAspectRatioPolicy:o,mode:u,nearestMode:l})}}),$f,vf,Sy,j1=j(()=>{we(),xe(),ke(),$f=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],r=e[1],n=e[2];if(t.dataType!==r.dataType||t.dataType!==n.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(r.dims.length!==3&&r.dims.length!==2)throw new Error("Skip must be 2D or 3D");let s=t.dims[t.dims.length-1],i=t.dims[t.dims.length-2];if(r.dims[r.dims.length-1]!==s)throw new Error("Skip must have the same hidden size as input");if(r.dims[r.dims.length-2]!==i)throw new Error("Skip must have the same sequence length as input");if(n.dims.length!==1)throw new Error("Gamma must be 1D");if(n.dims[n.dims.length-1]!==s)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let a=e[3];if(a.dims.length!==1)throw new Error("Beta must be 1D");if(a.dims[a.dims.length-1]!==s)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let a=e[4];if(a.dims.length!==1)throw new Error("Bias must be 1D");if(a.dims[a.dims.length-1]!==s)throw new Error("Bias must have the same hidden size as input")}},vf=(e,t,r,n)=>{let s=t.simplified,i=e[0].dims,a=B.size(i),o=i,u=a,l=i.slice(-1)[0],c=n?i.slice(0,-1).concat(1):[],p=!s&&e.length>3,h=e.length>4,m=n&&r>1,g=n&&r>2,y=r>3,x=64,w=Ge(l),b=[{type:12,data:u},{type:12,data:w},{type:12,data:l},{type:1,data:t.epsilon}],k=I=>{let z=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],O=[U("x",e[0].dataType,e[0].dims,w),U("skip",e[1].dataType,e[1].dims,w),U("gamma",e[2].dataType,e[2].dims,w)];p&&O.push(U("beta",e[3].dataType,e[3].dims,w)),h&&O.push(U("bias",e[4].dataType,e[4].dims,w)),O.push(ce("output",e[0].dataType,o,w)),m&&O.push(ce("mean_output",1,c)),g&&O.push(ce("inv_std_output",1,c)),y&&O.push(ce("input_skip_bias_sum",e[0].dataType,o,w));let R=Je(e[0].dataType),N=Je(1,w);return`

      ${I.registerUniforms(z).declareVariables(...O)}
      var<workgroup> sum_shared : array<${N}, ${x}>;
      var<workgroup> sum_squared_shared : array<${N}, ${x}>;

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
          ${y?"input_skip_bias_sum[offset + i] = value;":""}
          output[offset + i] = value;
          let f32_value = ${en(R,w,"value")};
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
        let mean = ${xr("sum",w)} / f32(uniforms.hidden_size);
        let inv_std_dev = inverseSqrt(${xr("square_sum",w)} / f32(uniforms.hidden_size) ${s?"":"- mean * mean"} + uniforms.epsilon);
        ${m?"mean_output[global_idx] = mean;":""}
        ${g?"inv_std_output[global_idx] = inv_std_dev;":""}

        for (var i: u32 = 0; i < stride; i++) {
          output[offset + i] = (output[offset + i] ${s?"":`- ${R}(mean)`}) *
            ${R}(inv_std_dev) * gamma[offset1d + i]
            ${p?"+ beta[offset1d + i]":""};
        }
      }`},S=[{dims:o,dataType:e[0].dataType}];return r>1&&S.push({dims:c,dataType:1}),r>2&&S.push({dims:c,dataType:1}),r>3&&S.push({dims:i,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${w};${m};${g};${y}`,inputDependencies:e.map((I,z)=>"type")},getShaderSource:k,getRunData:()=>({outputs:S,dispatchGroup:{x:Math.ceil(u/l)},programUniforms:b})}},Sy=(e,t)=>{$f(e.inputs);let r=[0];e.outputCount>1&&r.push(-3),e.outputCount>2&&r.push(-3),e.outputCount>3&&r.push(3),e.compute(vf(e.inputs,t,e.outputCount,!1),{outputs:r})}}),xf,En,Sf,Aa,kf,Tf,ky,Ty,K1=j(()=>{we(),xe(),Ke(),ke(),xf=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((r,n)=>{if(e[n+1].dataType!==6&&e[n+1].dataType!==7)throw new Error(`Input ${n} must be an array of int32 or int64`)})},En=(e,t)=>{let r=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(n=>r.push(Number(n)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(n=>r.push(Number(n)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return r},Sf=(e,t)=>{if(e.length>1){let r=En(e,1),n=En(e,2),s=En(e,3);return s.length===0&&(s=[...Array(e[0].dims.length).keys()]),Ne({starts:r,ends:n,axes:s})}else return t},Aa=(e,t,r,n,s)=>{let i=e;return e<0&&(i+=r[n[t]]),s[t]<0?Math.max(0,Math.min(i,r[n[t]]-1)):Math.max(0,Math.min(i,r[n[t]]))},kf=(e,t,r)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
          var input_indices: ${e.type.indices};
          var carry = 0u;
          for (var i = ${r.length}; i >= 0; i--) {
            let input_shape_i = ${pe("uniforms.input_shape","i",r.length)};
            let steps_i = ${pe("uniforms.steps","i",r.length)};
            let signs_i = ${pe("uniforms.signs","i",r.length)};
            let starts_i = ${pe("uniforms.starts","i",r.length)};
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
      }`,Tf=(e,t)=>{let r=e[0].dims,n=B.size(r),s=t.axes.length>0?B.normalizeAxes(t.axes,r.length):[...Array(r.length).keys()],i=En(e,4);i.forEach(w=>w!==0||(()=>{throw new Error("step cannot be 0")})),i.length===0&&(i=Array(s.length).fill(1));let a=t.starts.map((w,b)=>Aa(w,b,r,s,i)),o=t.ends.map((w,b)=>Aa(w,b,r,s,i));if(s.length!==a.length||s.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(s.length!==r.length)for(let w=0;w<r.length;++w)s.includes(w)||(a.splice(w,0,0),o.splice(w,0,r[w]),i.splice(w,0,1));let u=i.map(w=>Math.sign(w));i.forEach((w,b,k)=>{if(w<0){let S=(o[b]-a[b])/w,I=a[b],z=I+S*i[b];a[b]=z,o[b]=I,k[b]=-w}});let l=r.slice(0);s.forEach((w,b)=>{l[w]=Math.ceil((o[w]-a[w])/i[w])});let c={dims:l,dataType:e[0].dataType},p=ce("output",e[0].dataType,l.length),h=U("input",e[0].dataType,e[0].dims.length),m=B.size(l),g=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:a.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:i.length}],y=[{type:12,data:m},{type:12,data:a},{type:6,data:u},{type:12,data:i},...he(e[0].dims,l)],x=w=>`
      ${w.registerUniforms(g).declareVariables(h,p)}
        ${kf(h,p,r)}
        ${w.mainStart()}
          ${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
          let output_indices = ${p.offsetToIndices("global_idx")};
          let input_indices = calculateInputIndices(output_indices);
          ${p.setByOffset("global_idx",h.getByIndices("input_indices"))}
      }`;return{name:"Slice",shaderCache:{hint:`${u.length}_${a.length}_${i.length}`,inputDependencies:["rank"]},getShaderSource:x,getRunData:()=>({outputs:[c],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:y})}},ky=(e,t)=>{xf(e.inputs,t);let r=Sf(e.inputs,t);e.compute(Tf(e.inputs,r),{inputs:[0]})},Ty=e=>{let t=e.starts,r=e.ends,n=e.axes;return Ne({starts:t,ends:r,axes:n})}}),Ef,If,Ey,Iy,Z1=j(()=>{we(),xe(),Ke(),Er(),ke(),Ef=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},If=(e,t)=>{let r=e.inputs[0],n=r.dims,s=B.size(n),i=n.length,a=B.normalizeAxis(t.axis,i),o=a<n.length-1,u,l=[];o?(l=Array.from({length:i},(O,R)=>R),l[a]=i-1,l[i-1]=a,u=e.compute(xt(r,l),{inputs:[r],outputs:[-1]})[0]):u=r;let c=u.dims,p=c[i-1],h=s/p,m=Ge(p),g=p/m,y=64;h===1&&(y=256);let x=(O,R)=>R===4?`max(max(${O}.x, ${O}.y), max(${O}.z, ${O}.w))`:R===2?`max(${O}.x, ${O}.y)`:R===3?`max(max(${O}.x, ${O}.y), ${O}.z)`:O,w=U("x",u.dataType,u.dims,m),b=ce("result",u.dataType,u.dims,m),k=w.type.value,S=Je(u.dataType)==="f32"?`var threadMax = ${k}(-3.402823e+38f);`:`var threadMax = ${k}(-65504.0h);`,I=O=>`
      var<workgroup> rowMaxShared : ${k};
      var<workgroup> rowSumShared : ${k};
      var<workgroup> threadShared : array<${k}, ${y}>;

      fn getValue(row: i32, col: i32, row_stride: i32) -> ${k} {
        let index = row * row_stride + col;
        return x[index];
      }

      fn setValue(row: i32, col: i32, row_stride: i32, value: ${k}) {
        let index = row * row_stride + col;
        result[index] = value;
      }
      ${O.registerUniform("packedCols","i32").declareVariables(w,b)}
      ${O.mainStart(y)}
        let gindex = i32(global_idx);
        let lindex = i32(local_idx);
        const wg = ${y};
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
          rowSumShared = ${k}(${xr("threadShared[0]",m)});
        }
        workgroupBarrier();

        // calculate final value for each element in the row
        for (var col = lindex; col < cols; col += wg) {
          let value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
          setValue(row, col, row_stride, value);
        }
      }`,z=e.compute({name:"Softmax",shaderCache:{hint:`${m};${y}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:c,dataType:u.dataType}],dispatchGroup:{x:h},programUniforms:[{type:6,data:g}]}),getShaderSource:I},{inputs:[u],outputs:[o?-1:0]})[0];o&&e.compute(xt(z,l),{inputs:[z]})},Ey=(e,t)=>{Ef(e.inputs),If(e,t)},Iy=e=>Ne({axis:e.axis})}),Ra,Cf,zf,Of,Cy,Q1=j(()=>{we(),xe(),ke(),Ra=e=>Array.from(e.getBigInt64Array(),Number),Cf=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Ra(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},zf=(e,t)=>{let r=[];for(let n=0;n<e.length;++n)r.push(e[n]*t[n]);return r},Of=(e,t)=>{let r=e[0].dims,n=t??Ra(e[1]),s=zf(r,n),i=B.size(s),a=e[0].dataType,o=U("input",a,r.length),u=ce("output",a,s.length),l=c=>`
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
    }`;return{name:"Tile",shaderCache:{hint:`${n}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(i/64)},programUniforms:[{type:12,data:i},...he(e[0].dims,s)]}),getShaderSource:l}},Cy=e=>{Cf(e.inputs),e.compute(Of(e.inputs),{inputs:[0]})}}),Af,Rf,zy,X1=j(()=>{we(),xe(),ke(),Af=(e,t,r,n,s)=>{let i=ce("output_data",s,r.length,4),a=U("a_data",t[1].dataType,t[1].dims.length,4),o=U("b_data",t[2].dataType,t[2].dims.length,4),u=U("c_data",t[0].dataType,t[0].dims.length,4),l,c=(p,h,m)=>`select(${h}, ${p}, ${m})`;if(!n)l=i.setByOffset("global_idx",c(a.getByOffset("global_idx"),o.getByOffset("global_idx"),u.getByOffset("global_idx")));else{let p=(h,m,g="")=>{let y=`a_data[index_a${m}][component_a${m}]`,x=`b_data[index_b${m}][component_b${m}]`,w=`bool(c_data[index_c${m}] & (0xffu << (component_c${m} * 8)))`;return`
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
            ${h}[${m}] = ${g}(${c(y,x,w)});
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
      }`},Rf=e=>{let t=e[1].dims,r=e[2].dims,n=e[0].dims,s=e[1].dataType,i=!(B.areEqual(t,r)&&B.areEqual(r,n)),a=t,o=B.size(t);if(i){let l=ln.calcShape(ln.calcShape(t,r,!1),n,!1);if(!l)throw new Error("Can't perform where op on the given tensors");a=l,o=B.size(a)}let u=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:l=>Af(l,e,a,i,s),getRunData:()=>({outputs:[{dims:a,dataType:s}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:u},...he(n,t,r,a)]})}},zy=e=>{e.compute(Rf(e.inputs))}}),Oy,Y1=j(()=>{p1(),Yo(),f1(),h1(),m1(),g1(),_1(),v1(),S1(),k1(),T1(),E1(),I1(),C1(),z1(),O1(),A1(),R1(),B1(),M1(),N1(),P1(),D1(),U1(),W1(),Q_(),q1(),L1(),V1(),H1(),F1(),Xo(),G1(),ty(),j1(),K1(),Z1(),J_(),Q1(),Er(),Jo(),X1(),Oy=new Map([["Abs",[Sg]],["Acos",[kg]],["Acosh",[Tg]],["Add",[a_]],["ArgMax",[wg,io]],["ArgMin",[bg,io]],["Asin",[Eg]],["Asinh",[Ig]],["Atan",[Cg]],["Atanh",[zg]],["Attention",[$g]],["AveragePool",[dy,ly]],["BatchNormalization",[vg]],["BiasAdd",[xg]],["BiasSplitGelu",[s_]],["Cast",[Ag,Og]],["Ceil",[Bg]],["Clip",[Rg]],["Concat",[g_,__]],["Conv",[co,lo]],["ConvTranspose",[E_,T_]],["Cos",[Mg]],["Cosh",[Ng]],["CumSum",[I_,C_]],["DepthToSpace",[z_,O_]],["DequantizeLinear",[_y,yy]],["Div",[o_]],["Einsum",[A_,R_]],["Elu",[Pg,Rn]],["Equal",[u_]],["Erf",[Dg]],["Exp",[Ug]],["Expand",[B_]],["FastGelu",[M_]],["Floor",[Wg]],["FusedConv",[co,lo]],["Gather",[P_,N_]],["GatherElements",[V_,L_]],["GatherBlockQuantized",[W_,q_]],["GatherND",[D_,U_]],["Gelu",[qg]],["Gemm",[F_,H_]],["GlobalAveragePool",[py,cy]],["GlobalMaxPool",[gy,my]],["Greater",[p_]],["GreaterOrEqual",[h_]],["GridSample",[G_,j_]],["GroupQueryAttention",[ry]],["HardSigmoid",[Zg,Kg]],["InstanceNormalization",[ny]],["LayerNormalization",[iy]],["LeakyRelu",[Lg,Rn]],["Less",[f_]],["LessOrEqual",[m_]],["Log",[n_]],["MatMul",[sy]],["MatMulNBits",[ay,oy]],["MaxPool",[fy,hy]],["Mul",[l_]],["MultiHeadAttention",[Z_,K_]],["Neg",[Hg]],["Not",[Vg]],["Pad",[uy]],["Pow",[d_]],["QuickGelu",[i_,Rn]],["Range",[by]],["Reciprocal",[Fg]],["ReduceMin",[hg]],["ReduceMean",[lg]],["ReduceMax",[fg]],["ReduceSum",[gg]],["ReduceProd",[mg]],["ReduceL1",[dg]],["ReduceL2",[cg]],["ReduceLogSum",[yg]],["ReduceLogSumExp",[pg]],["ReduceSumSquare",[_g]],["Relu",[Gg]],["Resize",[vy,xy]],["RotaryEmbedding",[ey]],["ScatterND",[$y,wy]],["Sigmoid",[jg]],["Sin",[Qg]],["Sinh",[Xg]],["Slice",[ky,Ty]],["SkipLayerNormalization",[Sy]],["Split",[X_,Y_]],["Sqrt",[Yg]],["Softmax",[Ey,Iy]],["Sub",[c_]],["Tan",[Jg]],["Tanh",[e_]],["ThresholdedRelu",[r_,Rn]],["Tile",[Cy]],["Transpose",[Xm,Ym]],["Where",[zy]]])}),Ay,J1=j(()=>{Wt(),lr(),ke(),Ay=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,r,n,s){Xt(e.programInfo.name);let i=this.backend.device,a=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let l of t)o.push({binding:o.length,resource:{buffer:l.buffer}});for(let l of r)o.push({binding:o.length,resource:{buffer:l.buffer}});s&&o.push({binding:o.length,resource:s});let u=i.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let l={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:u,dispatchGroup:n};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(l)}a.setPipeline(e.computePipeline),a.setBindGroup(0,u),a.dispatchWorkgroups(...n),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),Dt(e.programInfo.name)}dispose(){}build(e,t){Xt(e.name);let r=this.backend.device,n=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(l=>{r.features.has(l.feature)&&n.push(`enable ${l.extension};`)});let s=Qm(t,this.backend.device.limits),i=e.getShaderSource(s),a=`${n.join(`
`)}
${s.additionalImplementations}
${i}`,o=r.createShaderModule({code:a,label:e.name});Oe("verbose",()=>`[WebGPU] ${e.name} shader code: ${a}`);let u=r.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return Dt(e.name),{programInfo:e,computePipeline:u,uniformVariablesInfo:s.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,r=typeof e=="number"?1:e.y||1,n=typeof e=="number"?1:e.z||1,s=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=s&&r<=s&&n<=s)return[t,r,n];let i=t*r*n,a=Math.ceil(Math.sqrt(i));if(a>s){if(a=Math.ceil(Math.cbrt(i)),a>s)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[a,a,a]}else return[a,a,1]}}}),Ry={};cn(Ry,{WebGpuBackend:()=>By});var Bf,Mf,Nf,By,e2=j(()=>{Wt(),we(),lr(),Fm(),d1(),Y1(),J1(),Bf=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let r=[];for(let n=0;n<e.length;++n){let s=e[n].dataType;switch(t[n]){case"none":{r.push("");break}case"type":{r.push(`${s}`);break}case"rank":{let i=e[n].dims.length;r.push(`${s};${i}`);break}case"dims":{let i=e[n].dims.join(",");r.push(`${s};${i}`);break}default:throw new Error(`unsupported input dependency: ${t[n]}`)}}return r.join("|")},Mf=(e,t,r)=>{var s,i;let n=e.name;return(s=e.shaderCache)!=null&&s.hint&&(n+="["+e.shaderCache.hint+"]"),n+=":"+r+`:${Bf(t,((i=e.shaderCache)==null?void 0:i.inputDependencies)??new Array(t.length).fill("dims"))}`,n},Nf=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},By=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let r=[],n={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:r},s=i=>t.features.has(i)&&r.push(i)&&!0;s("chromium-experimental-timestamp-query-inside-passes")||s("timestamp-query"),s("shader-f16"),s("subgroups"),this.device=await t.requestDevice(n),this.adapterInfo=new Nf(t.info||await t.requestAdapterInfo()),this.gpuDataManager=Km(this),this.programManager=new Ay(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,jo(e.logLevel,!!e.debug),this.device.onuncapturederror=i=>{i.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${i.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;Xt(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{var n;let t=new BigUint64Array(e.getMappedRange()),r=this.pendingQueries.get(e);for(let s=0;s<t.length/2;s++){let i=r[s],a=i.kernelId,o=this.kernels.get(a),u=o.kernelType,l=o.kernelName,c=i.programName,p=i.inputTensorViews,h=i.outputTensorViews,m=t[s*2],g=t[s*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=m);let y=Number(m-this.queryTimeBase),x=Number(g-this.queryTimeBase);if(!Number.isSafeInteger(y)||!Number.isSafeInteger(x))throw new RangeError("incorrect timestamp range");if((n=this.env.webgpu.profiling)!=null&&n.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:p.map(w=>({dims:w.dims,dataType:ar(w.dataType)})),outputsMetadata:h.map(w=>({dims:w.dims,dataType:ar(w.dataType)})),kernelId:a,kernelType:u,kernelName:l,programName:c,startTime:y,endTime:x});else{let w="";p.forEach((k,S)=>{w+=`input[${S}]: [${k.dims}] | ${ar(k.dataType)}, `});let b="";h.forEach((k,S)=>{b+=`output[${S}]: [${k.dims}] | ${ar(k.dataType)}, `}),console.log(`[profiling] kernel "${a}|${u}|${l}|${c}" ${w}${b}execution time: ${x-y} ns`)}Vi("GPU",`${c}::${m}::${g}`)}e.unmap(),this.pendingQueries.delete(e)}),Dt()}run(e,t,r,n,s,i){Xt(e.name);let a=[];for(let b=0;b<t.length;++b){let k=t[b].data;if(k===0)continue;let S=this.gpuDataManager.get(k);if(!S)throw new Error(`no GPU data for input: ${k}`);a.push(S)}let{outputs:o,dispatchGroup:u,programUniforms:l}=e.getRunData(t),c=r.length===0?o.map((b,k)=>k):r;if(c.length!==o.length)throw new Error(`Output size ${c.length} must be equal to ${o.length}.`);let p=[],h=[];for(let b=0;b<o.length;++b){if(!Number.isInteger(c[b])||c[b]<-3||c[b]>=i)throw new Error(`Invalid output index: ${c[b]}`);if(c[b]===-3)continue;let k=c[b]===-1,S=c[b]===-2,I=k||S?s(o[b].dataType,o[b].dims):n(c[b],o[b].dataType,o[b].dims);if(p.push(I),I.data===0)continue;let z=this.gpuDataManager.get(I.data);if(!z)throw new Error(`no GPU data for output: ${I.data}`);if(k&&this.temporaryData.push(z),S){let O=this.kernelPersistentData.get(this.currentKernelId);O||(O=[],this.kernelPersistentData.set(this.currentKernelId,O)),O.push(z)}h.push(z)}if(a.length!==t.length||h.length!==p.length){if(h.length===0)return Dt(e.name),p;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let m;if(l){let b=0,k=[];l.forEach(O=>{let R=typeof O.data=="number"?[O.data]:O.data;if(R.length===0)return;let N=O.type===10?2:4,G,ue;O.type===10?(ue=R.length>4?16:R.length>2?8:R.length*N,G=R.length>4?16:N*R.length):(ue=R.length<=2?R.length*N:16,G=16),b=Math.ceil(b/ue)*ue,k.push(b);let ne=O.type===10?8:4;b+=R.length>4?Math.ceil(R.length/ne)*G:R.length*N});let S=16;b=Math.ceil(b/S)*S;let I=new ArrayBuffer(b);l.forEach((O,R)=>{let N=k[R],G=typeof O.data=="number"?[O.data]:O.data;if(O.type===6)new Int32Array(I,N,G.length).set(G);else if(O.type===12)new Uint32Array(I,N,G.length).set(G);else if(O.type===10)new Uint16Array(I,N,G.length).set(G);else if(O.type===1)new Float32Array(I,N,G.length).set(G);else throw new Error(`Unsupported uniform type: ${ar(O.type)}`)});let z=this.gpuDataManager.create(b,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(z.buffer,0,I,0,b),this.gpuDataManager.release(z.id),m={offset:0,size:b,buffer:z.buffer}}let g=this.programManager.normalizeDispatchGroupSize(u),y=g[1]===1&&g[2]===1,x=Mf(e,t,y),w=this.programManager.getArtifact(x);if(w||(w=this.programManager.build(e,g),this.programManager.setArtifact(x,w),Oe("info",()=>`[artifact] key: ${x}, programName: ${e.name}`)),l&&w.uniformVariablesInfo){if(l.length!==w.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${w.uniformVariablesInfo.length}, got ${l.length} in program "${w.programInfo.name}".`);for(let b=0;b<l.length;b++){let k=l[b],S=k.type,I=typeof k.data=="number"?1:k.data.length,[z,O]=w.uniformVariablesInfo[b];if(S!==z||I!==O)throw new Error(`Uniform variable ${b} mismatch: expect type ${z} with size ${O}, got type ${S} with size ${I} in program "${w.programInfo.name}".`)}}if(Oe("info",()=>`[ProgramManager] run "${e.name}" (key=${x}) with ${g[0]}x${g[1]}x${g[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let b={kernelId:this.currentKernelId,programName:w.programInfo.name,inputTensorViews:t,outputTensorViews:p};this.pendingKernels.push(b),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(b)}return this.programManager.run(w,a,h,g,m),Dt(e.name),p}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,r,n){let s=Oy.get(e);if(!s)throw new Error(`kernel not implemented: ${e}`);let i={kernelType:e,kernelName:n,kernelEntry:s[0],attributes:[s[1],r]};this.kernels.set(t,i)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let r of t)this.gpuDataManager.release(r.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,r){let n=this.kernels.get(e);if(!n)throw new Error(`kernel not created: ${e}`);let s=n.kernelType,i=n.kernelName,a=n.kernelEntry,o=n.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${s}] ${i}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),Oe("info",()=>`[WebGPU] Start to run kernel "[${s}] ${i}"...`);let u=this.env.debug;this.temporaryData=[];try{return u&&this.device.pushErrorScope("validation"),a(t,o[1]),0}catch(l){return r.push(Promise.resolve(`[WebGPU] Kernel "[${s}] ${i}" failed. ${l}`)),1}finally{u&&r.push(this.device.popErrorScope().then(l=>l?`GPU validation error for kernel "[${s}] ${i}": ${l.message}`:null));for(let l of this.temporaryData)this.gpuDataManager.release(l.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,r,n){let s=this.sessionExternalDataMapping.get(e);s||(s=new Map,this.sessionExternalDataMapping.set(e,s));let i=s.get(t),a=this.gpuDataManager.registerExternalBuffer(r,n,i);return s.set(t,[a,r]),a}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(r=>this.gpuDataManager.unregisterExternalBuffer(r[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,r){return async()=>{let n=await to(this,e,t);return Ko(n.buffer,r)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){var e;this.queryType="none",(((e=this.env.webgpu.profiling)==null?void 0:e.mode)==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){Oe("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){Oe("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){Oe("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),r=e.length;this.pendingKernels=[];for(let n=0;n<r;n++){let s=this.getComputePassEncoder(),i=e[n];this.writeTimestamp(this.pendingDispatchNumber*2),s.setPipeline(i.computePipeline),s.setBindGroup(0,i.bindGroup),s.dispatchWorkgroups(...i.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[n]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),My={};cn(My,{init:()=>Ny});var Ei,Pf,Ny,t2=j(()=>{we(),lr(),xe(),l1(),Ei=class Py{constructor(t,r,n,s){this.module=t,this.dataType=r,this.data=n,this.dims=s}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=B.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=B.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=B.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=B.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(B.size(t)!==B.size(this.dims))throw new Error("Invalid new shape");return new Py(this.module,this.dataType,this.data,t)}},Pf=class{constructor(e,t,r){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let n=e.PTR_SIZE,s=r/e.PTR_SIZE,i=n===4?"i32":"i64";this.opKernelContext=Number(e.getValue(n*s++,i));let a=Number(e.getValue(n*s++,i));this.outputCount=Number(e.getValue(n*s++,i)),this.customDataOffset=Number(e.getValue(n*s++,"*")),this.customDataSize=Number(e.getValue(n*s++,i));let o=[];for(let u=0;u<a;u++){let l=Number(e.getValue(n*s++,i)),c=Number(e.getValue(n*s++,"*")),p=Number(e.getValue(n*s++,i)),h=[];for(let m=0;m<p;m++)h.push(Number(e.getValue(n*s++,i)));o.push(new Ei(e,l,c,h))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){var a;let r=((a=t==null?void 0:t.inputs)==null?void 0:a.map(o=>typeof o=="number"?this.inputs[o]:o))??this.inputs,n=(t==null?void 0:t.outputs)??[],s=(o,u,l)=>new Ei(this.module,u,this.output(o,l),l),i=(o,u)=>{let l=Pr(o,u);if(!l)throw new Error(`Unsupported data type: ${o}`);let c=l>0?this.backend.gpuDataManager.create(l).id:0;return new Ei(this.module,o,c,u)};return this.backend.run(e,r,n,s,i,this.outputCount)}output(e,t){let r=this.module.stackSave();try{let n=this.module.PTR_SIZE,s=n===4?"i32":"i64",i=this.module.stackAlloc((1+t.length)*n);this.module.setValue(i,t.length,s);for(let a=0;a<t.length;a++)this.module.setValue(i+n*(a+1),t[a],s);return this.module._JsepOutput(this.opKernelContext,e,i)}catch(n){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${n}`)}finally{this.module.stackRestore(r)}}},Ny=async(e,t,r,n)=>{let s=t.jsepInit;if(!s)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let i=(e2(),Jn(Ry)).WebGpuBackend,a=new i;await a.initialize(r,n),s("webgpu",[a,o=>a.alloc(Number(o)),o=>a.free(o),(o,u,l,c=!1)=>{if(c)Oe("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(u)}, size=${Number(l)}`),a.memcpy(Number(o),Number(u));else{Oe("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(u)}, size=${Number(l)}`);let p=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(l));a.upload(Number(u),p)}},async(o,u,l)=>{Oe("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${u}, size=${l}`),await a.download(Number(o),()=>t.HEAPU8.subarray(Number(u)>>>0,Number(u+l)>>>0))},(o,u,l)=>a.createKernel(o,Number(u),l,t.UTF8ToString(t._JsepGetNodeName(Number(u)))),o=>a.releaseKernel(o),(o,u,l,c)=>{Oe("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${l}, kernel=${o}, contextDataOffset=${u}`);let p=new Pf(t,a,Number(u));return a.computeKernel(Number(o),p,c)},()=>a.captureBegin(),()=>a.captureEnd(),()=>a.replay()])}else{let i=new jm(r);s("webnn",[i,()=>i.reserveTensorId(),a=>i.releaseTensorId(a),async(a,o,u,l,c)=>i.ensureTensor(a,o,u,l,c),(a,o)=>{i.uploadTensor(a,o)},async(a,o)=>i.downloadTensor(a,o)])}}}),Df,su,au,mr,Uf,Ba,Qi,ou,uu,Ma,lu,du,cu,Dy=j(()=>{a1(),o1(),we(),Fr(),Vo(),qm(),Df=(e,t)=>{Ve()._OrtInit(e,t)!==0&&Pe("Can't initialize onnxruntime.")},su=async e=>{Df(e.wasm.numThreads,Fi(e.logLevel))},au=async(e,t)=>{var r,n;(n=(r=Ve()).asyncInit)==null||n.call(r);{let s=(t2(),Jn(My)).init;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");let i=e.webgpu.adapter;if(i){if(typeof i.limits!="object"||typeof i.features!="object"||typeof i.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let a=e.webgpu.powerPreference;if(a!==void 0&&a!=="low-power"&&a!=="high-performance")throw new Error(`Invalid powerPreference setting: "${a}"`);let o=e.webgpu.forceFallbackAdapter;if(o!==void 0&&typeof o!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${o}"`);if(i=await navigator.gpu.requestAdapter({powerPreference:a,forceFallbackAdapter:o}),!i)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}await s("webgpu",Ve(),e,i)}if(t==="webnn"){if(typeof navigator>"u"||!navigator.ml)throw new Error("WebNN is not supported in current environment");await s("webnn",Ve(),e)}}},mr=new Map,Uf=e=>{let t=Ve(),r=t.stackSave();try{let n=t.PTR_SIZE,s=t.stackAlloc(2*n);t._OrtGetInputOutputCount(e,s,s+n)!==0&&Pe("Can't get session input/output count.");let i=n===4?"i32":"i64";return[Number(t.getValue(s,i)),Number(t.getValue(s+n,i))]}finally{t.stackRestore(r)}},Ba=(e,t)=>{let r=Ve(),n=r.stackSave(),s=0;try{let i=r.PTR_SIZE,a=r.stackAlloc(2*i);r._OrtGetInputOutputMetadata(e,t,a,a+i)!==0&&Pe("Can't get session input/output metadata.");let o=Number(r.getValue(a,"*"));s=Number(r.getValue(a+i,"*"));let u=r.HEAP32[s/4];if(u===0)return[o,0];let l=r.HEAPU32[s/4+1],c=[];for(let p=0;p<l;p++){let h=Number(r.getValue(s+8+p*i,"*"));c.push(h!==0?r.UTF8ToString(h):Number(r.getValue(s+8+(p+l)*i,"*")))}return[o,u,c]}finally{r.stackRestore(n),s!==0&&r._OrtFree(s)}},Qi=e=>{let t=Ve(),r=t._malloc(e.byteLength);if(r===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,r),[r,e.byteLength]},ou=async(e,t)=>{var p,h,m,g;let r,n,s=Ve();Array.isArray(e)?[r,n]=e:e.buffer===s.HEAPU8.buffer?[r,n]=[e.byteOffset,e.byteLength]:[r,n]=Qi(e);let i=0,a=0,o=0,u=[],l=[],c=[];try{if([a,u]=await Wm(t),(t==null?void 0:t.externalData)&&s.mountExternalData){let R=[];for(let N of t.externalData){let G=typeof N=="string"?N:N.path;R.push(Go(typeof N=="string"?N:N.data).then(ue=>{s.mountExternalData(G,ue)}))}await Promise.all(R)}for(let R of(t==null?void 0:t.executionProviders)??[])if((typeof R=="string"?R:R.name)==="webnn"){if(s.shouldTransferToMLTensor=!1,typeof R!="string"){let N=R,G=N==null?void 0:N.context,ue=N==null?void 0:N.gpuDevice,ne=N==null?void 0:N.deviceType,se=N==null?void 0:N.powerPreference;G?s.currentContext=G:ue?s.currentContext=await s.webnnCreateMLContext(ue):s.currentContext=await s.webnnCreateMLContext({deviceType:ne,powerPreference:se})}else s.currentContext=await s.webnnCreateMLContext();break}i=await s._OrtCreateSession(r,n,a),(p=s.webgpuOnCreateSession)==null||p.call(s,i),i===0&&Pe("Can't create a session."),(h=s.jsepOnCreateSession)==null||h.call(s),s.currentContext&&(s.webnnRegisterMLContext(i,s.currentContext),s.currentContext=void 0,s.shouldTransferToMLTensor=!0);let[y,x]=Uf(i),w=!!(t!=null&&t.enableGraphCapture),b=[],k=[],S=[],I=[],z=[];for(let R=0;R<y;R++){let[N,G,ue]=Ba(i,R);N===0&&Pe("Can't get an input name."),l.push(N);let ne=s.UTF8ToString(N);b.push(ne),S.push(G===0?{name:ne,isTensor:!1}:{name:ne,isTensor:!0,type:ar(G),shape:ue})}for(let R=0;R<x;R++){let[N,G,ue]=Ba(i,R+y);N===0&&Pe("Can't get an output name."),c.push(N);let ne=s.UTF8ToString(N);k.push(ne),I.push(G===0?{name:ne,isTensor:!1}:{name:ne,isTensor:!0,type:ar(G),shape:ue});{if(w&&(t==null?void 0:t.preferredOutputLocation)===void 0){z.push("gpu-buffer");continue}let se=typeof(t==null?void 0:t.preferredOutputLocation)=="string"?t.preferredOutputLocation:((m=t==null?void 0:t.preferredOutputLocation)==null?void 0:m[ne])??"cpu",Se=s.webnnIsGraphOutput;if(se==="cpu"&&Se&&Se(i,ne)){z.push("ml-tensor-cpu-output");continue}if(se!=="cpu"&&se!=="cpu-pinned"&&se!=="gpu-buffer"&&se!=="ml-tensor")throw new Error(`Not supported preferred output location: ${se}.`);if(w&&se!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${se}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);z.push(se)}}let O=null;return z.some(R=>R==="gpu-buffer"||R==="ml-tensor"||R==="ml-tensor-cpu-output")&&(o=s._OrtCreateBinding(i),o===0&&Pe("Can't create IO binding."),O={handle:o,outputPreferredLocations:z,outputPreferredLocationsEncoded:z.map(R=>R==="ml-tensor-cpu-output"?"ml-tensor":R).map(R=>Ja(R))}),mr.set(i,[i,l,c,O,w,!1]),[i,b,k,S,I]}catch(y){throw l.forEach(x=>s._OrtFree(x)),c.forEach(x=>s._OrtFree(x)),o!==0&&s._OrtReleaseBinding(o)!==0&&Pe("Can't release IO binding."),i!==0&&s._OrtReleaseSession(i)!==0&&Pe("Can't release session."),y}finally{s._free(r),a!==0&&s._OrtReleaseSessionOptions(a)!==0&&Pe("Can't release session options."),u.forEach(y=>s._free(y)),(g=s.unmountExternalData)==null||g.call(s)}},uu=e=>{var u,l,c;let t=Ve(),r=mr.get(e);if(!r)throw new Error(`cannot release session. invalid session id: ${e}`);let[n,s,i,a,o]=r;a&&(o&&t._OrtClearBoundOutputs(a.handle)!==0&&Pe("Can't clear bound outputs."),t._OrtReleaseBinding(a.handle)!==0&&Pe("Can't release IO binding.")),(u=t.jsepOnReleaseSession)==null||u.call(t,e),(l=t.webnnOnReleaseSession)==null||l.call(t,e),(c=t.webgpuOnReleaseSession)==null||c.call(t,e),s.forEach(p=>t._OrtFree(p)),i.forEach(p=>t._OrtFree(p)),t._OrtReleaseSession(n)!==0&&Pe("Can't release session."),mr.delete(e)},Ma=async(e,t,r,n,s,i,a=!1)=>{if(!e){t.push(0);return}let o=Ve(),u=o.PTR_SIZE,l=e[0],c=e[1],p=e[3],h=p,m,g;if(l==="string"&&(p==="gpu-buffer"||p==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(a&&p!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${i} when enableGraphCapture is true.`);if(p==="gpu-buffer"){let w=e[2].gpuBuffer;g=Pr(Nr(l),c);{let b=o.jsepRegisterBuffer;if(!b)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');m=b(n,i,w,g)}}else if(p==="ml-tensor"){let w=e[2].mlTensor;g=Pr(Nr(l),c);let b=o.webnnRegisterMLTensor;if(!b)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');m=b(n,w,Nr(l),c)}else{let w=e[2];if(Array.isArray(w)){g=u*w.length,m=o._malloc(g),r.push(m);for(let b=0;b<w.length;b++){if(typeof w[b]!="string")throw new TypeError(`tensor data at index ${b} is not a string`);o.setValue(m+b*u,Rt(w[b],r),"*")}}else{let b=o.webnnIsGraphInput,k=o.webnnIsGraphOutput;if(l!=="string"&&b&&k){let S=o.UTF8ToString(s);if(b(n,S)||k(n,S)){let I=Nr(l);g=Pr(I,c),h="ml-tensor";let z=o.webnnCreateTemporaryTensor,O=o.webnnUploadTensor;if(!z||!O)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let R=await z(n,I,c);O(R,new Uint8Array(w.buffer,w.byteOffset,w.byteLength)),m=R}else g=w.byteLength,m=o._malloc(g),r.push(m),o.HEAPU8.set(new Uint8Array(w.buffer,w.byteOffset,g),m)}else g=w.byteLength,m=o._malloc(g),r.push(m),o.HEAPU8.set(new Uint8Array(w.buffer,w.byteOffset,g),m)}}let y=o.stackSave(),x=o.stackAlloc(4*c.length);try{c.forEach((b,k)=>o.setValue(x+k*u,b,u===4?"i32":"i64"));let w=o._OrtCreateTensor(Nr(l),m,g,x,c.length,Ja(h));w===0&&Pe(`Can't create tensor for input/output. session=${n}, index=${i}.`),t.push(w)}finally{o.stackRestore(y)}},lu=async(e,t,r,n,s,i)=>{var ue,ne,se,Se;let a=Ve(),o=a.PTR_SIZE,u=mr.get(e);if(!u)throw new Error(`cannot run inference. invalid session id: ${e}`);let l=u[0],c=u[1],p=u[2],h=u[3],m=u[4],g=u[5],y=t.length,x=n.length,w=0,b=[],k=[],S=[],I=[],z=a.stackSave(),O=a.stackAlloc(y*o),R=a.stackAlloc(y*o),N=a.stackAlloc(x*o),G=a.stackAlloc(x*o);try{[w,b]=Um(i);for(let K=0;K<y;K++)await Ma(r[K],k,I,e,c[t[K]],t[K],m);for(let K=0;K<x;K++)await Ma(s[K],S,I,e,p[n[K]],y+n[K],m);for(let K=0;K<y;K++)a.setValue(O+K*o,k[K],"*"),a.setValue(R+K*o,c[t[K]],"*");for(let K=0;K<x;K++)a.setValue(N+K*o,S[K],"*"),a.setValue(G+K*o,p[n[K]],"*");if(h&&!g){let{handle:K,outputPreferredLocations:de,outputPreferredLocationsEncoded:Re}=h;if(c.length!==y)throw new Error(`input count from feeds (${y}) is expected to be always equal to model's input count (${c.length}).`);for(let P=0;P<y;P++){let H=t[P];await a._OrtBindInput(K,c[H],k[P])!==0&&Pe(`Can't bind input[${P}] for session=${e}.`)}for(let P=0;P<x;P++){let H=n[P];(ue=s[P])!=null&&ue[3]?a._OrtBindOutput(K,p[H],S[P],0)!==0&&Pe(`Can't bind pre-allocated output[${P}] for session=${e}.`):a._OrtBindOutput(K,p[H],0,Re[H])!==0&&Pe(`Can't bind output[${P}] to ${de[P]} for session=${e}.`)}mr.set(e,[l,c,p,h,m,!0])}(ne=a.jsepOnRunStart)==null||ne.call(a,l),(se=a.webnnOnRunStart)==null||se.call(a,l);let _e;h?_e=await a._OrtRunWithBinding(l,h.handle,x,N,w):_e=await a._OrtRun(l,R,O,y,G,x,N,w),_e!==0&&Pe("failed to call OrtRun().");let Q=[],ie=[];for(let K=0;K<x;K++){let de=Number(a.getValue(N+K*o,"*"));if(de===S[K]){Q.push(s[K]);continue}let Re=a.stackSave(),P=a.stackAlloc(4*o),H=!1,Y,ge=0;try{a._OrtGetTensorData(de,P,P+o,P+2*o,P+3*o)!==0&&Pe(`Can't access output tensor data on index ${K}.`);let Ze=o===4?"i32":"i64",W=Number(a.getValue(P,Ze));ge=a.getValue(P+o,"*");let M=a.getValue(P+o*2,"*"),ae=Number(a.getValue(P+o*3,Ze)),X=[];for(let T=0;T<ae;T++)X.push(Number(a.getValue(M+T*o,Ze)));a._OrtFree(M)!==0&&Pe("Can't free memory for tensor dims.");let le=X.reduce((T,E)=>T*E,1);Y=ar(W);let Ce=h==null?void 0:h.outputPreferredLocations[n[K]];if(Y==="string"){if(Ce==="gpu-buffer"||Ce==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let T=[];for(let E=0;E<le;E++){let A=a.getValue(ge+E*o,"*"),q=a.getValue(ge+(E+1)*o,"*"),L=E===le-1?void 0:q-A;T.push(a.UTF8ToString(A,L))}Q.push([Y,X,T,"cpu"])}else if(Ce==="gpu-buffer"&&le>0){let T=a.jsepGetBuffer;if(!T)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let E=T(ge),A=Pr(W,le);if(A===void 0||!Ho(Y))throw new Error(`Unsupported data type: ${Y}`);H=!0,Q.push([Y,X,{gpuBuffer:E,download:a.jsepCreateDownloader(E,A,Y),dispose:()=>{a._OrtReleaseTensor(de)!==0&&Pe("Can't release tensor.")}},"gpu-buffer"])}else if(Ce==="ml-tensor"&&le>0){let T=a.webnnEnsureTensor,E=a.webnnIsGraphInputOutputTypeSupported;if(!T||!E)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Pr(W,le)===void 0||!Fo(Y))throw new Error(`Unsupported data type: ${Y}`);if(!E(e,Y,!1))throw new Error(`preferredLocation "ml-tensor" for ${Y} output is not supported by current WebNN Context.`);let A=await T(e,ge,W,X,!1);H=!0,Q.push([Y,X,{mlTensor:A,download:a.webnnCreateMLTensorDownloader(ge,Y),dispose:()=>{a.webnnReleaseTensorId(ge),a._OrtReleaseTensor(de)}},"ml-tensor"])}else if(Ce==="ml-tensor-cpu-output"&&le>0){let T=a.webnnCreateMLTensorDownloader(ge,Y)(),E=Q.length;H=!0,ie.push((async()=>{let A=[E,await T];return a.webnnReleaseTensorId(ge),a._OrtReleaseTensor(de),A})()),Q.push([Y,X,[],"cpu"])}else{let T=os(Y),E=new T(le);new Uint8Array(E.buffer,E.byteOffset,E.byteLength).set(a.HEAPU8.subarray(ge,ge+E.byteLength)),Q.push([Y,X,E,"cpu"])}}finally{a.stackRestore(Re),Y==="string"&&ge&&a._free(ge),H||a._OrtReleaseTensor(de)}}h&&!m&&(a._OrtClearBoundOutputs(h.handle)!==0&&Pe("Can't clear bound outputs."),mr.set(e,[l,c,p,h,m,!1]));for(let[K,de]of await Promise.all(ie))Q[K][2]=de;return Q}finally{(Se=a.webnnOnRunEnd)==null||Se.call(a,l),a.stackRestore(z),k.forEach(_e=>a._OrtReleaseTensor(_e)),S.forEach(_e=>a._OrtReleaseTensor(_e)),I.forEach(_e=>a._free(_e)),w!==0&&a._OrtReleaseRunOptions(w),b.forEach(_e=>a._free(_e))}},du=e=>{let t=Ve(),r=mr.get(e);if(!r)throw new Error("invalid session id");let n=r[0],s=t._OrtEndProfiling(n);s===0&&Pe("Can't get an profile file name."),t._OrtFree(s)},cu=e=>{let t=[];for(let r of e){let n=r[2];!Array.isArray(n)&&"buffer"in n&&t.push(n.buffer)}return t}}),gr,gt,Qr,In,Cn,Ii,Na,Ci,Ar,Rr,Wf,Uy,Wy,qy,Ly,Vy,Hy,Fy,Gy=j(()=>{Wt(),Dy(),Fr(),qo(),gr=()=>!!Le.wasm.proxy&&typeof document<"u",Qr=!1,In=!1,Cn=!1,Ci=new Map,Ar=(e,t)=>{let r=Ci.get(e);r?r.push(t):Ci.set(e,[t])},Rr=()=>{if(Qr||!In||Cn||!gt)throw new Error("worker not ready")},Wf=e=>{switch(e.data.type){case"init-wasm":Qr=!1,e.data.err?(Cn=!0,Na[1](e.data.err)):(In=!0,Na[0]()),Ii&&(URL.revokeObjectURL(Ii),Ii=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Ci.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},Uy=async()=>{if(!In){if(Qr)throw new Error("multiple calls to 'initWasm()' detected.");if(Cn)throw new Error("previous call to 'initWasm()' failed.");if(Qr=!0,gr())return new Promise((e,t)=>{gt==null||gt.terminate(),Pm().then(([r,n])=>{try{gt=n,gt.onerror=i=>t(i),gt.onmessage=Wf,Na=[e,t];let s={type:"init-wasm",in:Le};!s.in.wasm.wasmPaths&&(r||Ya)&&(s.in.wasm.wasmPaths={wasm:new URL("/assets/ort-wasm-simd-threaded.jsep-CLPRrI3A.wasm",import.meta.url).href}),gt.postMessage(s),Ii=r}catch(s){t(s)}},t)});try{await Lo(Le.wasm),await su(Le),In=!0}catch(e){throw Cn=!0,e}finally{Qr=!1}}},Wy=async e=>{if(gr())return Rr(),new Promise((t,r)=>{Ar("init-ep",[t,r]);let n={type:"init-ep",in:{epName:e,env:Le}};gt.postMessage(n)});await au(Le,e)},qy=async e=>gr()?(Rr(),new Promise((t,r)=>{Ar("copy-from",[t,r]);let n={type:"copy-from",in:{buffer:e}};gt.postMessage(n,[e.buffer])})):Qi(e),Ly=async(e,t)=>{if(gr()){if(t!=null&&t.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return Rr(),new Promise((r,n)=>{Ar("create",[r,n]);let s={type:"create",in:{model:e,options:{...t}}},i=[];e instanceof Uint8Array&&i.push(e.buffer),gt.postMessage(s,i)})}else return ou(e,t)},Vy=async e=>{if(gr())return Rr(),new Promise((t,r)=>{Ar("release",[t,r]);let n={type:"release",in:e};gt.postMessage(n)});uu(e)},Hy=async(e,t,r,n,s,i)=>{if(gr()){if(r.some(a=>a[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(s.some(a=>a))throw new Error("pre-allocated output tensor is not supported for proxy.");return Rr(),new Promise((a,o)=>{Ar("run",[a,o]);let u=r,l={type:"run",in:{sessionId:e,inputIndices:t,inputs:u,outputIndices:n,options:i}};gt.postMessage(l,cu(u))})}else return lu(e,t,r,n,s,i)},Fy=async e=>{if(gr())return Rr(),new Promise((t,r)=>{Ar("end-profiling",[t,r]);let n={type:"end-profiling",in:e};gt.postMessage(n)});du(e)}}),Pa,qf,jy,r2=j(()=>{Wt(),Gy(),we(),Wo(),qm(),Pa=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},qf=e=>{switch(e[3]){case"cpu":return new Mt(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!Ho(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:r,download:n,dispose:s}=e[2];return Mt.fromGpuBuffer(r,{dataType:t,dims:e[1],download:n,dispose:s})}case"ml-tensor":{let t=e[0];if(!Fo(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:r,download:n,dispose:s}=e[2];return Mt.fromMLTensor(r,{dataType:t,dims:e[1],download:n,dispose:s})}default:throw new Error(`invalid data location: ${e[3]}`)}},jy=class{async fetchModelAndCopyToWasmMemory(e){return qy(await Go(e))}async loadModel(e,t){Xt();let r;typeof e=="string"?r=await this.fetchModelAndCopyToWasmMemory(e):r=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Ly(r,t),Dt()}async dispose(){return Vy(this.sessionId)}async run(e,t,r){Xt();let n=[],s=[];Object.entries(e).forEach(p=>{let h=p[0],m=p[1],g=this.inputNames.indexOf(h);if(g===-1)throw new Error(`invalid input '${h}'`);n.push(m),s.push(g)});let i=[],a=[];Object.entries(t).forEach(p=>{let h=p[0],m=p[1],g=this.outputNames.indexOf(h);if(g===-1)throw new Error(`invalid output '${h}'`);i.push(m),a.push(g)});let o=n.map((p,h)=>Pa(p,()=>`input "${this.inputNames[s[h]]}"`)),u=i.map((p,h)=>p?Pa(p,()=>`output "${this.outputNames[a[h]]}"`):null),l=await Hy(this.sessionId,s,o,a,u,r),c={};for(let p=0;p<l.length;p++)c[this.outputNames[a[p]]]=i[p]??qf(l[p]);return Dt(),c}startProfiling(){}endProfiling(){Fy(this.sessionId)}}}),Ky={};cn(Ky,{OnnxruntimeWebAssemblyBackend:()=>ho,initializeFlags:()=>fo,wasmBackend:()=>Zy});var fo,ho,Zy,n2=j(()=>{Wt(),Gy(),r2(),fo=()=>{(typeof Le.wasm.initTimeout!="number"||Le.wasm.initTimeout<0)&&(Le.wasm.initTimeout=0);let e=Le.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),Le.wasm.simd=!1),typeof Le.wasm.proxy!="boolean"&&(Le.wasm.proxy=!1),typeof Le.wasm.trace!="boolean"&&(Le.wasm.trace=!1),typeof Le.wasm.numThreads!="number"||!Number.isInteger(Le.wasm.numThreads)||Le.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)Le.wasm.numThreads=1;else{let t=typeof navigator>"u"?Lv("node:os").cpus().length:navigator.hardwareConcurrency;Le.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},ho=class{async init(e){fo(),await Uy(),await Wy(e)}async createInferenceSessionHandler(e,t){let r=new jy;return await r.loadModel(e,t),r}},Zy=new ho});Wt();Wt();Wt();var i2="1.22.0";{let e=(n2(),Jn(Ky)).wasmBackend;Jr("webgpu",e,5),Jr("webnn",e,5),Jr("cpu",e,10),Jr("wasm",e,10)}Object.defineProperty(Le.versions,"web",{value:i2,enumerable:!0});/**
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
 */const s2={__name:"HomeView",setup(e){Le.wasm.numThreads=4,Le.wasm.wasmPaths={wasm:"./ort-wasm-simd-threaded.jsep.wasm"};async function t(a){return new Promise((o,u)=>{const l=new Image;l.crossOrigin="anonymous",l.onload=()=>o(l),l.onerror=u,l.src=a})}function r(a,o,u){const l=document.createElement("canvas");l.width=o,l.height=u;const c=l.getContext("2d");c.drawImage(a,0,0,o,u);const p=c.getImageData(0,0,o,u).data,h=new Float32Array(o*u);for(let m=0;m<o*u;m++){const g=p[m*4]/255,y=p[m*4+1]/255,x=p[m*4+2]/255;h[m]=.299*g+.587*y+.114*x}return h}async function n(){return await Uo.create("./superpoint_lightglue_pipeline.ort.onnx")}const s=hh(null);async function i(){try{const a=await n(),o=["./otwarcie_fabryczna_testowy.jpg","./fabryczna_otwarcie_topo.jpg"],u=await Promise.all(o.map(b=>t(b))),l=256,c=256,p=u.map(b=>r(b,l,c)),h=new Float32Array([...p[0],...p[1]]),g={images:new Mt("float32",h,[2,1,c,l])},y=performance.now(),x=await a.run(g),w=performance.now();s.value=`${(w-y).toFixed(2)} ms`,console.log("Inference results:",x)}catch(a){console.error(`Failed to inference ONNX model: ${a}`)}}return i(),(a,o)=>(Gh(),Xw("main",null,[o[0]||(o[0]=Zh(" Hello World ")),Ao("p",null,"Inference Time: "+Qf(s.value),1)]))}},a2=Nv({history:pv("/"),routes:[{path:"/",name:"home",component:s2}]}),Qy=R$(Dv);console.log("a change2");Qy.use(a2);Qy.mount("#app");
