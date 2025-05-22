var yc=(be,ne)=>()=>(ne||be((ne={exports:{}}).exports,ne),ne.exports);var bc=yc((rp,Gr)=>{const $c=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:Function("return this")(),ep={__VUE_OPTIONS_API__:!0,__VUE_PROD_DEVTOOLS__:!1,__VUE_PROD_HYDRATION_MISMATCH_DETAILS__:!1};Object.keys(ep).forEach(be=>{const ne=be.split(".");let pe=$c;for(let De=0;De<ne.length;De++){const fe=ne[De];De===ne.length-1?pe[fe]=ep[be]:pe=pe[fe]||(pe[fe]={})}});var ei=(()=>{var be=Object.defineProperty,ne=Object.getOwnPropertyDescriptor,pe=Object.getOwnPropertyNames,De=Object.prototype.hasOwnProperty,fe=(e=>typeof require<"u"?require:typeof Proxy<"u"?new Proxy(e,{get:(t,i)=>(typeof require<"u"?require:t)[i]}):e)(function(e){if(typeof require<"u")return require.apply(this,arguments);throw Error('Dynamic require of "'+e+'" is not supported')}),T=(e,t)=>()=>(e&&(t=e(e=0)),t),me=(e,t)=>{for(var i in t)be(e,i,{get:t[i],enumerable:!0})},at=(e,t,i,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of pe(t))!De.call(e,a)&&a!==i&&be(e,a,{get:()=>t[a],enumerable:!(r=ne(t,a))||r.enumerable});return e},ce=e=>at(be({},"__esModule",{value:!0}),e),Se,ge,ve,zt,ti,Et=T(()=>{Se=new Map,ge=[],ve=(e,t,i)=>{if(t&&typeof t.init=="function"&&typeof t.createInferenceSessionHandler=="function"){let r=Se.get(e);if(r===void 0)Se.set(e,{backend:t,priority:i});else{if(r.priority>i)return;if(r.priority===i&&r.backend!==t)throw new Error(`cannot register backend "${e}" using priority ${i}`)}if(i>=0){let a=ge.indexOf(e);a!==-1&&ge.splice(a,1);for(let n=0;n<ge.length;n++)if(Se.get(ge[n]).priority<=i){ge.splice(n,0,e);return}ge.push(e)}return}throw new TypeError("not a valid backend")},zt=async e=>{let t=Se.get(e);if(!t)return"backend not found.";if(t.initialized)return t.backend;if(t.aborted)return t.error;{let i=!!t.initPromise;try{return i||(t.initPromise=t.backend.init(e)),await t.initPromise,t.initialized=!0,t.backend}catch(r){return i||(t.error=`${r}`,t.aborted=!0),t.error}finally{delete t.initPromise}}},ti=async e=>{let t=e.executionProviders||[],i=t.map(u=>typeof u=="string"?u:u.name),r=i.length===0?ge:i,a,n=[],s=new Set;for(let u of r){let l=await zt(u);typeof l=="string"?n.push({name:u,err:l}):(a||(a=l),a===l&&s.add(u))}if(!a)throw new Error(`no available backend found. ERR: ${n.map(u=>`[${u.name}] ${u.err}`).join(", ")}`);for(let{name:u,err:l}of n)i.includes(u)&&console.warn(`removing requested execution provider "${u}" from session options because it is not available: ${l}`);let o=t.filter(u=>s.has(typeof u=="string"?u:u.name));return[a,new Proxy(e,{get:(u,l)=>l==="executionProviders"?o:Reflect.get(u,l)})]}}),ii=T(()=>{Et()}),Ct,ri=T(()=>{Ct="1.22.0"}),lt,_e,Hr=T(()=>{ri(),lt="warning",_e={wasm:{},webgl:{},webgpu:{},versions:{common:Ct},set logLevel(e){if(e!==void 0){if(typeof e!="string"||["verbose","info","warning","error","fatal"].indexOf(e)===-1)throw new Error(`Unsupported logging level: ${e}`);lt=e}},get logLevel(){return lt}},Object.defineProperty(_e,"logLevel",{enumerable:!0})}),ee,ap=T(()=>{Hr(),ee=_e}),Fr,jr,np=T(()=>{Fr=(e,t)=>{let i=typeof document<"u"?document.createElement("canvas"):new OffscreenCanvas(1,1);i.width=e.dims[3],i.height=e.dims[2];let r=i.getContext("2d");if(r!=null){let a,n;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[3]):(a=e.dims[3],n=e.dims[2]);let s=t?.format!==void 0?t.format:"RGB",o=t?.norm,u,l;o===void 0||o.mean===void 0?u=[255,255,255,255]:typeof o.mean=="number"?u=[o.mean,o.mean,o.mean,o.mean]:(u=[o.mean[0],o.mean[1],o.mean[2],0],o.mean[3]!==void 0&&(u[3]=o.mean[3])),o===void 0||o.bias===void 0?l=[0,0,0,0]:typeof o.bias=="number"?l=[o.bias,o.bias,o.bias,o.bias]:(l=[o.bias[0],o.bias[1],o.bias[2],0],o.bias[3]!==void 0&&(l[3]=o.bias[3]));let d=n*a,p=0,c=d,h=d*2,f=-1;s==="RGBA"?(p=0,c=d,h=d*2,f=d*3):s==="RGB"?(p=0,c=d,h=d*2):s==="RBG"&&(p=0,h=d,c=d*2);for(let g=0;g<n;g++)for(let y=0;y<a;y++){let _=(e.data[p++]-l[0])*u[0],m=(e.data[c++]-l[1])*u[1],w=(e.data[h++]-l[2])*u[2],$=f===-1?255:(e.data[f++]-l[3])*u[3];r.fillStyle="rgba("+_+","+m+","+w+","+$+")",r.fillRect(y,g,1,1)}if("toDataURL"in i)return i.toDataURL();throw new Error("toDataURL is not supported")}else throw new Error("Can not access image data")},jr=(e,t)=>{let i=typeof document<"u"?document.createElement("canvas").getContext("2d"):new OffscreenCanvas(1,1).getContext("2d"),r;if(i!=null){let a,n,s;t?.tensorLayout!==void 0&&t.tensorLayout==="NHWC"?(a=e.dims[2],n=e.dims[1],s=e.dims[3]):(a=e.dims[3],n=e.dims[2],s=e.dims[1]);let o=t!==void 0&&t.format!==void 0?t.format:"RGB",u=t?.norm,l,d;u===void 0||u.mean===void 0?l=[255,255,255,255]:typeof u.mean=="number"?l=[u.mean,u.mean,u.mean,u.mean]:(l=[u.mean[0],u.mean[1],u.mean[2],255],u.mean[3]!==void 0&&(l[3]=u.mean[3])),u===void 0||u.bias===void 0?d=[0,0,0,0]:typeof u.bias=="number"?d=[u.bias,u.bias,u.bias,u.bias]:(d=[u.bias[0],u.bias[1],u.bias[2],0],u.bias[3]!==void 0&&(d[3]=u.bias[3]));let p=n*a;if(t!==void 0&&(t.format!==void 0&&s===4&&t.format!=="RGBA"||s===3&&t.format!=="RGB"&&t.format!=="BGR"))throw new Error("Tensor format doesn't match input tensor dims");let c=4,h=0,f=1,g=2,y=3,_=0,m=p,w=p*2,$=-1;o==="RGBA"?(_=0,m=p,w=p*2,$=p*3):o==="RGB"?(_=0,m=p,w=p*2):o==="RBG"&&(_=0,w=p,m=p*2),r=i.createImageData(a,n);for(let b=0;b<n*a;h+=c,f+=c,g+=c,y+=c,b++)r.data[h]=(e.data[_++]-d[0])*l[0],r.data[f]=(e.data[m++]-d[1])*l[1],r.data[g]=(e.data[w++]-d[2])*l[2],r.data[y]=$===-1?255:(e.data[$++]-d[3])*l[3]}else throw new Error("Can not access image data");return r}}),Ot,Kr,Zr,Qr,Xr,Yr,sp=T(()=>{ni(),Ot=(e,t)=>{if(e===void 0)throw new Error("Image buffer must be defined");if(t.height===void 0||t.width===void 0)throw new Error("Image height and width must be defined");if(t.tensorLayout==="NHWC")throw new Error("NHWC Tensor layout is not supported yet");let{height:i,width:r}=t,a=t.norm??{mean:255,bias:0},n,s;typeof a.mean=="number"?n=[a.mean,a.mean,a.mean,a.mean]:n=[a.mean[0],a.mean[1],a.mean[2],a.mean[3]??255],typeof a.bias=="number"?s=[a.bias,a.bias,a.bias,a.bias]:s=[a.bias[0],a.bias[1],a.bias[2],a.bias[3]??0];let o=t.format!==void 0?t.format:"RGBA",u=t.tensorFormat!==void 0&&t.tensorFormat!==void 0?t.tensorFormat:"RGB",l=i*r,d=u==="RGBA"?new Float32Array(l*4):new Float32Array(l*3),p=4,c=0,h=1,f=2,g=3,y=0,_=l,m=l*2,w=-1;o==="RGB"&&(p=3,c=0,h=1,f=2,g=-1),u==="RGBA"?w=l*3:u==="RBG"?(y=0,m=l,_=l*2):u==="BGR"&&(m=0,_=l,y=l*2);for(let $=0;$<l;$++,c+=p,f+=p,h+=p,g+=p)d[y++]=(e[c]+s[0])/n[0],d[_++]=(e[h]+s[1])/n[1],d[m++]=(e[f]+s[2])/n[2],w!==-1&&g!==-1&&(d[w++]=(e[g]+s[3])/n[3]);return u==="RGBA"?new ye("float32",d,[1,4,i,r]):new ye("float32",d,[1,3,i,r])},Kr=async(e,t)=>{let i=typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement,r=typeof ImageData<"u"&&e instanceof ImageData,a=typeof ImageBitmap<"u"&&e instanceof ImageBitmap,n=typeof e=="string",s,o=t??{},u=()=>{if(typeof document<"u")return document.createElement("canvas");if(typeof OffscreenCanvas<"u")return new OffscreenCanvas(1,1);throw new Error("Canvas is not supported")},l=d=>typeof HTMLCanvasElement<"u"&&d instanceof HTMLCanvasElement||d instanceof OffscreenCanvas?d.getContext("2d"):null;if(i){let d=u();d.width=e.width,d.height=e.height;let p=l(d);if(p!=null){let c=e.height,h=e.width;if(t!==void 0&&t.resizedHeight!==void 0&&t.resizedWidth!==void 0&&(c=t.resizedHeight,h=t.resizedWidth),t!==void 0){if(o=t,t.tensorFormat!==void 0)throw new Error("Image input config format must be RGBA for HTMLImageElement");o.tensorFormat="RGBA",o.height=c,o.width=h}else o.tensorFormat="RGBA",o.height=c,o.width=h;p.drawImage(e,0,0),s=p.getImageData(0,0,h,c).data}else throw new Error("Can not access image data")}else if(r){let d,p;if(t!==void 0&&t.resizedWidth!==void 0&&t.resizedHeight!==void 0?(d=t.resizedHeight,p=t.resizedWidth):(d=e.height,p=e.width),t!==void 0&&(o=t),o.format="RGBA",o.height=d,o.width=p,t!==void 0){let c=u();c.width=p,c.height=d;let h=l(c);if(h!=null)h.putImageData(e,0,0),s=h.getImageData(0,0,p,d).data;else throw new Error("Can not access image data")}else s=e.data}else if(a){if(t===void 0)throw new Error("Please provide image config with format for Imagebitmap");let d=u();d.width=e.width,d.height=e.height;let p=l(d);if(p!=null){let c=e.height,h=e.width;return p.drawImage(e,0,0,h,c),s=p.getImageData(0,0,h,c).data,o.height=c,o.width=h,Ot(s,o)}else throw new Error("Can not access image data")}else{if(n)return new Promise((d,p)=>{let c=u(),h=l(c);if(!e||!h)return p();let f=new Image;f.crossOrigin="Anonymous",f.src=e,f.onload=()=>{c.width=f.width,c.height=f.height,h.drawImage(f,0,0,c.width,c.height);let g=h.getImageData(0,0,c.width,c.height);o.height=c.height,o.width=c.width,d(Ot(g.data,o))}});throw new Error("Input data provided is not supported - aborted tensor creation")}if(s!==void 0)return Ot(s,o);throw new Error("Input data provided is not supported - aborted tensor creation")},Zr=(e,t)=>{let{width:i,height:r,download:a,dispose:n}=t,s=[1,r,i,4];return new ye({location:"texture",type:"float32",texture:e,dims:s,download:a,dispose:n})},Qr=(e,t)=>{let{dataType:i,dims:r,download:a,dispose:n}=t;return new ye({location:"gpu-buffer",type:i??"float32",gpuBuffer:e,dims:r,download:a,dispose:n})},Xr=(e,t)=>{let{dataType:i,dims:r,download:a,dispose:n}=t;return new ye({location:"ml-tensor",type:i??"float32",mlTensor:e,dims:r,download:a,dispose:n})},Yr=(e,t,i)=>new ye({location:"cpu-pinned",type:e,data:t,dims:i??[t.length]})}),Fe,dt,ai,Jr,op=T(()=>{Fe=new Map([["float32",Float32Array],["uint8",Uint8Array],["int8",Int8Array],["uint16",Uint16Array],["int16",Int16Array],["int32",Int32Array],["bool",Uint8Array],["float64",Float64Array],["uint32",Uint32Array],["int4",Uint8Array],["uint4",Uint8Array]]),dt=new Map([[Float32Array,"float32"],[Uint8Array,"uint8"],[Int8Array,"int8"],[Uint16Array,"uint16"],[Int16Array,"int16"],[Int32Array,"int32"],[Float64Array,"float64"],[Uint32Array,"uint32"]]),ai=!1,Jr=()=>{if(!ai){ai=!0;let e=typeof BigInt64Array<"u"&&BigInt64Array.from,t=typeof BigUint64Array<"u"&&BigUint64Array.from,i=globalThis.Float16Array,r=typeof i<"u"&&i.from;e&&(Fe.set("int64",BigInt64Array),dt.set(BigInt64Array,"int64")),t&&(Fe.set("uint64",BigUint64Array),dt.set(BigUint64Array,"uint64")),r?(Fe.set("float16",i),dt.set(i,"float16")):Fe.set("float16",Uint16Array)}}}),ea,ta,up=T(()=>{ni(),ea=e=>{let t=1;for(let i=0;i<e.length;i++){let r=e[i];if(typeof r!="number"||!Number.isSafeInteger(r))throw new TypeError(`dims[${i}] must be an integer, got: ${r}`);if(r<0)throw new RangeError(`dims[${i}] must be a non-negative integer, got: ${r}`);t*=r}return t},ta=(e,t)=>{switch(e.location){case"cpu":return new ye(e.type,e.data,t);case"cpu-pinned":return new ye({location:"cpu-pinned",data:e.data,type:e.type,dims:t});case"texture":return new ye({location:"texture",texture:e.texture,type:e.type,dims:t});case"gpu-buffer":return new ye({location:"gpu-buffer",gpuBuffer:e.gpuBuffer,type:e.type,dims:t});case"ml-tensor":return new ye({location:"ml-tensor",mlTensor:e.mlTensor,type:e.type,dims:t});default:throw new Error(`tensorReshape: tensor location ${e.location} is not supported`)}}}),ye,ni=T(()=>{np(),sp(),op(),up(),ye=class{constructor(e,t,i){Jr();let r,a;if(typeof e=="object"&&"location"in e)switch(this.dataLocation=e.location,r=e.type,a=e.dims,e.location){case"cpu-pinned":{let s=Fe.get(r);if(!s)throw new TypeError(`unsupported type "${r}" to create tensor from pinned buffer`);if(!(e.data instanceof s))throw new TypeError(`buffer should be of type ${s.name}`);this.cpuData=e.data;break}case"texture":{if(r!=="float32")throw new TypeError(`unsupported type "${r}" to create tensor from texture`);this.gpuTextureData=e.texture,this.downloader=e.download,this.disposer=e.dispose;break}case"gpu-buffer":{if(r!=="float32"&&r!=="float16"&&r!=="int32"&&r!=="int64"&&r!=="uint32"&&r!=="uint8"&&r!=="bool"&&r!=="uint4"&&r!=="int4")throw new TypeError(`unsupported type "${r}" to create tensor from gpu buffer`);this.gpuBufferData=e.gpuBuffer,this.downloader=e.download,this.disposer=e.dispose;break}case"ml-tensor":{if(r!=="float32"&&r!=="float16"&&r!=="int32"&&r!=="int64"&&r!=="uint32"&&r!=="uint64"&&r!=="int8"&&r!=="uint8"&&r!=="bool"&&r!=="uint4"&&r!=="int4")throw new TypeError(`unsupported type "${r}" to create tensor from MLTensor`);this.mlTensorData=e.mlTensor,this.downloader=e.download,this.disposer=e.dispose;break}default:throw new Error(`Tensor constructor: unsupported location '${this.dataLocation}'`)}else{let s,o;if(typeof e=="string")if(r=e,o=i,e==="string"){if(!Array.isArray(t))throw new TypeError("A string tensor's data must be a string array.");s=t}else{let u=Fe.get(e);if(u===void 0)throw new TypeError(`Unsupported tensor type: ${e}.`);if(Array.isArray(t)){if(e==="float16"&&u===Uint16Array||e==="uint4"||e==="int4")throw new TypeError(`Creating a ${e} tensor from number array is not supported. Please use ${u.name} as data.`);e==="uint64"||e==="int64"?s=u.from(t,BigInt):s=u.from(t)}else if(t instanceof u)s=t;else if(t instanceof Uint8ClampedArray)if(e==="uint8")s=Uint8Array.from(t);else throw new TypeError("A Uint8ClampedArray tensor's data must be type of uint8");else if(e==="float16"&&t instanceof Uint16Array&&u!==Uint16Array)s=new globalThis.Float16Array(t.buffer,t.byteOffset,t.length);else throw new TypeError(`A ${r} tensor's data must be type of ${u}`)}else if(o=t,Array.isArray(e)){if(e.length===0)throw new TypeError("Tensor type cannot be inferred from an empty array.");let u=typeof e[0];if(u==="string")r="string",s=e;else if(u==="boolean")r="bool",s=Uint8Array.from(e);else throw new TypeError(`Invalid element type of data array: ${u}.`)}else if(e instanceof Uint8ClampedArray)r="uint8",s=Uint8Array.from(e);else{let u=dt.get(e.constructor);if(u===void 0)throw new TypeError(`Unsupported type for tensor data: ${e.constructor}.`);r=u,s=e}if(o===void 0)o=[s.length];else if(!Array.isArray(o))throw new TypeError("A tensor's dims must be a number array");a=o,this.cpuData=s,this.dataLocation="cpu"}let n=ea(a);if(this.cpuData&&n!==this.cpuData.length&&!((r==="uint4"||r==="int4")&&Math.ceil(n/2)===this.cpuData.length))throw new Error(`Tensor's size(${n}) does not match data length(${this.cpuData.length}).`);this.type=r,this.dims=a,this.size=n}static async fromImage(e,t){return Kr(e,t)}static fromTexture(e,t){return Zr(e,t)}static fromGpuBuffer(e,t){return Qr(e,t)}static fromMLTensor(e,t){return Xr(e,t)}static fromPinnedBuffer(e,t,i){return Yr(e,t,i)}toDataURL(e){return Fr(this,e)}toImageData(e){return jr(this,e)}get data(){if(this.ensureValid(),!this.cpuData)throw new Error("The data is not on CPU. Use `getData()` to download GPU data to CPU, or use `texture` or `gpuBuffer` property to access the GPU data directly.");return this.cpuData}get location(){return this.dataLocation}get texture(){if(this.ensureValid(),!this.gpuTextureData)throw new Error("The data is not stored as a WebGL texture.");return this.gpuTextureData}get gpuBuffer(){if(this.ensureValid(),!this.gpuBufferData)throw new Error("The data is not stored as a WebGPU buffer.");return this.gpuBufferData}get mlTensor(){if(this.ensureValid(),!this.mlTensorData)throw new Error("The data is not stored as a WebNN MLTensor.");return this.mlTensorData}async getData(e){switch(this.ensureValid(),this.dataLocation){case"cpu":case"cpu-pinned":return this.data;case"texture":case"gpu-buffer":case"ml-tensor":{if(!this.downloader)throw new Error("The current tensor is not created with a specified data downloader.");if(this.isDownloading)throw new Error("The current tensor is being downloaded.");try{this.isDownloading=!0;let t=await this.downloader();return this.downloader=void 0,this.dataLocation="cpu",this.cpuData=t,e&&this.disposer&&(this.disposer(),this.disposer=void 0),t}finally{this.isDownloading=!1}}default:throw new Error(`cannot get data from location: ${this.dataLocation}`)}}dispose(){if(this.isDownloading)throw new Error("The current tensor is being downloaded.");this.disposer&&(this.disposer(),this.disposer=void 0),this.cpuData=void 0,this.gpuTextureData=void 0,this.gpuBufferData=void 0,this.mlTensorData=void 0,this.downloader=void 0,this.isDownloading=void 0,this.dataLocation="none"}ensureValid(){if(this.dataLocation==="none")throw new Error("The tensor is disposed.")}reshape(e){if(this.ensureValid(),this.downloader||this.disposer)throw new Error("Cannot reshape a tensor that owns GPU resource.");return ta(this,e)}}}),Ie,ia=T(()=>{ni(),Ie=ye}),pt,si,Te,xe,ra=T(()=>{Hr(),pt=(e,t)=>{(typeof _e.trace>"u"?!_e.wasm.trace:!_e.trace)||console.timeStamp(`${e}::ORT::${t}`)},si=(e,t)=>{let i=new Error().stack?.split(/\r\n|\r|\n/g)||[],r=!1;for(let a=0;a<i.length;a++){if(r&&!i[a].includes("TRACE_FUNC")){let n=`FUNC_${e}::${i[a].trim().split(" ")[1]}`;t&&(n+=`::${t}`),pt("CPU",n);return}i[a].includes("TRACE_FUNC")&&(r=!0)}},Te=e=>{(typeof _e.trace>"u"?!_e.wasm.trace:!_e.trace)||si("BEGIN",e)},xe=e=>{(typeof _e.trace>"u"?!_e.wasm.trace:!_e.trace)||si("END",e)}}),aa,lp=T(()=>{Et(),ia(),ra(),aa=class tp{constructor(t){this.handler=t}async run(t,i,r){Te();let a={},n={};if(typeof t!="object"||t===null||t instanceof Ie||Array.isArray(t))throw new TypeError("'feeds' must be an object that use input names as keys and OnnxValue as corresponding values.");let s=!0;if(typeof i=="object"){if(i===null)throw new TypeError("Unexpected argument[1]: cannot be null.");if(i instanceof Ie)throw new TypeError("'fetches' cannot be a Tensor");if(Array.isArray(i)){if(i.length===0)throw new TypeError("'fetches' cannot be an empty array.");s=!1;for(let l of i){if(typeof l!="string")throw new TypeError("'fetches' must be a string array or an object.");if(this.outputNames.indexOf(l)===-1)throw new RangeError(`'fetches' contains invalid output name: ${l}.`);a[l]=null}if(typeof r=="object"&&r!==null)n=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else{let l=!1,d=Object.getOwnPropertyNames(i);for(let p of this.outputNames)if(d.indexOf(p)!==-1){let c=i[p];(c===null||c instanceof Ie)&&(l=!0,s=!1,a[p]=c)}if(l){if(typeof r=="object"&&r!==null)n=r;else if(typeof r<"u")throw new TypeError("'options' must be an object.")}else n=i}}else if(typeof i<"u")throw new TypeError("Unexpected argument[1]: must be 'fetches' or 'options'.");for(let l of this.inputNames)if(typeof t[l]>"u")throw new Error(`input '${l}' is missing in 'feeds'.`);if(s)for(let l of this.outputNames)a[l]=null;let o=await this.handler.run(t,a,n),u={};for(let l in o)if(Object.hasOwnProperty.call(o,l)){let d=o[l];d instanceof Ie?u[l]=d:u[l]=new Ie(d.type,d.data,d.dims)}return xe(),u}async release(){return this.handler.dispose()}static async create(t,i,r,a){Te();let n,s={};if(typeof t=="string"){if(n=t,typeof i=="object"&&i!==null)s=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof Uint8Array){if(n=t,typeof i=="object"&&i!==null)s=i;else if(typeof i<"u")throw new TypeError("'options' must be an object.")}else if(t instanceof ArrayBuffer||typeof SharedArrayBuffer<"u"&&t instanceof SharedArrayBuffer){let d=t,p=0,c=t.byteLength;if(typeof i=="object"&&i!==null)s=i;else if(typeof i=="number"){if(p=i,!Number.isSafeInteger(p))throw new RangeError("'byteOffset' must be an integer.");if(p<0||p>=d.byteLength)throw new RangeError(`'byteOffset' is out of range [0, ${d.byteLength}).`);if(c=t.byteLength-p,typeof r=="number"){if(c=r,!Number.isSafeInteger(c))throw new RangeError("'byteLength' must be an integer.");if(c<=0||p+c>d.byteLength)throw new RangeError(`'byteLength' is out of range (0, ${d.byteLength-p}].`);if(typeof a=="object"&&a!==null)s=a;else if(typeof a<"u")throw new TypeError("'options' must be an object.")}else if(typeof r<"u")throw new TypeError("'byteLength' must be a number.")}else if(typeof i<"u")throw new TypeError("'options' must be an object.");n=new Uint8Array(d,p,c)}else throw new TypeError("Unexpected argument[0]: must be 'path' or 'buffer'.");let[o,u]=await ti(s),l=await o.createInferenceSessionHandler(n,u);return xe(),new tp(l)}startProfiling(){this.handler.startProfiling()}endProfiling(){this.handler.endProfiling()}get inputNames(){return this.handler.inputNames}get outputNames(){return this.handler.outputNames}get inputMetadata(){return this.handler.inputMetadata}get outputMetadata(){return this.handler.outputMetadata}}}),oi,dp=T(()=>{lp(),oi=aa}),pp=T(()=>{}),cp=T(()=>{}),hp=T(()=>{}),fp=T(()=>{}),na={};me(na,{InferenceSession:()=>oi,TRACE:()=>pt,TRACE_FUNC_BEGIN:()=>Te,TRACE_FUNC_END:()=>xe,Tensor:()=>Ie,env:()=>ee,registerBackend:()=>ve});var ze=T(()=>{ii(),ap(),dp(),ia(),pp(),cp(),ra(),hp(),fp()}),ui=T(()=>{}),sa={};me(sa,{default:()=>oa});var li,di,oa,mp=T(()=>{qd(),je(),mi(),li="ort-wasm-proxy-worker",di=globalThis.self?.name===li,di&&(self.onmessage=e=>{let{type:t,in:i}=e.data;try{switch(t){case"init-wasm":yi(i.wasm).then(()=>{Or(i).then(()=>{postMessage({type:t})},r=>{postMessage({type:t,err:r})})},r=>{postMessage({type:t,err:r})});break;case"init-ep":{let{epName:r,env:a}=i;Ar(a,r).then(()=>{postMessage({type:t})},n=>{postMessage({type:t,err:n})});break}case"copy-from":{let{buffer:r}=i,a=Qt(r);postMessage({type:t,out:a});break}case"create":{let{model:r,options:a}=i;Rr(r,a).then(n=>{postMessage({type:t,out:n})},n=>{postMessage({type:t,err:n})});break}case"release":Dr(i),postMessage({type:t});break;case"run":{let{sessionId:r,inputIndices:a,inputs:n,outputIndices:s,options:o}=i;Ur(r,a,n,s,new Array(s.length).fill(null),o).then(u=>{u.some(l=>l[3]!=="cpu")?postMessage({type:t,err:"Proxy does not support non-cpu tensor location."}):postMessage({type:t,out:u},qr([...n,...u]))},u=>{postMessage({type:t,err:u})});break}case"end-profiling":Pr(i),postMessage({type:t});break;default:}}catch(r){postMessage({type:t,err:r})}}),oa=di?null:e=>new Worker(e??$e,{type:"classic",name:li})}),ua,la,$e,pi,At,da,pa,ci,ca,hi,ha,fi,fa,mi=T(()=>{ui(),ua=typeof location>"u"?void 0:location.origin,la=()=>typeof document<"u"?document.currentScript?.src:typeof self<"u"?self.location?.href:void 0,$e=la(),pi=()=>{if($e&&!$e.startsWith("blob:"))return $e.substring(0,$e.lastIndexOf("/")+1)},At=(e,t)=>{try{let i=t??$e;return(i?new URL(e,i):new URL(e)).origin===ua}catch{return!1}},da=(e,t)=>{let i=t??$e;try{return(i?new URL(e,i):new URL(e)).href}catch{return}},pa=(e,t)=>`${t??"./"}${e}`,ci=async e=>{let t=await(await fetch(e,{credentials:"same-origin"})).blob();return URL.createObjectURL(t)},ca=async e=>(await import(e)).default,hi=(mp(),ce(sa)).default,ha=async()=>{if(!$e)throw new Error("Failed to load proxy worker: cannot determine the script source URL.");if(At($e))return[void 0,hi()];let e=await ci($e);return[e,hi(e)]},fi=void 0,fa=async(e,t,i)=>{if(!e&&!t&&fi&&$e&&At($e))return[void 0,fi];{let r="ort-wasm-simd-threaded.jsep.mjs",a=e??da(r,t),n=i&&a&&!At(a,t),s=n?await ci(a):a??pa(r,t);return[n?s:void 0,await ca(s)]}}}),gi,Bt,ct,_i,ma,ga,_a,yi,J,je=T(()=>{mi(),Bt=!1,ct=!1,_i=!1,ma=()=>{if(typeof SharedArrayBuffer>"u")return!1;try{return typeof MessageChannel<"u"&&new MessageChannel().port1.postMessage(new SharedArrayBuffer(1)),WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,3,1,1,10,11,1,9,0,65,0,254,16,2,0,26,11]))}catch{return!1}},ga=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,30,1,28,0,65,0,253,15,253,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,253,186,1,26,11]))}catch{return!1}},_a=()=>{try{return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,19,1,17,0,65,1,253,15,65,2,253,15,65,3,253,15,253,147,2,11]))}catch{return!1}},yi=async e=>{if(Bt)return Promise.resolve();if(ct)throw new Error("multiple calls to 'initializeWebAssembly()' detected.");if(_i)throw new Error("previous call to 'initializeWebAssembly()' failed.");ct=!0;let t=e.initTimeout,i=e.numThreads;if(e.simd!==!1){if(e.simd==="relaxed"){if(!_a())throw new Error("Relaxed WebAssembly SIMD is not supported in the current environment.")}else if(!ga())throw new Error("WebAssembly SIMD is not supported in the current environment.")}let r=ma();i>1&&!r&&(typeof self<"u"&&!self.crossOriginIsolated&&console.warn("env.wasm.numThreads is set to "+i+", but this will not work unless you enable crossOriginIsolated mode. See https://web.dev/cross-origin-isolation-guide/ for more info."),console.warn("WebAssembly multi-threading is not supported in the current environment. Falling back to single-threading."),e.numThreads=i=1);let a=e.wasmPaths,n=typeof a=="string"?a:void 0,s=a?.mjs,o=s?.href??s,u=a?.wasm,l=u?.href??u,d=e.wasmBinary,[p,c]=await fa(o,n,i>1),h=!1,f=[];if(t>0&&f.push(new Promise(g=>{setTimeout(()=>{h=!0,g()},t)})),f.push(new Promise((g,y)=>{let _={numThreads:i};if(d)_.wasmBinary=d;else if(l||n)_.locateFile=m=>l??n+m;else if(o&&o.indexOf("blob:")!==0)_.locateFile=m=>new URL(m,o).href;else if(p){let m=pi();m&&(_.locateFile=w=>m+w)}c(_).then(m=>{ct=!1,Bt=!0,gi=m,g(),p&&URL.revokeObjectURL(p)},m=>{ct=!1,_i=!0,y(m)})})),await Promise.race(f),h)throw new Error(`WebAssembly backend initializing failed due to timeout: ${t}ms`)},J=()=>{if(Bt&&gi)return gi;throw new Error("WebAssembly is not initialized yet.")}}),Ee,Rt,X,$i=T(()=>{je(),Ee=(e,t)=>{let i=J(),r=i.lengthBytesUTF8(e)+1,a=i._malloc(r);return i.stringToUTF8(e,a,r),t.push(a),a},Rt=(e,t,i,r)=>{if(typeof e=="object"&&e!==null){if(i.has(e))throw new Error("Circular reference in options");i.add(e)}Object.entries(e).forEach(([a,n])=>{let s=t?t+a:a;if(typeof n=="object")Rt(n,s+".",i,r);else if(typeof n=="string"||typeof n=="number")r(s,n.toString());else if(typeof n=="boolean")r(s,n?"1":"0");else throw new Error(`Can't handle extra config type: ${typeof n}`)})},X=e=>{let t=J(),i=t.stackSave();try{let r=t.PTR_SIZE,a=t.stackAlloc(2*r);t._OrtGetLastError(a,a+r);let n=Number(t.getValue(a,r===4?"i32":"i64")),s=t.getValue(a+r,"*"),o=s?t.UTF8ToString(s):"";throw new Error(`${e} ERROR_CODE: ${n}, ERROR_MESSAGE: ${o}`)}finally{t.stackRestore(i)}}}),ya,gp=T(()=>{je(),$i(),ya=e=>{let t=J(),i=0,r=[],a=e||{};try{if(e?.logSeverityLevel===void 0)a.logSeverityLevel=2;else if(typeof e.logSeverityLevel!="number"||!Number.isInteger(e.logSeverityLevel)||e.logSeverityLevel<0||e.logSeverityLevel>4)throw new Error(`log serverity level is not valid: ${e.logSeverityLevel}`);if(e?.logVerbosityLevel===void 0)a.logVerbosityLevel=0;else if(typeof e.logVerbosityLevel!="number"||!Number.isInteger(e.logVerbosityLevel))throw new Error(`log verbosity level is not valid: ${e.logVerbosityLevel}`);e?.terminate===void 0&&(a.terminate=!1);let n=0;return e?.tag!==void 0&&(n=Ee(e.tag,r)),i=t._OrtCreateRunOptions(a.logSeverityLevel,a.logVerbosityLevel,!!a.terminate,n),i===0&&X("Can't create run options."),e?.extra!==void 0&&Rt(e.extra,"",new WeakSet,(s,o)=>{let u=Ee(s,r),l=Ee(o,r);t._OrtAddRunConfigEntry(i,u,l)!==0&&X(`Can't set a run config entry: ${s} - ${o}.`)}),[i,r]}catch(n){throw i!==0&&t._OrtReleaseRunOptions(i),r.forEach(s=>t._free(s)),n}}}),$a,wa,ba,ht,va,xa,_p=T(()=>{je(),$i(),$a=e=>{switch(e){case"disabled":return 0;case"basic":return 1;case"extended":return 2;case"all":return 99;default:throw new Error(`unsupported graph optimization level: ${e}`)}},wa=e=>{switch(e){case"sequential":return 0;case"parallel":return 1;default:throw new Error(`unsupported execution mode: ${e}`)}},ba=e=>{e.extra||(e.extra={}),e.extra.session||(e.extra.session={});let t=e.extra.session;t.use_ort_model_bytes_directly||(t.use_ort_model_bytes_directly="1"),e.executionProviders&&e.executionProviders.some(i=>(typeof i=="string"?i:i.name)==="webgpu")&&(e.enableMemPattern=!1)},ht=(e,t,i,r)=>{let a=Ee(t,r),n=Ee(i,r);J()._OrtAddSessionConfigEntry(e,a,n)!==0&&X(`Can't set a session config entry: ${t} - ${i}.`)},va=async(e,t,i)=>{for(let r of t){let a=typeof r=="string"?r:r.name,n=[];switch(a){case"webnn":if(a="WEBNN",typeof r!="string"){let d=r?.deviceType;d&&ht(e,"deviceType",d,i)}break;case"webgpu":if(a="JS",typeof r!="string"){let d=r;if(d?.preferredLayout){if(d.preferredLayout!=="NCHW"&&d.preferredLayout!=="NHWC")throw new Error(`preferredLayout must be either 'NCHW' or 'NHWC': ${d.preferredLayout}`);ht(e,"preferredLayout",d.preferredLayout,i)}}break;case"wasm":case"cpu":continue;default:throw new Error(`not supported execution provider: ${a}`)}let s=Ee(a,i),o=n.length,u=0,l=0;if(o>0){u=J()._malloc(o*J().PTR_SIZE),i.push(u),l=J()._malloc(o*J().PTR_SIZE),i.push(l);for(let d=0;d<o;d++)J().setValue(u+d*J().PTR_SIZE,n[d][0],"*"),J().setValue(l+d*J().PTR_SIZE,n[d][1],"*")}await J()._OrtAppendExecutionProvider(e,s,u,l,o)!==0&&X(`Can't append execution provider: ${a}.`)}},xa=async e=>{let t=J(),i=0,r=[],a=e||{};ba(a);try{let n=$a(a.graphOptimizationLevel??"all"),s=wa(a.executionMode??"sequential"),o=typeof a.logId=="string"?Ee(a.logId,r):0,u=a.logSeverityLevel??2;if(!Number.isInteger(u)||u<0||u>4)throw new Error(`log serverity level is not valid: ${u}`);let l=a.logVerbosityLevel??0;if(!Number.isInteger(l)||l<0||l>4)throw new Error(`log verbosity level is not valid: ${l}`);let d=typeof a.optimizedModelFilePath=="string"?Ee(a.optimizedModelFilePath,r):0;if(i=t._OrtCreateSessionOptions(n,!!a.enableCpuMemArena,!!a.enableMemPattern,s,!!a.enableProfiling,0,o,u,l,d),i===0&&X("Can't create session options."),a.executionProviders&&await va(i,a.executionProviders,r),a.enableGraphCapture!==void 0){if(typeof a.enableGraphCapture!="boolean")throw new Error(`enableGraphCapture must be a boolean value: ${a.enableGraphCapture}`);ht(i,"enableGraphCapture",a.enableGraphCapture.toString(),r)}if(a.freeDimensionOverrides)for(let[p,c]of Object.entries(a.freeDimensionOverrides)){if(typeof p!="string")throw new Error(`free dimension override name must be a string: ${p}`);if(typeof c!="number"||!Number.isInteger(c)||c<0)throw new Error(`free dimension override value must be a non-negative integer: ${c}`);let h=Ee(p,r);t._OrtAddFreeDimensionOverride(i,h,c)!==0&&X(`Can't set a free dimension override: ${p} - ${c}.`)}return a.extra!==void 0&&Rt(a.extra,"",new WeakSet,(p,c)=>{ht(i,p,c,r)}),[i,r]}catch(n){throw i!==0&&t._OrtReleaseSessionOptions(i)!==0&&X("Can't release session options."),r.forEach(s=>t._free(s)),n}}}),Ke,Pe,Ze,Dt,Mt,wi,bi,vi,N=T(()=>{Ke=e=>{switch(e){case"int8":return 3;case"uint8":return 2;case"bool":return 9;case"int16":return 5;case"uint16":return 4;case"int32":return 6;case"uint32":return 12;case"float16":return 10;case"float32":return 1;case"float64":return 11;case"string":return 8;case"int64":return 7;case"uint64":return 13;case"int4":return 22;case"uint4":return 21;default:throw new Error(`unsupported data type: ${e}`)}},Pe=e=>{switch(e){case 3:return"int8";case 2:return"uint8";case 9:return"bool";case 5:return"int16";case 4:return"uint16";case 6:return"int32";case 12:return"uint32";case 10:return"float16";case 1:return"float32";case 11:return"float64";case 8:return"string";case 7:return"int64";case 13:return"uint64";case 22:return"int4";case 21:return"uint4";default:throw new Error(`unsupported data type: ${e}`)}},Ze=(e,t)=>{let i=[-1,4,1,1,2,2,4,8,-1,1,2,8,4,8,-1,-1,-1,-1,-1,-1,-1,.5,.5][e],r=typeof t=="number"?t:t.reduce((a,n)=>a*n,1);return i>0?Math.ceil(r*i):void 0},Dt=e=>{switch(e){case"float16":return typeof Float16Array<"u"&&Float16Array.from?Float16Array:Uint16Array;case"float32":return Float32Array;case"uint8":return Uint8Array;case"int8":return Int8Array;case"uint16":return Uint16Array;case"int16":return Int16Array;case"int32":return Int32Array;case"bool":return Uint8Array;case"float64":return Float64Array;case"uint32":return Uint32Array;case"int64":return BigInt64Array;case"uint64":return BigUint64Array;default:throw new Error(`unsupported type: ${e}`)}},Mt=e=>{switch(e){case"verbose":return 0;case"info":return 1;case"warning":return 2;case"error":return 3;case"fatal":return 4;default:throw new Error(`unsupported logging level: ${e}`)}},wi=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",bi=e=>e==="float32"||e==="float16"||e==="int32"||e==="int64"||e==="uint32"||e==="uint64"||e==="int8"||e==="uint8"||e==="bool"||e==="uint4"||e==="int4",vi=e=>{switch(e){case"none":return 0;case"cpu":return 1;case"cpu-pinned":return 2;case"texture":return 3;case"gpu-buffer":return 4;case"ml-tensor":return 5;default:throw new Error(`unsupported data location: ${e}`)}}}),xi,ka=T(()=>{ui(),xi=async e=>{if(typeof e=="string"){let t=await fetch(e);if(!t.ok)throw new Error(`failed to load external data file: ${e}`);let i=t.headers.get("Content-Length"),r=i?parseInt(i,10):0;if(r<1073741824)return new Uint8Array(await t.arrayBuffer());{if(!t.body)throw new Error(`failed to load external data file: ${e}, no response body.`);let a=t.body.getReader(),n;try{n=new ArrayBuffer(r)}catch(o){if(o instanceof RangeError){let u=Math.ceil(r/65536);n=new WebAssembly.Memory({initial:u,maximum:u}).buffer}else throw o}let s=0;for(;;){let{done:o,value:u}=await a.read();if(o)break;let l=u.byteLength;new Uint8Array(n,s,l).set(u),s+=l}return new Uint8Array(n,0,r)}}else return e instanceof Blob?new Uint8Array(await e.arrayBuffer()):e instanceof Uint8Array?e:new Uint8Array(e)}}),Sa,Ia,Ta,za,ki,Ea,j,qe=T(()=>{N(),Sa=["V","I","W","E","F"],Ia=(e,t)=>{console.log(`[${Sa[e]},${new Date().toISOString()}]${t}`)},ki=(e,t)=>{Ta=e,za=t},Ea=(e,t)=>{let i=Mt(e),r=Mt(Ta);i>=r&&Ia(i,typeof t=="function"?t():t)},j=(...e)=>{za&&Ea(...e)}}),Ca,nt,k,Ut,Oa,Aa,Ba,W=T(()=>{Ca=class{static calcMatMulShape(e,t){return e[1]!==t[0]?void 0:[e[0],t[1]]}},nt=class{static calcShape(e,t,i=!1){let r=e.length,a=t.length;if(r===0)return t;if(a===0)return e;let n=Math.max(e.length,t.length),s=new Array(n);if(i){if(r<2||a<2)return;let o=Ca.calcMatMulShape([e[r-2],e[r-1]],[t[a-2],t[a-1]]);if(o===void 0)return;[s[n-2],s[n-1]]=o}for(let o=i?3:1;o<=n;o++){let u=r-o<0?1:e[r-o],l=a-o<0?1:t[a-o];if(u!==l&&u>1&&l>1)return;let d=Math.max(u,l);if(u&&l)s[n-o]=Math.max(u,l);else{if(d>1)return;s[n-o]=0}}return s}static isValidBroadcast(e,t){let i=e.length,r=t.length;if(i>r)return!1;for(let a=1;a<=i;a++)if(e[i-a]!==1&&e[i-a]!==t[r-a])return!1;return!0}},k=class Jt{static size(t){return Jt.getSizeFromDimensionRange(t,0,t.length)}static convertShape(t,i=4){let r=t.length;if(r===0)return[];let a=new Array(r),n=r-1;for(;n>=0;){if(t[n]%i===0){a[n]=t[n]/i;break}if(i%t[n]!==0)throw new Error("cannot convert shape");a[n]=1,i/=t[n],n--}for(n--;n>=0;n--)a[n]=t[n];return a}static sizeFromDimension(t,i){if(i<0||i>t.length)throw new Error(`invalid dimension of ${i} for sizeFromDimension as Tensor has ${t.length} dimensions.`);return Jt.getSizeFromDimensionRange(t,i,t.length)}static sizeToDimension(t,i){if(i<0||i>t.length)throw new Error(`invalid dimension of ${i} for sizeToDimension as Tensor has ${t.length} dimensions.`);return Jt.getSizeFromDimensionRange(t,0,i)}static getSizeFromDimensionRange(t,i,r){let a=1;for(let n=i;n<r;n++){if(t[n]<0)throw new Error("cannot get valid size from specified dimension range. Most likely the range contains negative values in them.");a*=Number(t[n])}return a}static computeStrides(t){let i=t.length;if(i===0)return[];if(i===1)return[1];let r=new Array(i);r[i-1]=1,r[i-2]=t[i-1];for(let a=i-3;a>=0;--a)r[a]=r[a+1]*t[a+1];return r}static normalizeAxis(t,i){if(t<-i&&t>=i)throw new Error("unsupported axis for this operation.");return t<0?t+i:t}static normalizeAxes(t,i){return t.map(r=>this.normalizeAxis(r,i??t.length))}static sortBasedOnPerm(t,i){return i?i.map(r=>t[r]):t.slice().reverse()}static padShape(t,i){let r=t.length;return t.map((a,n)=>a+i[n]+i[n+r])}static areEqual(t,i){return t.length!==i.length?!1:t.every((r,a)=>r===i[a])}},Ut=class Tt{static adjustPoolAttributes(t,i,r,a,n,s){if(!t&&r.length!==i.length-2)throw new Error("length of specified kernel shapes should be 2 less than length of input dimensions");if(t)for(let o=0;o<i.length-2;o++)o>=r.length?r.push(i[o+2]):r[o]=i[o+2];for(let o=0;o<r.length;o++)if(o<a.length){if(a[o]<0)throw new Error("strides should be greater than or equal to 1")}else a.push(1);for(let o=0;o<r.length;o++)if(o<n.length){if(n[o]<0)throw new Error("dilations should be greater than or equal to 1")}else n.push(1);for(let o=0;o<r.length*2;o++)if(o<s.length){if(s[o]<0)throw new Error("pad should be greater than or equal to 1")}else s.push(0);for(let o=0;o<r.length;o++){if(r[o]<=0)throw new Error("kernel shapes need to be greater than 0");if(s[o]>=r[o]||s[o+r.length]>=r[o])throw new Error("pads should be smaller than kernel")}}static adjustPadsBasedOnAutoPad(t,i,r,a,n,s,o){if(o){if(n.length!==2*(t.length-2))throw new Error("length of pads should be twice the length of data dimensions");if(i.length!==t.length-2)throw new Error("length of strides should be the length of data dimensions");if(a.length!==t.length-2)throw new Error("length of kernel shapes should be the length of data dimensions");for(let u=0;u<t.length-2;u++)Tt.adjustPadAndReturnShape(t[u+(s?1:2)],i[u],r[u],a[u],n,u,u+t.length-2,o)}}static computePoolOutputShape(t,i,r,a,n,s,o){if(i.length<=0)throw new Error("input shape must be of size greater than 0");let u=[i[0],i[1]];return Tt.computeShapeHelper(t,i,u,r,a,n,s,o),u}static computeConvOutputShape(t,i,r,a,n,s,o){if(t.length<=0||i.length<=0)throw new Error("invalid input tensor dims or invalid filter tensor dims");let u=[t[0],i[0]];return Tt.computeShapeHelper(!1,t,u,r,a,n,s,o),u}static computeShapeHelper(t,i,r,a,n,s,o,u){if(t)for(let l=0;l<i.length-2;l++)r.push(1);else for(let l=0;l<i.length-2;l++)r.push(Tt.adjustPadAndReturnShape(i[l+2],a[l],n[l],s[l],o,l,l+i.length-2,u))}static adjustPadAndReturnShape(t,i,r,a,n,s,o,u){let l=r*(a-1)+1;if(u&&u!=="NOTSET")switch(u){case"VALID":return n[s]=0,n[o]=0,Math.floor((t-l)/i+1);case"SAME_LOWER":case"SAME_UPPER":if(r!==1)throw new Error("Dilation not supported for SAME_UPPER or SAME_LOWER");{let d=((t+i-1)/i-1)*i+a-t;return n[s]=Math.floor(u==="SAME_LOWER"?(d+1)/2:d/2),n[o]=d-n[s],Math.floor((t+d-a)/i+1)}default:throw new Error("Unsupported AutoPad type")}else return Math.floor((t+n[s]+n[o]-l)/i+1)}},Oa=class{static getShapeOfGemmResult(e,t,i,r,a){if(e.length!==2||i.length!==2)throw new Error("shape need to be of size 2");let n,s,o;t?(n=e[1],s=e[0]):(n=e[0],s=e[1]);let u=-1;if(r?(o=i[0],u=1):(o=i[1],u=0),i[u]!==s)throw new Error("dimension mismatch");if(n<=0||o<=0||s<=0)throw new Error("invalid shape specified");if(a&&!nt.isValidBroadcast(a,[n,o]))throw new Error("gemm: invalid bias shape for broadcast");return[n,o,s]}},Aa=-34028234663852886e22,Ba=34028234663852886e22}),Si,Ra=T(()=>{N(),Si=(e,t)=>new(Dt(t))(e)}),Ii,Ti,zi,Da,Ei,Ma,Ci,Oi,Ai,Ua,Pa,yp=T(()=>{N(),qe(),Ii=new Map([["float32",32],["float16",16],["int32",32],["uint32",32],["int64",64],["uint64",64],["int8",8],["uint8",8],["int4",4],["uint4",4]]),Ti=(e,t)=>{if(t==="int32")return e;let i=Ii.get(t);if(!i)throw new Error(`WebNN backend does not support data type: ${t}`);let r=i/8;if(e.byteLength%r!==0)throw new Error(`Invalid Uint8Array length - must be a multiple of ${r}.`);let a=e.byteLength/r,n=new(Dt(t))(e.buffer,e.byteOffset,a);switch(t){case"int64":case"uint64":{let s=new Int32Array(a);for(let o=0;o<a;o++){let u=n[o];if(u>2147483647n||u<-2147483648n)throw new Error("Can not convert int64 data to int32 - value out of range.");s[o]=Number(u)}return new Uint8Array(s.buffer)}case"int8":case"uint8":case"uint32":{if(t==="uint32"&&n.some(o=>o>2147483647))throw new Error("Can not convert uint32 data to int32 - value out of range.");let s=Int32Array.from(n,Number);return new Uint8Array(s.buffer)}default:throw new Error(`Unsupported data conversion from ${t} to 'int32'`)}},zi=(e,t)=>{if(t==="int32")return e;if(e.byteLength%4!==0)throw new Error("Invalid Uint8Array length - must be a multiple of 4 (int32).");let i=e.byteLength/4,r=new Int32Array(e.buffer,e.byteOffset,i);switch(t){case"int64":{let a=BigInt64Array.from(r,BigInt);return new Uint8Array(a.buffer)}case"uint64":{if(r.some(n=>n<0))throw new Error("Can not convert int32 data to uin64 - negative value found.");let a=BigUint64Array.from(r,BigInt);return new Uint8Array(a.buffer)}case"int8":{if(r.some(n=>n<-128||n>127))throw new Error("Can not convert int32 data to int8 - value out of range.");let a=Int8Array.from(r,Number);return new Uint8Array(a.buffer)}case"uint8":{if(r.some(a=>a<0||a>255))throw new Error("Can not convert int32 data to uint8 - value out of range.");return Uint8Array.from(r,Number)}case"uint32":{if(r.some(n=>n<0))throw new Error("Can not convert int32 data to uint32 - negative value found.");let a=Uint32Array.from(r,Number);return new Uint8Array(a.buffer)}default:throw new Error(`Unsupported data conversion from 'int32' to ${t}`)}},Da=1,Ei=()=>Da++,Ma=new Map([["int8","int32"],["uint8","int32"],["uint32","int32"],["int64","int32"]]),Ci=(e,t)=>{let i=Ii.get(e);if(!i)throw new Error(`WebNN backend does not support data type: ${e}`);return t.length>0?Math.ceil(t.reduce((r,a)=>r*a)*i/8):0},Oi=class{constructor(e){this.isDataConverted=!1;let{sessionId:t,context:i,tensor:r,dataType:a,shape:n,fallbackDataType:s}=e;this.sessionId=t,this.mlContext=i,this.mlTensor=r,this.dataType=a,this.tensorShape=n,this.fallbackDataType=s}get tensor(){return this.mlTensor}get type(){return this.dataType}get fallbackType(){return this.fallbackDataType}get shape(){return this.tensorShape}get byteLength(){return Ci(this.dataType,this.tensorShape)}destroy(){j("verbose",()=>"[WebNN] TensorWrapper.destroy"),this.mlTensor.destroy()}write(e){this.mlContext.writeTensor(this.mlTensor,e)}async read(e){if(this.fallbackDataType){let t=await this.mlContext.readTensor(this.mlTensor),i=zi(new Uint8Array(t),this.dataType);if(e){(e instanceof ArrayBuffer?new Uint8Array(e):new Uint8Array(e.buffer,e.byteOffset,e.byteLength)).set(i);return}else return i.buffer}else return e?this.mlContext.readTensor(this.mlTensor,e):this.mlContext.readTensor(this.mlTensor)}canReuseTensor(e,t,i){return this.mlContext===e&&this.dataType===t&&this.tensorShape.length===i.length&&this.tensorShape.every((r,a)=>r===i[a])}setIsDataConverted(e){this.isDataConverted=e}},Ai=class{constructor(e,t){this.tensorManager=e,this.wrapper=t}get tensorWrapper(){return this.wrapper}releaseTensor(){this.tensorWrapper&&(this.tensorManager.releaseTensor(this.tensorWrapper),this.wrapper=void 0)}async ensureTensor(e,t,i,r){let a=this.tensorManager.getMLContext(e),n;if(!a.opSupportLimits().input.dataTypes.includes(t)){if(n=Ma.get(t),!n||!a.opSupportLimits().input.dataTypes.includes(n))throw new Error(`WebNN backend does not support data type: ${t}`);j("verbose",()=>`[WebNN] TensorIdTracker.ensureTensor: fallback dataType from ${t} to ${n}`)}if(this.wrapper){if(this.wrapper.canReuseTensor(a,t,i))return this.wrapper.tensor;if(r){if(this.wrapper.byteLength!==Ci(t,i))throw new Error("Unable to copy data to tensor with different size.");this.activeUpload=new Uint8Array(await this.wrapper.read())}this.tensorManager.releaseTensor(this.wrapper)}let s=typeof MLTensorUsage>"u"?void 0:MLTensorUsage.READ|MLTensorUsage.WRITE;return this.wrapper=await this.tensorManager.getCachedTensor(e,t,i,s,!0,!0,n),r&&this.activeUpload&&(this.wrapper.write(this.activeUpload),this.activeUpload=void 0),this.wrapper.tensor}upload(e){let t=e;if(this.wrapper){if(this.wrapper.fallbackType)if(this.wrapper.fallbackType==="int32")t=Ti(e,this.wrapper.type),this.wrapper.setIsDataConverted(!0);else throw new Error(`Unsupported fallback data type: ${this.wrapper.fallbackType}`);if(e.byteLength===this.wrapper.byteLength){this.wrapper.write(t);return}else j("verbose",()=>"Data size does not match tensor size. Releasing tensor."),this.releaseTensor()}this.activeUpload?this.activeUpload.set(t):this.activeUpload=new Uint8Array(t)}async download(e){if(this.activeUpload){let t=this.wrapper?.isDataConverted?zi(this.activeUpload,this.wrapper?.type):this.activeUpload;if(e){e instanceof ArrayBuffer?new Uint8Array(e).set(t):new Uint8Array(e.buffer,e.byteOffset,e.byteLength).set(t);return}else return t.buffer}if(!this.wrapper)throw new Error("Tensor has not been created.");return e?this.wrapper.read(e):this.wrapper.read()}},Ua=class{constructor(e){this.backend=e,this.tensorTrackersById=new Map,this.freeTensors=[],this.externalTensors=new Set}getMLContext(e){let t=this.backend.getMLContext(e);if(!t)throw new Error("MLContext not found for session.");return t}reserveTensorId(){let e=Ei();return this.tensorTrackersById.set(e,new Ai(this)),e}releaseTensorId(e){let t=this.tensorTrackersById.get(e);t&&(this.tensorTrackersById.delete(e),t.tensorWrapper&&this.releaseTensor(t.tensorWrapper))}async ensureTensor(e,t,i,r,a){j("verbose",()=>`[WebNN] TensorManager.ensureTensor {tensorId: ${t}, dataType: ${i}, shape: ${r}, copyOld: ${a}}`);let n=this.tensorTrackersById.get(t);if(!n)throw new Error("Tensor not found.");return n.ensureTensor(e,i,r,a)}upload(e,t){let i=this.tensorTrackersById.get(e);if(!i)throw new Error("Tensor not found.");i.upload(t)}async download(e,t){j("verbose",()=>`[WebNN] TensorManager.download {tensorId: ${e}, dstBuffer: ${t?.byteLength}}`);let i=this.tensorTrackersById.get(e);if(!i)throw new Error("Tensor not found.");return i.download(t)}releaseTensorsForSession(e){for(let t of this.freeTensors)t.sessionId===e&&t.destroy();this.freeTensors=this.freeTensors.filter(t=>t.sessionId!==e)}registerTensor(e,t,i,r){let a=this.getMLContext(e),n=Ei(),s=new Oi({sessionId:e,context:a,tensor:t,dataType:i,shape:r});return this.tensorTrackersById.set(n,new Ai(this,s)),this.externalTensors.add(s),n}async getCachedTensor(e,t,i,r,a,n,s){let o=this.getMLContext(e);for(let[l,d]of this.freeTensors.entries())if(d.canReuseTensor(o,t,i)){j("verbose",()=>`[WebNN] Reusing tensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${i}`);let p=this.freeTensors.splice(l,1)[0];return p.sessionId=e,p}j("verbose",()=>`[WebNN] MLContext.createTensor {dataType: ${t}, ${s?`fallbackDataType: ${s},`:""} shape: ${i}}`);let u=await o.createTensor({dataType:s??t,shape:i,dimensions:i,usage:r,writable:a,readable:n});return new Oi({sessionId:e,context:o,tensor:u,dataType:t,shape:i,fallbackDataType:s})}releaseTensor(e){this.externalTensors.has(e)&&this.externalTensors.delete(e),this.freeTensors.push(e)}},Pa=(...e)=>new Ua(...e)}),ft,qa,Na,$p=T(()=>{N(),je(),Ra(),yp(),qe(),ft=new Map([[1,"float32"],[10,"float16"],[6,"int32"],[12,"uint32"],[7,"int64"],[13,"uint64"],[22,"int4"],[21,"uint4"],[3,"int8"],[2,"uint8"],[9,"uint8"]]),qa=(e,t)=>{if(e===t)return!0;if(e===void 0||t===void 0)return!1;let i=Object.keys(e).sort(),r=Object.keys(t).sort();return i.length===r.length&&i.every((a,n)=>a===r[n]&&e[a]===t[a])},Na=class{constructor(e){this.tensorManager=Pa(this),this.mlContextBySessionId=new Map,this.sessionIdsByMLContext=new Map,this.mlContextCache=[],this.sessionGraphInputs=new Map,this.sessionGraphOutputs=new Map,this.temporaryGraphInputs=[],this.temporaryGraphOutputs=[],this.temporarySessionTensorIds=new Map,ki(e.logLevel,!!e.debug)}get currentSessionId(){if(this.activeSessionId===void 0)throw new Error("No active session");return this.activeSessionId}onRunStart(e){j("verbose",()=>`[WebNN] onRunStart {sessionId: ${e}}`),this.activeSessionId=e}onRunEnd(e){j("verbose",()=>`[WebNN] onRunEnd {sessionId: ${e}}`);let t=this.temporarySessionTensorIds.get(e);if(t){for(let i of t)j("verbose",()=>`[WebNN] releasing temporary tensor {tensorId: ${i}}`),this.tensorManager.releaseTensorId(i);this.temporarySessionTensorIds.delete(e),this.activeSessionId=void 0}}async createMLContext(e){if(e instanceof GPUDevice){let i=this.mlContextCache.findIndex(r=>r.gpuDevice===e);if(i!==-1)return this.mlContextCache[i].mlContext;{let r=await navigator.ml.createContext(e);return this.mlContextCache.push({gpuDevice:e,mlContext:r}),r}}else if(e===void 0){let i=this.mlContextCache.findIndex(r=>r.options===void 0&&r.gpuDevice===void 0);if(i!==-1)return this.mlContextCache[i].mlContext;{let r=await navigator.ml.createContext();return this.mlContextCache.push({mlContext:r}),r}}let t=this.mlContextCache.findIndex(i=>qa(i.options,e));if(t!==-1)return this.mlContextCache[t].mlContext;{let i=await navigator.ml.createContext(e);return this.mlContextCache.push({options:e,mlContext:i}),i}}registerMLContext(e,t){this.mlContextBySessionId.set(e,t);let i=this.sessionIdsByMLContext.get(t);i||(i=new Set,this.sessionIdsByMLContext.set(t,i)),i.add(e),this.temporaryGraphInputs.length>0&&(this.sessionGraphInputs.set(e,this.temporaryGraphInputs),this.temporaryGraphInputs=[]),this.temporaryGraphOutputs.length>0&&(this.sessionGraphOutputs.set(e,this.temporaryGraphOutputs),this.temporaryGraphOutputs=[])}onReleaseSession(e){this.sessionGraphInputs.delete(e),this.sessionGraphOutputs.delete(e);let t=this.mlContextBySessionId.get(e);if(!t)return;this.tensorManager.releaseTensorsForSession(e),this.mlContextBySessionId.delete(e);let i=this.sessionIdsByMLContext.get(t);if(i.delete(e),i.size===0){this.sessionIdsByMLContext.delete(t);let r=this.mlContextCache.findIndex(a=>a.mlContext===t);r!==-1&&this.mlContextCache.splice(r,1)}}getMLContext(e){return this.mlContextBySessionId.get(e)}reserveTensorId(){return this.tensorManager.reserveTensorId()}releaseTensorId(e){j("verbose",()=>`[WebNN] releaseTensorId {tensorId: ${e}}`),this.tensorManager.releaseTensorId(e)}async ensureTensor(e,t,i,r,a){let n=ft.get(i);if(!n)throw new Error(`Unsupported ONNX data type: ${i}`);return this.tensorManager.ensureTensor(e??this.currentSessionId,t,n,r,a)}async createTemporaryTensor(e,t,i){j("verbose",()=>`[WebNN] createTemporaryTensor {onnxDataType: ${t}, shape: ${i}}`);let r=ft.get(t);if(!r)throw new Error(`Unsupported ONNX data type: ${t}`);let a=this.tensorManager.reserveTensorId();await this.tensorManager.ensureTensor(e,a,r,i,!1);let n=this.temporarySessionTensorIds.get(e);return n?n.push(a):this.temporarySessionTensorIds.set(e,[a]),a}uploadTensor(e,t){if(!J().shouldTransferToMLTensor)throw new Error("Trying to upload to a MLTensor while shouldTransferToMLTensor is false");j("verbose",()=>`[WebNN] uploadTensor {tensorId: ${e}, data: ${t.byteLength}}`),this.tensorManager.upload(e,t)}async downloadTensor(e,t){return this.tensorManager.download(e,t)}createMLTensorDownloader(e,t){return async()=>{let i=await this.tensorManager.download(e);return Si(i,t)}}registerMLTensor(e,t,i,r){let a=ft.get(i);if(!a)throw new Error(`Unsupported ONNX data type: ${i}`);let n=this.tensorManager.registerTensor(e,t,a,r);return j("verbose",()=>`[WebNN] registerMLTensor {tensor: ${t}, dataType: ${a}, dimensions: ${r}} -> {tensorId: ${n}}`),n}registerMLConstant(e,t,i,r,a,n,s=!1){if(!n)throw new Error("External mounted files are not available.");let o=e;e.startsWith("./")&&(o=e.substring(2));let u=n.get(o);if(!u)throw new Error(`File with name ${o} not found in preloaded files.`);if(t+i>u.byteLength)throw new Error("Out of bounds: data offset and length exceed the external file data size.");let l=u.slice(t,t+i).buffer,d;switch(a.dataType){case"float32":d=new Float32Array(l);break;case"float16":d=typeof Float16Array<"u"&&Float16Array.from?new Float16Array(l):new Uint16Array(l);break;case"int32":d=new Int32Array(l);break;case"uint32":d=new Uint32Array(l);break;case"int64":if(s){let p=Ti(new Uint8Array(l),"int64");d=new Int32Array(p.buffer),a.dataType="int32"}else d=new BigInt64Array(l);break;case"uint64":d=new BigUint64Array(l);break;case"int8":d=new Int8Array(l);break;case"int4":case"uint4":case"uint8":d=new Uint8Array(l);break;default:throw new Error(`Unsupported data type: ${a.dataType} in creating WebNN Constant from external data.`)}return j("verbose",()=>`[WebNN] registerMLConstant {dataType: ${a.dataType}, shape: ${a.shape}}} ${s?"(Note: it was int64 data type and registered to int32 as workaround)":""}`),r.constant(a,d)}registerGraphInput(e){this.temporaryGraphInputs.push(e)}registerGraphOutput(e){this.temporaryGraphOutputs.push(e)}isGraphInput(e,t){let i=this.sessionGraphInputs.get(e);return i?i.includes(t):!1}isGraphOutput(e,t){let i=this.sessionGraphOutputs.get(e);return i?i.includes(t):!1}isGraphInputOutputTypeSupported(e,t,i=!0){let r=this.mlContextBySessionId.get(e),a=ft.get(Ke(t));return typeof a>"u"?!1:i?!!r?.opSupportLimits().input.dataTypes.includes(a):!!r?.opSupportLimits().output.dataTypes.includes(a)}flush(){}}}),Bi=T(()=>{}),Ri,Pt,qt,Va,La,Di,Mi,Wa,Ga,wp=T(()=>{qe(),Bi(),Ri=new Map([[64,250],[128,200],[256,200],[512,200],[2048,230],[4096,200],[8192,50],[16384,50],[32768,50],[65536,50],[131072,50],[262144,50],[524288,50],[1048576,50],[2097152,30],[4194304,20],[8388608,10],[12582912,10],[16777216,10],[26214400,15],[33554432,22],[44236800,2],[58982400,6],[67108864,6],[134217728,6],[167772160,6]]),Pt=[],qt=e=>Math.ceil(Number(e)/16)*16,Va=e=>{for(let t=0;t<Pt.length;t++){let i=Pt[t];if(e<=i)return i}return Math.ceil(e/16)*16},La=1,Di=()=>La++,Mi=async(e,t,i,r)=>{let a=qt(i),n=e.device.createBuffer({size:a,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});try{let s=e.getCommandEncoder();e.endComputePass(),s.copyBufferToBuffer(t,0,n,0,a),e.flush(),await n.mapAsync(GPUMapMode.READ);let o=n.getMappedRange();if(r){let u=r();return u.set(new Uint8Array(o,0,i)),u}else return new Uint8Array(o.slice(0,i))}finally{n.destroy()}},Wa=class{constructor(e){this.backend=e,this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.buffersPending=[],this.capturedPendingBuffers=new Map;for(let[t]of Ri)Pt.push(t),this.freeBuffers.set(t,[]),this.freeUniformBuffers.set(t,[]);this.sessionCount=0}upload(e,t){let i=t.buffer,r=t.byteOffset,a=t.byteLength,n=qt(a),s=this.storageCache.get(e);if(!s)throw new Error("gpu data for uploading does not exist");if(Number(s.originalSize)!==a)throw new Error(`inconsistent data size. gpu data size=${s.originalSize}, data size=${a}`);let o=this.backend.device.createBuffer({mappedAtCreation:!0,size:n,usage:GPUBufferUsage.MAP_WRITE|GPUBufferUsage.COPY_SRC}),u=o.getMappedRange();new Uint8Array(u).set(new Uint8Array(i,r,a)),o.unmap();let l=this.backend.device.createCommandEncoder();l.copyBufferToBuffer(o,0,s.gpuData.buffer,0,n),this.backend.device.queue.submit([l.finish()]),o.destroy(),j("verbose",()=>`[WebGPU] GpuDataManager.upload(id=${e})`)}memcpy(e,t){let i=this.storageCache.get(e);if(!i)throw new Error("source gpu data for memcpy does not exist");let r=this.storageCache.get(t);if(!r)throw new Error("destination gpu data for memcpy does not exist");if(i.originalSize!==r.originalSize)throw new Error("inconsistent source and destination gpu data size");let a=qt(i.originalSize),n=this.backend.getCommandEncoder();this.backend.endComputePass(),n.copyBufferToBuffer(i.gpuData.buffer,0,r.gpuData.buffer,0,a)}registerExternalBuffer(e,t,i){let r;if(i){if(r=i[0],e===i[1])return j("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${r}, buffer is the same, skip.`),r;if(this.backend.capturedCommandList.has(this.backend.currentSessionId))throw new Error(`Registering a different external buffer under graph capture mode is not supported yet.
  Please use the previous external buffer!`)}else r=Di();return this.storageCache.set(r,{gpuData:{id:r,type:0,buffer:e},originalSize:t}),j("verbose",()=>`[WebGPU] GpuDataManager.registerExternalBuffer(size=${t}) => id=${r}, registered.`),r}unregisterExternalBuffer(e){e!==void 0&&(this.storageCache.delete(e),j("verbose",()=>`[WebGPU] GpuDataManager.unregisterExternalBuffer() => id=${e}`))}create(e,t=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC|GPUBufferUsage.COPY_DST){let i=Va(e),r,a=(t&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE,n=(t&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM;if(a||n){let o=(a?this.freeBuffers:this.freeUniformBuffers).get(i);o?o.length>0?r=o.pop():r=this.backend.device.createBuffer({size:i,usage:t}):r=this.backend.device.createBuffer({size:i,usage:t})}else r=this.backend.device.createBuffer({size:i,usage:t});let s={id:Di(),type:0,buffer:r};return this.storageCache.set(s.id,{gpuData:s,originalSize:Number(e)}),j("verbose",()=>`[WebGPU] GpuDataManager.create(size=${e}) => id=${s.id}`),s}get(e){return this.storageCache.get(e)?.gpuData}release(e){let t=typeof e=="bigint"?Number(e):e,i=this.storageCache.get(t);if(!i){if(this.storageCache.size===0)return 0;throw new Error("releasing data does not exist")}return j("verbose",()=>`[WebGPU] GpuDataManager.release(id=${t}), gpuDataId=${i.gpuData.id}`),this.storageCache.delete(t),this.buffersPending.push(i.gpuData.buffer),i.originalSize}async download(e,t){let i=this.storageCache.get(Number(e));if(!i)throw new Error("data does not exist");await Mi(this.backend,i.gpuData.buffer,i.originalSize,t)}refreshPendingBuffers(){if(this.buffersPending.length!==0)if(this.backend.sessionStatus==="default"){for(let e of this.buffersPending){let t=Ri.get(e.size);if((e.usage&GPUBufferUsage.STORAGE)===GPUBufferUsage.STORAGE){let i=this.freeBuffers.get(e.size)||[];t===void 0||i.length>=t?e.destroy():i.push(e)}else if((e.usage&GPUBufferUsage.UNIFORM)===GPUBufferUsage.UNIFORM){let i=this.freeUniformBuffers.get(e.size)||[];t===void 0||i.length>=t?e.destroy():i.push(e)}else e.destroy()}this.buffersPending=[]}else{let e=this.capturedPendingBuffers.get(this.backend.currentSessionId);e||(e=[],this.capturedPendingBuffers.set(this.backend.currentSessionId,e));for(let t of this.buffersPending)e.push(t);this.buffersPending=[]}}dispose(){this.freeBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.freeUniformBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache.forEach(e=>{e.gpuData.buffer.destroy()}),this.capturedPendingBuffers.forEach(e=>{e.forEach(t=>{t.destroy()})}),this.storageCache=new Map,this.freeBuffers=new Map,this.freeUniformBuffers=new Map,this.capturedPendingBuffers=new Map}onCreateSession(){this.sessionCount+=1}onReleaseSession(e){let t=this.capturedPendingBuffers.get(e);t&&(t.forEach(i=>{i.destroy()}),this.capturedPendingBuffers.delete(e)),this.sessionCount-=1,this.sessionCount===0&&(j("warning",()=>"[WebGPU] Clearing webgpu buffer cache"),this.storageCache.forEach(i=>{i.gpuData.buffer.destroy()}),this.storageCache=new Map)}},Ga=(...e)=>new Wa(...e)}),Ha,Q,re=T(()=>{Ha=class{constructor(e){Object.assign(this,e)}get cacheKey(){return this.key||(this.key=Object.getOwnPropertyNames(this).sort().map(e=>`${this[e]}`).join(";")),this.key}},Q=e=>new Ha(e)}),st,Nt,se,de,M,ie,Ui,ot,Le,R,mt,S,B,Fa,Pi,ja,Ka,G=T(()=>{N(),W(),st=64,Nt=(e,t)=>{if(t===3)throw new Error("vec3 has same alignment as vec4, use vec4 instead");switch(Number(e)){case 10:return t>1?`vec${t}<f16>`:"f16";case 1:return t>1?`vec${t}<f32>`:"f32";case 6:return t>1?`vec${t}<i32>`:"i32";case 12:return t>1?`vec${t}<u32>`:"u32";case 7:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","i32"];case 13:if(t>1)throw new Error("currently not supported vecX of uint64 yet");return["vec2<u32>","u32"];case 9:if(t!==4)throw new Error("bool must be vec4");return["u32","vec4<bool>"];case 22:return"i32";case 21:return"u32";default:throw new Error(`Unknown data type: ${e}`)}},se=(e,t=1)=>{let i=Nt(e,t);return typeof i=="string"?i:i[0]},de=(e,t=1)=>{let i=Nt(e,t);return typeof i=="string"?i:i[1]},M=(...e)=>{let t=[];return e.forEach(i=>{i.length!==0&&t.push({type:12,data:i},{type:12,data:k.computeStrides(i)})}),t},ie=e=>e%4===0?4:e%2===0?2:1,Ui=(e="f32",t,i="0")=>!t||t===1?`${e}(${i})`:`vec${t}<${e}>(${i})`,ot=(e,t,i)=>e==="f32"?i:t===1?`f32(${i})`:`vec${t}<f32>(${i})`,Le=(e,t)=>t===4?`(${e}.x + ${e}.y + ${e}.z + ${e}.w)`:t===2?`(${e}.x + ${e}.y)`:t===3?`(${e}.x + ${e}.y + ${e}.z)`:e,R=(e,t,i,r)=>e.startsWith("uniforms.")&&i>4?typeof t=="string"?r==="f16"?`${e}[(${t}) / 8][(${t}) % 8 / 4][(${t}) % 8 % 4]`:`${e}[(${t}) / 4][(${t}) % 4]`:r==="f16"?`${e}[${Math.floor(t/8)}][${Math.floor(t%8/4)}][${t%8%4}]`:`${e}[${Math.floor(t/4)}][${t%4}]`:i>1?`${e}[${t}]`:e,mt=(e,t,i,r,a)=>{let n=typeof i=="number",s=n?i:i.length,o=[...new Array(s).keys()],u=s<2?"u32":s<=4?`vec${s}<u32>`:`array<u32, ${s}>`,l=Nt(t,a),d=typeof l=="string"?l:l[1],p=typeof l=="string"?l:l[0],c={indices:u,value:d,storage:p,tensor:t},h=E=>typeof E=="string"?E:`${E}u`,f={offsetToIndices:!1,indicesToOffset:!1,broadcastedIndicesToOffset:!1,set:!1,setByIndices:!1,get:!1,getByIndices:!1},g=n?"uniforms.":"",y=`${g}${e}_shape`,_=`${g}${e}_strides`,m="";for(let E=0;E<s-1;E++)m+=`
let dim${E} = current / ${R(_,E,s)};
let rest${E} = current % ${R(_,E,s)};
indices[${E}] = dim${E};
current = rest${E};
`;m+=`indices[${s-1}] = current;`;let w=s<2?"":`
fn o2i_${e}(offset: u32) -> ${c.indices} {
var indices: ${c.indices};
var current = offset;
${m}
return indices;
}`,$=E=>(f.offsetToIndices=!0,s<2?E:`o2i_${e}(${E})`),b=[];if(s>=2)for(let E=s-1;E>=0;E--)b.push(`${R(_,E,s)} * (indices[${E}])`);let x=s<2?"":`
fn i2o_${e}(indices: ${c.indices}) -> u32 {
return ${b.join("+")};
}`,v=E=>(f.indicesToOffset=!0,s<2?E:`i2o_${e}(${E})`),I=(...E)=>s===0?"0u":`${c.indices}(${E.map(h).join(",")})`,z=(E,C)=>s<2?`${E}`:`${R(E,C,s)}`,O=(E,C,H)=>s<2?`${E}=${H};`:`${R(E,C,s)}=${H};`,V={},U=(E,C)=>{f.broadcastedIndicesToOffset=!0;let H=`${C.name}broadcastedIndicesTo${e}Offset`;if(H in V)return`${H}(${E})`;let Y=[];for(let ue=s-1;ue>=0;ue--){let Ue=C.indicesGet("outputIndices",ue+C.rank-s);Y.push(`${z(_,ue)} * (${Ue} % ${z(y,ue)})`)}return V[H]=`fn ${H}(outputIndices: ${C.type.indices}) -> u32 {
  return ${Y.length>0?Y.join("+"):"0u"};
}`,`${H}(${E})`},L=(E,C)=>(()=>{if(c.storage===c.value)return`${e}[${E}]=${C};`;if(c.storage==="vec2<u32>"&&c.value==="i32")return`${e}[${E}]=vec2<u32>(u32(${C}), select(0u, 0xFFFFFFFFu, ${C} < 0));`;if(c.storage==="vec2<u32>"&&c.value==="u32")return`${e}[${E}]=vec2<u32>(u32(${C}), 0u);`;if(c.storage==="u32"&&c.value==="vec4<bool>")return`${e}[${E}]=dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(${C}));`;throw new Error(`not supported combination of storage type ${c.storage} and value type ${c.value} yet`)})(),A=E=>(()=>{if(c.storage===c.value)return`${e}[${E}]`;if(c.storage==="vec2<u32>"&&c.value==="i32")return`i32(${e}[${E}].x)`;if(c.storage==="vec2<u32>"&&c.value==="u32")return`u32(${e}[${E}].x)`;if(c.storage==="u32"&&c.value==="vec4<bool>")return`vec4<bool>(bool(${e}[${E}] & 0xFFu), bool(${e}[${E}] & 0xFF00u), bool(${e}[${E}] & 0xFF0000u), bool(${e}[${E}] & 0xFF000000u))`;throw new Error(`not supported combination of storage type ${c.storage} and value type ${c.value} yet`)})(),F=s<2?"":`
fn get_${e}ByIndices(indices: ${c.indices}) -> ${d} {
return ${A(`i2o_${e}(indices)`)};
}`,q=s<2?"":(()=>{let E=o.map(H=>`d${H}: u32`).join(", "),C=o.map(H=>`d${H}`).join(", ");return`
fn get_${e}(${E}) -> ${d} {
return get_${e}ByIndices(${I(C)});
}`})(),D=(...E)=>{if(E.length!==s)throw new Error(`indices length must be ${s}`);let C=E.map(h).join(",");return s===0?A("0u"):s===1?A(C[0]):(f.get=!0,f.getByIndices=!0,f.indicesToOffset=!0,`get_${e}(${C})`)},Z=E=>s<2?A(E):(f.getByIndices=!0,f.indicesToOffset=!0,`get_${e}ByIndices(${E})`),P=s<2?"":`
fn set_${e}ByIndices(indices: ${c.indices}, value: ${d}) {
${L(`i2o_${e}(indices)`,"value")}
}`,te=s<2?"":(()=>{let E=o.map(H=>`d${H}: u32`).join(", "),C=o.map(H=>`d${H}`).join(", ");return`
fn set_${e}(${E}, value: ${d}) {
set_${e}ByIndices(${I(C)}, value);
}`})();return{impl:()=>{let E=[],C=!1;return f.offsetToIndices&&(E.push(w),C=!0),f.indicesToOffset&&(E.push(x),C=!0),f.broadcastedIndicesToOffset&&(Object.values(V).forEach(H=>E.push(H)),C=!0),f.set&&(E.push(te),C=!0),f.setByIndices&&(E.push(P),C=!0),f.get&&(E.push(q),C=!0),f.getByIndices&&(E.push(F),C=!0),!n&&C&&E.unshift(`const ${y} = ${c.indices}(${i.join(",")});`,`const ${_} = ${c.indices}(${k.computeStrides(i).join(",")});`),E.join(`
`)},type:c,offsetToIndices:$,indicesToOffset:v,broadcastedIndicesToOffset:U,indices:I,indicesGet:z,indicesSet:O,set:(...E)=>{if(E.length!==s+1)throw new Error(`indices length must be ${s}`);let C=E[s];if(typeof C!="string")throw new Error("value must be string");let H=E.slice(0,s).map(h).join(",");return s===0?L("0u",C):s===1?L(H[0],C):(f.set=!0,f.setByIndices=!0,f.indicesToOffset=!0,`set_${e}(${H}, ${C})`)},setByOffset:L,setByIndices:(E,C)=>s<2?L(E,C):(f.setByIndices=!0,f.indicesToOffset=!0,`set_${e}ByIndices(${E}, ${C});`),get:D,getByOffset:A,getByIndices:Z,usage:r,name:e,strides:_,shape:y,rank:s}},S=(e,t,i,r=1)=>mt(e,t,i,"input",r),B=(e,t,i,r=1)=>mt(e,t,i,"output",r),Fa=(e,t,i)=>mt(e,t,i,"atomicOutput",1),Pi=(e,t,i,r=1)=>mt(e,t,i,"internal",r),ja=class{constructor(e,t){this.normalizedDispatchGroup=e,this.limits=t,this.internalVariables=[],this.variables=[],this.uniforms=[],this.variableIndex=0}guardAgainstOutOfBoundsWorkgroupSizes(e){return`if (global_idx >= ${typeof e=="number"?`${e}u`:e}) { return; }`}mainStart(e=st){let t=typeof e=="number"?e:e[0],i=typeof e=="number"?1:e[1],r=typeof e=="number"?1:e[2];if(t>this.limits.maxComputeWorkgroupSizeX||i>this.limits.maxComputeWorkgroupSizeY||r>this.limits.maxComputeWorkgroupSizeZ)throw new Error(`workgroup size [${t}, ${i}, ${r}] exceeds the maximum workgroup size [${this.limits.maxComputeWorkgroupSizeX}, ${this.limits.maxComputeWorkgroupSizeY}, ${this.limits.maxComputeWorkgroupSizeZ}].`);if(t*i*r>this.limits.maxComputeInvocationsPerWorkgroup)throw new Error(`workgroup size [${t}, ${i}, ${r}] exceeds the maximum workgroup invocations ${this.limits.maxComputeInvocationsPerWorkgroup}.`);let a=this.normalizedDispatchGroup[1]===1&&this.normalizedDispatchGroup[2]===1,n=a?`@builtin(global_invocation_id) global_id : vec3<u32>,
@builtin(workgroup_id) workgroup_id : vec3<u32>,
@builtin(local_invocation_index) local_idx : u32,
@builtin(local_invocation_id) local_id : vec3<u32>`:`@builtin(global_invocation_id) global_id : vec3<u32>,
                                  @builtin(local_invocation_id) local_id : vec3<u32>,
@builtin(local_invocation_index) local_idx : u32,
@builtin(workgroup_id) workgroup_id : vec3<u32>,
@builtin(num_workgroups) num_workgroups : vec3<u32>`,s=a?`let global_idx = global_id.x;
let workgroup_index = workgroup_id.x;`:`let workgroup_index = workgroup_id.z * num_workgroups[0] * num_workgroups[1] +
  workgroup_id.y * num_workgroups[0] + workgroup_id.x;
let global_idx = workgroup_index * ${t*i*r}u + local_idx;`;return`@compute @workgroup_size(${t}, ${i}, ${r})
fn main(${n}) {
${s}
`}appendVariableUniforms(e){e.rank!==0&&(e.shape.startsWith("uniforms.")&&this.uniforms.push({name:e.shape.replace("uniforms.",""),type:"u32",length:e.rank}),e.strides.startsWith("uniforms.")&&this.uniforms.push({name:e.strides.replace("uniforms.",""),type:"u32",length:e.rank}))}declareVariable(e,t){if(e.usage==="internal")throw new Error("cannot use internal variable with declareVariable(). use registerInternalVariables() instead.");this.variables.push(e),this.appendVariableUniforms(e);let i=e.usage==="input"?"read":"read_write",r=e.usage==="atomicOutput"?"atomic<i32>":e.type.storage;return`@group(0) @binding(${t}) var<storage, ${i}> ${e.name}: array<${r}>;`}declareVariables(...e){return e.map(t=>this.declareVariable(t,this.variableIndex++)).join(`
`)}registerInternalVariable(e){if(e.usage!=="internal")throw new Error("cannot use input or output variable with registerInternalVariable(). use declareVariables() instead.");this.internalVariables.push(e),this.appendVariableUniforms(e)}registerInternalVariables(...e){return e.forEach(t=>this.registerInternalVariable(t)),this}registerUniform(e,t,i=1){return this.uniforms.push({name:e,type:t,length:i}),this}registerUniforms(e){return this.uniforms=this.uniforms.concat(e),this}uniformDeclaration(){if(this.uniforms.length===0)return"";let e=[];for(let{name:t,type:i,length:r}of this.uniforms)if(r&&r>4)i==="f16"?e.push(`@align(16) ${t}:array<mat2x4<${i}>, ${Math.ceil(r/8)}>`):e.push(`${t}:array<vec4<${i}>, ${Math.ceil(r/4)}>`);else{let a=r==null||r===1?i:`vec${r}<${i}>`;e.push(`${t}:${a}`)}return`
struct Uniforms { ${e.join(", ")} };
@group(0) @binding(${this.variableIndex}) var<uniform> uniforms: Uniforms;`}get additionalImplementations(){return this.uniformDeclaration()+this.variables.map(e=>e.impl()).join(`
`)+this.internalVariables.map(e=>e.impl()).join(`
`)}get variablesInfo(){if(this.uniforms.length===0)return;let e=t=>[12,10,1,6][["u32","f16","f32","i32"].indexOf(t)];return this.uniforms.map(t=>[e(t.type),t.length??1])}},Ka=(e,t)=>new ja(e,t)}),Za,qi,Qa,Xa,Ya,Ja,we,en,tn,We=T(()=>{N(),W(),re(),G(),Za=(e,t)=>{if(!e||e.length!==1)throw new Error("Transpose requires 1 input.");if(t.length!==0&&t.length!==e[0].dims.length)throw new Error(`perm size ${t.length} does not match input rank ${e[0].dims.length}`)},qi=(e,t)=>t.length!==0?t:[...new Array(e).keys()].reverse(),Qa=(e,t)=>k.sortBasedOnPerm(e,qi(e.length,t)),Xa=(e,t,i,r)=>{let a=`fn perm(i: ${r.type.indices}) -> ${i.type.indices} {
var a: ${i.type.indices};`;for(let n=0;n<t;++n)a+=`a[${e[n]}]=i[${n}];`;return a+="return a;}"},Ya=(e,t)=>{let i=[],r=[];for(let a=0;a<e.length;++a)e[a]!==1&&i.push(e[a]),e[t[a]]!==1&&r.push(t[a]);return{newShape:i,newPerm:r}},Ja=(e,t)=>{let i=0;for(let r=0;r<e.length;++r)if(t[e[r]]!==1){if(e[r]<i)return!1;i=e[r]}return!0},we=(e,t)=>{let i=e.dataType,r=e.dims.length,a=qi(r,t),n=Qa(e.dims,a),s=e.dims,o=n,u=r<2||Ja(a,e.dims),l;if(u)return l=f=>{let g=S("input",i,s,4),y=B("output",i,o,4);return`
${f.registerUniform("output_size","u32").declareVariables(g,y)}
${f.mainStart()}
${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
output[global_idx] = input[global_idx];
}`},{name:"TransposeCopy",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let f=k.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(f/64/4)},programUniforms:[{type:12,data:Math.ceil(f/4)}]}},getShaderSource:l};let{newShape:d,newPerm:p}=Ya(e.dims,a),c=k.areEqual(p,[2,3,1]),h=k.areEqual(p,[3,1,2]);if(d.length===2||c||h){s=c?[d[0],d[1]*d[2]]:h?[d[0]*d[1],d[2]]:d,o=[s[1],s[0]];let f=16;return l=g=>{let y=S("a",i,s.length),_=B("output",i,o.length);return`
${g.registerUniform("output_size","u32").declareVariables(y,_)}
var<workgroup> tile : array<array<${_.type.value}, ${f+1}>, ${f}>;
${g.mainStart([f,f,1])}
let stride = (uniforms.output_shape[1] - 1) / ${f} + 1;
let workgroup_id_x = workgroup_index % stride;
let workgroup_id_y = workgroup_index / stride;
let input_col = workgroup_id_y * ${f}u + local_id.x;
let input_row = workgroup_id_x * ${f}u + local_id.y;
if (input_row < uniforms.a_shape[0] && input_col < uniforms.a_shape[1]) {
tile[local_id.y][local_id.x] = ${y.getByIndices(`${y.type.indices}(input_row, input_col)`)};
}
workgroupBarrier();

let output_col = workgroup_id_x * ${f}u + local_id.x;
let output_row = workgroup_id_y * ${f}u + local_id.y;
if (output_row < uniforms.output_shape[0] && output_col < uniforms.output_shape[1]) {
${_.setByIndices(`${_.type.indices}(output_row, output_col)`,"tile[local_id.x][local_id.y]")}
}
}`},{name:"TransposeShared",shaderCache:{inputDependencies:["type"]},getRunData:()=>{let g=k.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(o[1]/f),y:Math.ceil(o[0]/f)},programUniforms:[{type:12,data:g},...M(s,o)]}},getShaderSource:l}}return l=f=>{let g=S("a",i,s.length),y=B("output",i,o.length);return`
${f.registerUniform("output_size","u32").declareVariables(g,y)}

${Xa(a,r,g,y)}

${f.mainStart()}
${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

let indices = ${y.offsetToIndices("global_idx")};
let aIndices = perm(indices);

${y.setByOffset("global_idx",g.getByIndices("aIndices"))}
}`},{name:"Transpose",shaderCache:{hint:`${t}`,inputDependencies:["rank"]},getRunData:()=>{let f=k.size(n);return{outputs:[{dims:n,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},...M(s,o)]}},getShaderSource:l}},en=(e,t)=>{Za(e.inputs,t.perm),e.compute(we(e.inputs[0],t.perm))},tn=e=>Q({perm:e.perm})}),rn,an,nn,sn,on,un,ln,dn,pn,cn,Ce,hn,fn,mn,gn,_n,yn,$n,wn,bn,vn,bp=T(()=>{N(),W(),G(),Vi(),We(),rn={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate * candidate",logSumExp:"bestValue + exp(candidate)",l1:"bestValue + abs(candidate)",l2:"bestValue + candidate * candidate",logSum:"bestValue + candidate"},an={max:"select(bestValue, candidate, candidate > bestValue)",min:"select(bestValue, candidate, candidate < bestValue)",mean:"bestValue + candidate",sum:"bestValue + candidate",prod:"bestValue * candidate",sumSquare:"bestValue + candidate",logSumExp:"bestValue + candidate",l1:"bestValue + candidate",l2:"bestValue + candidate",logSum:"bestValue + candidate"},nn={max:"_A[offset]",min:"_A[offset]",mean:"0",sum:"0",prod:"1",sumSquare:"0",logSumExp:"0",l1:"0",l2:"0",logSum:"0"},sn={max:"bestValue",min:"bestValue",sum:"bestValue",prod:"bestValue",sumSquare:"bestValue",logSumExp:"log(bestValue)",l1:"bestValue",l2:"sqrt(bestValue)",logSum:"log(bestValue)"},on=(e,t)=>{let i=[];for(let r=t-e;r<t;++r)i.push(r);return i},un=(e,t)=>{let i=[],r=e.length;for(let n=0;n<r;n++)t.indexOf(n)===-1&&i.push(e[n]);let a=t.map(n=>e[n]);return[i,a]},ln=(e,t)=>{let i=e.length+t.length,r=[],a=0;for(let n=0;n<i;n++)t.indexOf(n)===-1?r.push(e[a++]):r.push(1);return r},dn=(e,t)=>{for(let i=0;i<e.length;++i)if(e[e.length-i-1]!==t-1-i)return!1;return!0},pn=(e,t)=>{let i=[];if(!dn(e,t)){for(let r=0;r<t;++r)e.indexOf(r)===-1&&i.push(r);e.forEach(r=>i.push(r))}return i},cn=(e,t,i,r,a,n,s)=>{let o=i[0].dims,u=k.size(n),l=k.size(s),d=S("_A",i[0].dataType,o),p=B("output",a,n),c=64;u===1&&(c=256);let h=`
var<workgroup> aBestValues : array<f32, ${c}>;
`,f=g=>`
${g.registerUniform("reduceSize","u32").declareVariables(d,p)}
${h}
fn DIV_CEIL(a : u32, b : u32) -> u32 {
return ((a - 1u) / b + 1u);
}
${g.mainStart(c)}

let outputIndex = global_idx / ${c};
let offset = outputIndex * uniforms.reduceSize;

var bestValue = f32(${nn[r]});
let Length = uniforms.reduceSize;
for (var k = local_idx; k < Length; k = k + ${c}) {
let candidate = f32(${d.getByOffset("offset + k")});
bestValue = ${rn[r]};
}
aBestValues[local_idx] = bestValue;
workgroupBarrier();

var reduceSize = min(Length, ${c}u);
for (var currentSize = reduceSize / 2u; reduceSize > 1u;
  currentSize = reduceSize / 2u) {
let interval = DIV_CEIL(reduceSize, 2u);
if (local_idx < currentSize) {
 let candidate = aBestValues[local_idx + interval];
 bestValue = ${an[r]};
 aBestValues[local_idx] = bestValue;
}
reduceSize = interval;
workgroupBarrier();
}

if (local_idx == 0u) {
${p.setByOffset("outputIndex",`${r==="mean"?`${p.type.storage}(bestValue / f32(uniforms.reduceSize))`:`${p.type.storage}(${sn[r]})`}`)};
}
}`;return{name:e,shaderCache:{hint:`${t};${c}`,inputDependencies:["type"]},getShaderSource:f,getRunData:()=>({outputs:[{dims:n,dataType:a}],dispatchGroup:{x:u},programUniforms:[{type:12,data:l}]})}},Ce=(e,t,i,r)=>{let a=e.inputs.length===1?i:Ni(e.inputs,i),n=a.axes;n.length===0&&!a.noopWithEmptyAxes&&(n=e.inputs[0].dims.map((h,f)=>f));let s=k.normalizeAxes(n,e.inputs[0].dims.length),o=s,u=e.inputs[0],l=pn(o,e.inputs[0].dims.length);l.length>0&&(u=e.compute(we(e.inputs[0],l),{inputs:[0],outputs:[-1]})[0],o=on(o.length,u.dims.length));let[d,p]=un(u.dims,o),c=d;a.keepDims&&(c=ln(d,s)),e.compute(cn(t,a.cacheKey,[u],r,e.inputs[0].dataType,c,p),{inputs:[u]})},hn=(e,t)=>{Ce(e,"ReduceMeanShared",t,"mean")},fn=(e,t)=>{Ce(e,"ReduceL1Shared",t,"l1")},mn=(e,t)=>{Ce(e,"ReduceL2Shared",t,"l2")},gn=(e,t)=>{Ce(e,"ReduceLogSumExpShared",t,"logSumExp")},_n=(e,t)=>{Ce(e,"ReduceMaxShared",t,"max")},yn=(e,t)=>{Ce(e,"ReduceMinShared",t,"min")},$n=(e,t)=>{Ce(e,"ReduceProdShared",t,"prod")},wn=(e,t)=>{Ce(e,"ReduceSumShared",t,"sum")},bn=(e,t)=>{Ce(e,"ReduceSumSquareShared",t,"sumSquare")},vn=(e,t)=>{Ce(e,"ReduceLogSumShared",t,"logSum")}}),Oe,xn,Vt,Ni,Ae,kn,Sn,In,Tn,zn,En,Cn,On,An,Bn,Be,Rn,Dn,Mn,Un,Pn,qn,Nn,Vn,Ln,Wn,Vi=T(()=>{N(),W(),re(),G(),bp(),Oe=e=>{if(!e||e.length===0||e.length>2)throw new Error("Reduce op requires 1 or 2 inputs.");if(e.length===2&&e[1].dims.length!==1)throw new Error("Invalid axes input dims.")},xn=e=>["","",`var value = ${e.getByIndices("input_indices")};`,""],Vt=(e,t,i,r,a,n,s=!1,o=!1)=>{let u=[],l=i[0].dims,d=l.length,p=k.normalizeAxes(a,d),c=!o&&p.length===0;l.forEach((g,y)=>{c||p.indexOf(y)>=0?s&&u.push(1):u.push(g)});let h=u.length,f=k.size(u);return{name:e,shaderCache:t,getShaderSource:g=>{let y=[],_=S("_A",i[0].dataType,d),m=B("output",n,h),w=r(_,m,p),$=w[2];for(let b=0,x=0;b<d;b++)c||p.indexOf(b)>=0?(s&&x++,$=`for(var j${b}: u32 = 0; j${b} < ${l[b]}; j${b}++) {
       ${w[2].includes("last_index")?`let last_index = j${b};`:""}
       ${_.indicesSet("input_indices",b,`j${b}`)}
       ${$}
     }`):(y.push(`${_.indicesSet("input_indices",b,m.indicesGet("output_indices",x))};`),x++);return`

${g.registerUniform("output_size","u32").declareVariables(_,m)}

${g.mainStart()}
${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
var input_indices: ${_.type.indices};
let output_indices = ${m.offsetToIndices("global_idx")};

${y.join(`
`)}
${w[0]}       // init ops for reduce max/min
${w[1]}
${$}
${w[3]}
${w.length===4?m.setByOffset("global_idx","value"):w.slice(4).join(`
`)}
}`},getRunData:()=>({outputs:[{dims:u,dataType:n}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:[{type:12,data:f},...M(l,u)]})}},Ni=(e,t)=>{let i=[];return e[1].dims[0]>0&&e[1].getBigInt64Array().forEach(r=>i.push(Number(r))),Q({axes:i,keepDims:t.keepDims,noopWithEmptyAxes:t.noopWithEmptyAxes})},Ae=(e,t,i,r)=>{let a=e.inputs,n=a.length===1?i:Ni(a,i);e.compute(Vt(t,{hint:n.cacheKey,inputDependencies:["rank"]},[a[0]],n.noopWithEmptyAxes&&n.axes.length===0?xn:r,n.axes,a[0].dataType,n.keepDims,n.noopWithEmptyAxes),{inputs:[0]})},kn=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceLogSum",t,(i,r)=>[`var value = ${r.type.storage}(0);`,"",`value += ${i.getByIndices("input_indices")};`,"value = log(value);"])},Sn=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceL1",t,(i,r)=>[`var value = ${r.type.storage}(0);`,"",`value += abs(${i.getByIndices("input_indices")});`,""])},In=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceL2",t,(i,r)=>[`var t = ${r.type.value}(0); var value = ${r.type.value}(0);`,"",`t = ${i.getByIndices("input_indices")}; value += (t * t);`,"value = sqrt(value);"])},Tn=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceLogSumExp",t,(i,r)=>[`var value = ${r.type.storage}(0);`,"",`value += exp(${i.getByIndices("input_indices")});`,"value = log(value);"])},zn=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceMax",t,(i,r,a)=>{let n=[];for(let s=0;s<i.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(i.indicesSet("input_indices",s,0));return[`${n.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};`,`value = max(value, ${i.getByIndices("input_indices")});`,""]})},En=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceMean",t,(i,r,a)=>{let n=1;for(let s=0;s<i.rank;s++)(a.indexOf(s)>=0||a.length===0)&&(n*=e.inputs[0].dims[s]);return["var sum = f32(0);","",`sum += f32(${i.getByIndices("input_indices")});`,`let value = ${r.type.value}(sum / ${n});`]})},Cn=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceMin",t,(i,r,a)=>{let n=[];for(let s=0;s<i.rank;s++)(a.indexOf(s)>=0||a.length===0)&&n.push(`input_indices[${s}] = 0;`);return[`${n.join(`
`)}`,`var value = ${i.getByIndices("input_indices")};`,`value = min(value, ${i.getByIndices("input_indices")});`,""]})},On=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceProd",t,(i,r)=>[`var value = ${r.type.storage}(1);`,"",`value *= ${i.getByIndices("input_indices")};`,""])},An=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceSum",t,(i,r)=>[`var value = ${r.type.storage}(0);`,"",`value += ${i.getByIndices("input_indices")};`,""])},Bn=(e,t)=>{Oe(e.inputs),Ae(e,"ReduceSumSquare",t,(i,r)=>[`var t = ${r.type.value}(0); var value = ${r.type.value}(0);`,"",`t = ${i.getByIndices("input_indices")}; value += t * t;`,""])},Be=(e,t,i)=>{if(t.length===0)return i;let r=1,a=1;for(let n=0;n<t.length;n++)t.indexOf(n)===-1?r*=e[n]:a*=e[n];return a<32&&r>1024},Rn=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?En(e,t):hn(e,t)},Dn=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Sn(e,t):fn(e,t)},Mn=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?In(e,t):mn(e,t)},Un=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Tn(e,t):gn(e,t)},Pn=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?zn(e,t):_n(e,t)},qn=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Cn(e,t):yn(e,t)},Nn=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?On(e,t):$n(e,t)},Vn=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?An(e,t):wn(e,t)},Ln=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?Bn(e,t):bn(e,t)},Wn=(e,t)=>{Be(e.inputs[0].dims,t.axes,t.noopWithEmptyAxes)?kn(e,t):vn(e,t)}}),Li,Gn,Hn,Wi,vp=T(()=>{N(),re(),Vi(),Li=e=>{if(!e||e.length===0||e.length>2)throw new Error("ArgMinMaxOp op requires 1 or 2 inputs.");if(e[0].dataType!==1)throw new Error("Invalid input type.")},Gn=(e,t)=>{Li(e.inputs);let i=(r,a,n)=>{let s=[];for(let o=0;o<r.rank;o++)(n.indexOf(o)>=0||n.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${r.getByIndices("input_indices")} ${t.selectLastIndex>0?"<=":"<"} value) {
value = ${r.getByIndices("input_indices")};
best_index = i32(last_index);
}`,"",a.setByOffset("global_idx","best_index")]};e.compute(Vt("ArgMin",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],i,[t.axis],7,t.keepDims),{inputs:[0]})},Hn=(e,t)=>{Li(e.inputs);let i=(r,a,n)=>{let s=[];for(let o=0;o<r.rank;o++)(n.indexOf(o)>=0||n.length===0)&&s.push(`input_indices[${o}] = 0;`);return[`${s.join(`
`)}`,`var value = ${r.getByIndices("input_indices")};
var best_index : i32 = 0;`,`if (${r.getByIndices("input_indices")} ${t.selectLastIndex>0?">=":">"} value) {
value = ${r.getByIndices("input_indices")};
best_index = i32(last_index);
}`,"",a.setByOffset("global_idx","best_index")]};e.compute(Vt("argMax",{hint:t.cacheKey,inputDependencies:["rank"]},[e.inputs[0]],i,[t.axis],7,t.keepDims),{inputs:[0]})},Wi=e=>Q(e)}),Fn,Lt,jn,Kn,Zn,gt,Qn,Xn,Gi=T(()=>{N(),W(),Bi(),G(),Fn=(e,t)=>{let i=e[0],r=e[1],a=e[2],n=e[3],s=e[4],o=e[5];if(s&&o)throw new Error("Attention cannot have both past and attention_bias");if(i.dims.length!==3)throw new Error('Input "input" must have 3 dimensions');let u=i.dims[0],l=i.dims[1],d=i.dims[2];if(a.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimensions');if(r.dims.length!==2)throw new Error('Input "weights" is expected to have 2 dimensions');if(r.dims[0]!==d)throw new Error("Input 1 dimension 0 should have same length as dimension 2 of input 0");if(a.dims[0]!==r.dims[1])throw new Error('Input "bias" dimension 0 should have same length as dimension 1 of input "weights"');let p=a.dims[0]/3,c=p,h=c;if(t.qkvHiddenSizes.length>0){if(t.qkvHiddenSizes.length!==3)throw new Error("qkv_hidden_sizes attribute should have 3 elements");for(let w of t.qkvHiddenSizes)if(w%t.numHeads!==0)throw new Error("qkv_hidden_sizes should be divisible by num_heads");p=t.qkvHiddenSizes[0],c=t.qkvHiddenSizes[1],h=t.qkvHiddenSizes[2]}let f=l;if(p!==c)throw new Error("qkv_hidden_sizes first element should be same as the second");if(a.dims[0]!==p+c+h)throw new Error('Input "bias" dimension 0 should have same length as sum of Q/K/V hidden sizes');let g=0;if(s){if(c!==h)throw new Error('Input "past" expect k_hidden_size == v_hidden_size');if(s.dims.length!==5)throw new Error('Input "past" must have 5 dimensions');if(s.dims[0]!==2)throw new Error('Input "past" first dimension must be 2');if(s.dims[1]!==u)throw new Error('Input "past" second dimension must be batch_size');if(s.dims[2]!==t.numHeads)throw new Error('Input "past" third dimension must be num_heads');if(s.dims[4]!==c/t.numHeads)throw new Error('Input "past" fifth dimension must be k_hidden_size / num_heads');t.pastPresentShareBuffer||(g=s.dims[3])}let y=f+g,_=-1,m=0;if(n)throw new Error("Mask not supported");if(s)throw new Error("past is not supported");if(o){if(o.dims.length!==4)throw new Error('Input "attention_bias" must have 4 dimensions');if(o.dims[0]!==u||o.dims[1]!==t.numHeads||o.dims[2]!==l||o.dims[3]!==y)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:u,sequenceLength:l,pastSequenceLength:g,kvSequenceLength:f,totalSequenceLength:y,maxSequenceLength:_,inputHiddenSize:d,hiddenSize:p,vHiddenSize:h,headSize:Math.floor(p/t.numHeads),vHeadSize:Math.floor(h/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:m,scale:t.scale,broadcastResPosBias:!1,passPastInKv:!1,qkvFormat:1}},Lt=(e,t,i)=>t&&e?`
let total_sequence_length_input = u32(${t.getByOffset("0")});
let present_sequence_length = max(total_sequence_length_input, uniforms.past_sequence_length);
let is_subsequent_prompt: bool = sequence_length > 1 && sequence_length != total_sequence_length_input;
let is_first_prompt: bool = is_subsequent_prompt == false && sequence_length == total_sequence_length_input;
total_sequence_length = u32(${e?.getByOffset("batchIdx")}) + 1;
var past_sequence_length: u32 = 0;
if (is_first_prompt == false) {
past_sequence_length = total_sequence_length - sequence_length;
}
`:`
${i?"let past_sequence_length = uniforms.past_sequence_length":""};
let present_sequence_length = total_sequence_length;
`,jn=(e,t,i,r,a,n,s,o)=>{let u=ie(s?1:n),l=64,d=n/u;d<l&&(l=32);let p=Math.ceil(n/u/l),c=[{type:12,data:t},{type:12,data:i},{type:12,data:r},{type:12,data:a},{type:12,data:d},{type:12,data:p}],h=se(e.dataType,u),f=de(1,u),g=["type"];s&&g.push("type"),o&&g.push("type");let y=_=>{let m=B("x",e.dataType,e.dims,u),w=[m],$=s?S("seq_lens",s.dataType,s.dims):void 0;$&&w.push($);let b=o?S("total_sequence_length_input",o.dataType,o.dims):void 0;b&&w.push(b);let x=de(e.dataType),v=[{name:"batch_size",type:"u32"},{name:"num_heads",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"sequence_length",type:"u32"},{name:"total_sequence_length",type:"u32"},{name:"elements_per_thread",type:"u32"}];return`
var<workgroup> thread_max: array<f32, ${l}>;
var<workgroup> thread_sum: array<f32, ${l}>;
${_.registerUniforms(v).declareVariables(...w)}
${_.mainStart([l,1,1])}
let batchIdx = workgroup_id.z / uniforms.num_heads;
let headIdx = workgroup_id.z % uniforms.num_heads;
let sequence_length = uniforms.sequence_length;
var total_sequence_length = uniforms.total_sequence_length;
${Lt($,b,!1)}
let local_offset = local_idx * uniforms.elements_per_thread;
let offset = (global_idx / ${l}) * uniforms.total_sequence_length + local_offset;
let seq_causal_length = ${s?"u32(past_sequence_length + workgroup_id.y + 1)":"total_sequence_length"};
var thread_max_vector = ${f}(-3.402823e+38f);
for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
thread_max_vector = max(${f}(x[offset + i]), thread_max_vector);
}
thread_max[local_idx] = ${(()=>{switch(u){case 1:return"thread_max_vector";case 2:return"max(thread_max_vector.x, thread_max_vector.y)";case 4:return"max(max(thread_max_vector.x, thread_max_vector.y), max(thread_max_vector.z, thread_max_vector.w))";default:throw new Error(`Unsupported components: ${u}`)}})()};
workgroupBarrier();

var max_value =  f32(-3.402823e+38f);
for (var i = 0u; i < ${l}; i++) {
max_value = max(thread_max[i], max_value);
}

var sum_vector = ${f}(0);
for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
sum_vector += exp(${f}(x[offset + i]) - max_value);
}
thread_sum[local_idx] = ${(()=>{switch(u){case 1:return"sum_vector";case 2:return"sum_vector.x + sum_vector.y";case 4:return"sum_vector.x + sum_vector.y + sum_vector.z + sum_vector.w";default:throw new Error(`Unsupported components: ${u}`)}})()};
workgroupBarrier();

var sum: f32 = 0;
for (var i = 0u; i < ${l}; i++) {
sum += thread_sum[i];
}

if (sum == 0) {
for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
x[offset + i] = ${m.type.value}(${x}(1.0) / ${x}(seq_causal_length));
}
} else {
for (var i: u32 = 0; i < uniforms.elements_per_thread && i + local_offset < seq_causal_length; i++) {
var f32input = ${f}(x[offset + i]);
x[offset + i] = ${m.type.value}(exp(f32input - max_value) / sum);
}
}
${s?`
for (var total_seq_id: u32 = seq_causal_length; total_seq_id + local_offset < uniforms.total_sequence_length; total_seq_id++) {
x[offset + total_seq_id] = ${m.type.value}(${x}(0));
}`:""};
}`};return{name:"AttentionProbsSoftmax",shaderCache:{hint:`${l};${h};${u}`,inputDependencies:g},getShaderSource:y,getRunData:()=>({outputs:[],dispatchGroup:{x:1,y:a,z:t*i},programUniforms:c})}},Kn=(e,t,i,r,a,n,s,o,u)=>{let l=s+n.kvSequenceLength,d=[n.batchSize,n.numHeads,n.sequenceLength,l],p=e>1&&r,c=n.kvNumHeads?n.kvNumHeads:n.numHeads,h=p?[n.batchSize,c,l,n.headSize]:void 0,f=n.nReps?n.nReps:1,g=n.scale===0?1/Math.sqrt(n.headSize):n.scale,y=ie(n.headSize),_=n.headSize/y,m=12,w={x:Math.ceil(l/m),y:Math.ceil(n.sequenceLength/m),z:n.batchSize*n.numHeads},$=[{type:12,data:n.sequenceLength},{type:12,data:_},{type:12,data:l},{type:12,data:n.numHeads},{type:12,data:n.headSize},{type:1,data:g},{type:12,data:s},{type:12,data:n.kvSequenceLength},{type:12,data:f}],b=p&&r&&k.size(r.dims)>0,x=["type","type"];b&&x.push("type"),a&&x.push("type"),o&&x.push("type"),u&&x.push("type");let v=[{dims:d,dataType:t.dataType,gpuDataType:0}];p&&v.push({dims:h,dataType:t.dataType,gpuDataType:0});let I=z=>{let O=S("q",t.dataType,t.dims,y),V=S("key",i.dataType,i.dims,y),U=[O,V];if(b){let P=S("past_key",r.dataType,r.dims,y);U.push(P)}a&&U.push(S("attention_bias",a.dataType,a.dims));let L=o?S("seq_lens",o.dataType,o.dims):void 0;L&&U.push(L);let A=u?S("total_sequence_length_input",u.dataType,u.dims):void 0;A&&U.push(A);let F=B("output",t.dataType,d),q=[F];p&&q.push(B("present_key",t.dataType,h,y));let D=de(1,y),Z=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"alpha",type:"f32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
const TILE_SIZE = ${m}u;

var<workgroup> tileQ: array<${O.type.storage}, ${m*m}>;
var<workgroup> tileK: array<${O.type.storage}, ${m*m}>;
${z.registerUniforms(Z).declareVariables(...U,...q)}
${z.mainStart([m,m,1])}
// x holds the N and y holds the M
let headIdx = workgroup_id.z % uniforms.num_heads;
let kvHeadIdx = ${f===1?"headIdx":"headIdx / uniforms.n_reps"};
let kv_num_heads = ${f===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
let batchIdx = workgroup_id.z / uniforms.num_heads;
let m = workgroup_id.y * TILE_SIZE;
let n = workgroup_id.x * TILE_SIZE;
let sequence_length = uniforms.M;
var total_sequence_length = uniforms.N;
${Lt(L,A,!0)}
let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx;
let qOffset = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
${b&&p?"let pastKeyOffset = absKvHeadIdx * uniforms.past_sequence_length * uniforms.K;":""};
let kOffset = absKvHeadIdx * uniforms.kv_sequence_length * uniforms.K;
${p?"let presentKeyOffset = absKvHeadIdx * uniforms.N * uniforms.K;":""}
var value = ${D}(0);
for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
if (global_id.y < uniforms.M && w + local_id.x < uniforms.K) {
tileQ[TILE_SIZE * local_id.y + local_id.x] = q[qOffset + local_id.y * uniforms.K + w + local_id.x];
}
if (n + local_id.y < uniforms.N && w + local_id.x < uniforms.K) {
var idx = TILE_SIZE * local_id.y + local_id.x;
${b&&p?`
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
value += ${D}(tileQ[TILE_SIZE * local_id.y + k] * tileK[TILE_SIZE * local_id.x + k]);
}

workgroupBarrier();
}

if (global_id.y < uniforms.M && global_id.x < total_sequence_length) {
let headOffset = workgroup_id.z * uniforms.M * uniforms.N;
let outputIdx = headOffset + global_id.y * uniforms.N + global_id.x;
var sum: f32 = ${(()=>{switch(y){case 1:return"value";case 2:return"value.x + value.y";case 4:return"value.x + value.y + value.z + value.w";default:throw new Error(`Unsupported components: ${y}`)}})()};
output[outputIdx] = ${F.type.value} (sum * uniforms.alpha) + ${a?"attention_bias[outputIdx]":"0.0"};
}
}`};return{name:"AttentionProbs",shaderCache:{hint:`${y};${a!==void 0};${r!==void 0};${e}`,inputDependencies:x},getRunData:()=>({outputs:v,dispatchGroup:w,programUniforms:$}),getShaderSource:I}},Zn=(e,t,i,r,a,n,s=void 0,o=void 0)=>{let u=n+a.kvSequenceLength,l=a.nReps?a.nReps:1,d=a.vHiddenSize*l,p=e>1&&r,c=a.kvNumHeads?a.kvNumHeads:a.numHeads,h=p?[a.batchSize,c,u,a.headSize]:void 0,f=[a.batchSize,a.sequenceLength,d],g=12,y={x:Math.ceil(a.vHeadSize/g),y:Math.ceil(a.sequenceLength/g),z:a.batchSize*a.numHeads},_=[{type:12,data:a.sequenceLength},{type:12,data:u},{type:12,data:a.vHeadSize},{type:12,data:a.numHeads},{type:12,data:a.headSize},{type:12,data:d},{type:12,data:n},{type:12,data:a.kvSequenceLength},{type:12,data:l}],m=p&&r&&k.size(r.dims)>0,w=["type","type"];m&&w.push("type"),s&&w.push("type"),o&&w.push("type");let $=[{dims:f,dataType:t.dataType,gpuDataType:0}];p&&$.push({dims:h,dataType:t.dataType,gpuDataType:0});let b=x=>{let v=S("probs",t.dataType,t.dims),I=S("v",i.dataType,i.dims),z=[v,I];m&&z.push(S("past_value",r.dataType,r.dims));let O=s?S("seq_lens",s.dataType,s.dims):void 0;s&&z.push(O);let V=o?S("total_sequence_length_input",o.dataType,o.dims):void 0;o&&z.push(V);let U=[B("output",t.dataType,f)];p&&U.push(B("present_value",t.dataType,h));let L=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"v_hidden_size",type:"u32"},{name:"past_sequence_length",type:"u32"},{name:"kv_sequence_length",type:"u32"},{name:"n_reps",type:"u32"}];return`
const TILE_SIZE = ${g}u;
var<workgroup> tileQ: array<${v.type.value}, ${g*g}>;
var<workgroup> tileV: array<${v.type.value}, ${g*g}>;
${x.registerUniforms(L).declareVariables(...z,...U)}
${x.mainStart([g,g,1])}
let headIdx = workgroup_id.z % uniforms.num_heads;
let batchIdx = workgroup_id.z / uniforms.num_heads;
let kvHeadIdx = ${l===1?"headIdx":"headIdx / uniforms.n_reps"};
let kv_num_heads = ${l===1?"uniforms.num_heads":"uniforms.num_heads / uniforms.n_reps"};
let m = global_id.y;
let n = global_id.x;
let sequence_length = uniforms.M;
var total_sequence_length = uniforms.K;
${Lt(O,V,!0)}
let offsetA = workgroup_id.z * uniforms.M * uniforms.K + m * uniforms.K;
let absKvHeadIdx = batchIdx * kv_num_heads + kvHeadIdx; // kvHeadIdx is relative to the batch
${m&&p?"let pastValueOffset = absKvHeadIdx * uniforms.N * uniforms.past_sequence_length + n;":""};
let vOffset = absKvHeadIdx * uniforms.N * uniforms.kv_sequence_length + n;
${p?"let presentValueOffset = absKvHeadIdx * uniforms.N * uniforms.K + n;":""}
var value = ${v.type.storage}(0);
for (var w: u32 = 0u; w < uniforms.K; w += TILE_SIZE) {
if (m < uniforms.M && w + local_id.x < uniforms.K) {
tileQ[TILE_SIZE * local_id.y + local_id.x] = probs[offsetA + w + local_id.x];
}
if (n < uniforms.N && w + local_id.y < uniforms.K) {
var idx = TILE_SIZE * local_id.y + local_id.x;
${m&&p?`
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
}`};return{name:"AttentionScore",shaderCache:{hint:`${r!==void 0};${e}`,inputDependencies:w},getRunData:()=>({outputs:$,dispatchGroup:y,programUniforms:_}),getShaderSource:b}},gt=(e,t,i,r,a,n,s,o,u,l,d=void 0,p=void 0)=>{let c=Math.min(e.outputCount,1+(s?1:0)+(o?1:0)),h=c>1?l.pastSequenceLength:0,f=h+l.kvSequenceLength,g=u&&k.size(u.dims)>0?u:void 0,y=[t,i];c>1&&s&&k.size(s.dims)>0&&y.push(s),g&&y.push(g),d&&y.push(d),p&&y.push(p);let _=e.compute(Kn(c,t,i,s,g,l,h,d,p),{inputs:y,outputs:c>1?[-1,1]:[-1]})[0];e.compute(jn(_,l.batchSize,l.numHeads,h,l.sequenceLength,f,d,p),{inputs:d&&p?[_,d,p]:[_],outputs:[]});let m=[_,r];c>1&&o&&k.size(o.dims)>0&&m.push(o),d&&m.push(d),p&&m.push(p),e.compute(Zn(c,_,r,o,l,h,d,p),{inputs:m,outputs:c>1?[0,2]:[0]})},Qn=(e,t)=>{let i=[t.batchSize,t.numHeads,t.sequenceLength,t.headSize],r=t.sequenceLength,a=t.inputHiddenSize,n=t.headSize,s=12,o={x:Math.ceil(t.headSize/s),y:Math.ceil(t.sequenceLength/s),z:t.batchSize*t.numHeads},u=[e.inputs[0],e.inputs[1],e.inputs[2]],l=[{type:12,data:r},{type:12,data:a},{type:12,data:n},{type:12,data:t.numHeads},{type:12,data:t.headSize},{type:12,data:t.hiddenSize},{type:12,data:t.hiddenSize+t.hiddenSize+t.vHiddenSize}],d=p=>{let c=B("output_q",u[0].dataType,i),h=B("output_k",u[0].dataType,i),f=B("output_v",u[0].dataType,i),g=S("input",u[0].dataType,u[0].dims),y=S("weight",u[1].dataType,u[1].dims),_=S("bias",u[2].dataType,u[2].dims),m=g.type.storage,w=[{name:"M",type:"u32"},{name:"K",type:"u32"},{name:"N",type:"u32"},{name:"num_heads",type:"u32"},{name:"head_size",type:"u32"},{name:"hidden_size",type:"u32"},{name:"ldb",type:"u32"}];return`
const TILE_SIZE = ${s}u;
var<workgroup> tileInput: array<${m}, ${s*s}>;
var<workgroup> tileWeightQ: array<${m}, ${s*s}>;
var<workgroup> tileWeightK: array<${m}, ${s*s}>;
var<workgroup> tileWeightV: array<${m}, ${s*s}>;
${p.registerUniforms(w).declareVariables(g,y,_,c,h,f)}
${p.mainStart([s,s,1])}
let batchIndex = workgroup_id.z / uniforms.num_heads;
let headNumber = workgroup_id.z % uniforms.num_heads;
let m = global_id.y;
let n = global_id.x;

let inputOffset = batchIndex * (uniforms.M * uniforms.K) + m * uniforms.K;
let biasOffsetQ = headNumber * uniforms.head_size;
let biasOffsetK = uniforms.hidden_size + biasOffsetQ;
let biasOffsetV = uniforms.hidden_size + biasOffsetK;

var valueQ = ${m}(0);
var valueK = ${m}(0);
var valueV = ${m}(0);
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
}`};return e.compute({name:"AttentionPrepare",shaderCache:{inputDependencies:["type","type","type"]},getRunData:()=>({outputs:[{dims:i,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:i,dataType:e.inputs[0].dataType,gpuDataType:0},{dims:i,dataType:e.inputs[0].dataType,gpuDataType:0}],dispatchGroup:o,programUniforms:l}),getShaderSource:d},{inputs:u,outputs:[-1,-1,-1]})},Xn=(e,t)=>{let i=Fn(e.inputs,t),[r,a,n]=Qn(e,i);return gt(e,r,a,n,e.inputs[4],void 0,void 0,void 0,e.inputs[5],i)}}),Yn,Jn,es,ts,xp=T(()=>{ze(),N(),W(),re(),G(),Yn=(e,t)=>{if(!e||e.length!==5)throw new Error("BatchNormalization requires 5 inputs");let i=(r,a,n)=>{let s=a.length;if(s!==r.length)throw new Error(`${n}: num dimensions != ${s}`);a.forEach((o,u)=>{if(o!==r[u])throw new Error(`${n}: dim[${u}] do not match`)})};if(e[0].dims.length>1){let r=t.format==="NHWC"?t.spatial?e[0].dims.slice(-1):e[0].dims.slice(-1).concat(e[0].dims.slice(1,e[0].dims.length-1)):e[0].dims.slice(1,t.spatial?2:void 0);i(e[1].dims,r,"Invalid input scale"),i(e[2].dims,r,"Invalid input B"),i(e[3].dims,r,"Invalid input mean"),i(e[4].dims,r,"Invalid input var")}else i(e[1].dims,[1],"Invalid input scale"),i(e[2].dims,[1],"Invalid input B"),i(e[3].dims,[1],"Invalid input mean"),i(e[4].dims,[1],"Invalid input var")},Jn=(e,t)=>{let{epsilon:i,spatial:r,format:a}=t,n=e[0].dims,s=r?ie(n[n.length-1]):1,o=a==="NHWC"&&n.length>1?s:1,u=k.size(n)/s,l=r,d=l?n.length:n,p=S("x",e[0].dataType,e[0].dims,s),c=S("scale",e[1].dataType,e[1].dims,o),h=S("bias",e[2].dataType,e[2].dims,o),f=S("inputMean",e[3].dataType,e[3].dims,o),g=S("inputVar",e[4].dataType,e[4].dims,o),y=B("y",e[0].dataType,d,s),_=()=>{let w="";if(r)w=`let cOffset = ${n.length===1?"0u":a==="NHWC"?`outputIndices[${n.length-1}] / ${s}`:"outputIndices[1]"};`;else if(a==="NCHW")w=`
 ${y.indicesSet("outputIndices","0","0")}
 let cOffset = ${y.indicesToOffset("outputIndices")};`;else{w=`var cIndices = ${c.type.indices}(0);
            cIndices[0] = outputIndices[${n.length-1}];`;for(let $=1;$<c.rank;$++)w+=`cIndices[${$}] = outputIndices[${$}];`;w+=`let cOffset = ${c.indicesToOffset("cIndices")};`}return w},m=w=>`
const epsilon = ${i};
${w.registerUniform("outputSize","u32").declareVariables(p,c,h,f,g,y)}
${w.mainStart()}
${w.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
var outputIndices = ${y.offsetToIndices(`global_idx * ${s}`)};
${_()}
let scale = ${c.getByOffset("cOffset")};
let bias = ${h.getByOffset("cOffset")};
let inputMean = ${f.getByOffset("cOffset")};
let inputVar = ${g.getByOffset("cOffset")};
let x = ${p.getByOffset("global_idx")};
let value = (x - inputMean) * inverseSqrt(inputVar + epsilon) * scale + bias;
${y.setByOffset("global_idx","value")}
}`;return{name:"BatchNormalization",shaderCache:{hint:`${t.epsilon}_${t.format}_${r}_${s}`,inputDependencies:l?["rank","type","type","type","type"]:void 0},getShaderSource:m,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l?[{type:12,data:u},...M(n)]:[{type:12,data:u}]})}},es=e=>Q(e),ts=(e,t)=>{let{inputs:i,outputCount:r}=e,a=es({...t,outputCount:r});if(ee.webgpu.validateInputContent&&Yn(i,a),t.trainingMode)throw new Error("BatchNormalization trainingMode is not supported yet.");e.compute(Jn(i,a))}}),is,rs,as,kp=T(()=>{W(),G(),is=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![320,640,1280].includes(e[0].dims[2]))throw new Error("number of channels should be 320, 640 or 1280");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},rs=e=>{let t=e[0].dims,i=e[0].dims[2],r=k.size(t)/4,a=e[0].dataType,n=S("input",a,t,4),s=S("bias",a,[i],4),o=S("residual",a,t,4),u=B("output",a,t,4);return{name:"BiasAdd",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(r/64)}}),getShaderSource:l=>`
const channels = ${i}u / 4;
${l.declareVariables(n,s,o,u)}

${l.mainStart()}
${l.guardAgainstOutOfBoundsWorkgroupSizes(r)}
let value = ${n.getByOffset("global_idx")}
+ ${s.getByOffset("global_idx % channels")} + ${o.getByOffset("global_idx")};
${u.setByOffset("global_idx","value")}
}`}},as=e=>{is(e.inputs),e.compute(rs(e.inputs))}}),ns,K,ss,os,us,ls,ds,ps,cs,hs,fs,ms,gs,_s,ys,$s,_t,ws,Wt,bs,vs,xs,ks,Ss,Is,Ts,zs,Es,Cs,Os,As,Bs,Rs,Ds,Ms,Hi,Us,Fi,ji,Ps,qs,Ns,Vs,Ls,Ws,Ki=T(()=>{N(),W(),re(),G(),ns=(e,t,i,r,a,n,s)=>{let o=Math.ceil(t/4),u="";typeof a=="string"?u=`${a}(a)`:u=a("a");let l=S("inputData",i,[o],4),d=B("outputData",r,[o],4),p=[{name:"vec_size",type:"u32"}];return s&&p.push(...s),`
${e.registerUniforms(p).declareVariables(l,d)}

${n??""}

${e.mainStart()}
${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}

let a = ${l.getByOffset("global_idx")};
${d.setByOffset("global_idx",u)}
}`},K=(e,t,i,r,a,n=e.dataType,s,o)=>{let u=[{type:12,data:Math.ceil(k.size(e.dims)/4)}];return s&&u.push(...s),{name:t,shaderCache:{hint:a,inputDependencies:["type"]},getShaderSource:l=>ns(l,k.size(e.dims),e.dataType,n,i,r,o),getRunData:l=>({outputs:[{dims:e.dims,dataType:n}],dispatchGroup:{x:Math.ceil(k.size(l[0].dims)/64/4)},programUniforms:u})}},ss=e=>{e.compute(K(e.inputs[0],"Abs","abs"))},os=e=>{e.compute(K(e.inputs[0],"Acos","acos"))},us=e=>{e.compute(K(e.inputs[0],"Acosh","acosh"))},ls=e=>{e.compute(K(e.inputs[0],"Asin","asin"))},ds=e=>{e.compute(K(e.inputs[0],"Asinh","asinh"))},ps=e=>{e.compute(K(e.inputs[0],"Atan","atan"))},cs=e=>{e.compute(K(e.inputs[0],"Atanh","atanh"))},hs=e=>Q(e),fs=(e,t)=>{let i;switch(t.to){case 10:i="vec4<f16>";break;case 1:i="vec4<f32>";break;case 12:i="vec4<u32>";break;case 6:i="vec4<i32>";break;case 9:i="vec4<bool>";break;default:throw new RangeError(`not supported type (specified in attribute 'to' from 'Cast' operator): ${t.to}`)}e.compute(K(e.inputs[0],"Cast",i,void 0,t.cacheKey,t.to))},ms=e=>{let t,i,r=e.length>=2&&e[1].data!==0,a=e.length>=3&&e[2].data!==0;switch(e[0].dataType){case 1:t=r?e[1].getFloat32Array()[0]:-34028234663852886e22,i=a?e[2].getFloat32Array()[0]:34028234663852886e22;break;case 10:t=r?e[1].getUint16Array()[0]:64511,i=a?e[2].getUint16Array()[0]:31743;break;default:throw new Error("Unsupport data type")}return Q({min:t,max:i})},gs=(e,t)=>{let i=t||ms(e.inputs),r=de(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Clip",a=>`clamp(${a}, vec4<${r}>(uniforms.min), vec4<${r}>(uniforms.max))`,void 0,i.cacheKey,void 0,[{type:e.inputs[0].dataType,data:i.min},{type:e.inputs[0].dataType,data:i.max}],[{name:"min",type:r},{name:"max",type:r}]),{inputs:[0]})},_s=e=>{e.compute(K(e.inputs[0],"Ceil","ceil"))},ys=e=>{e.compute(K(e.inputs[0],"Cos","cos"))},$s=e=>{e.compute(K(e.inputs[0],"Cosh","cosh"))},_t=e=>Q(e),ws=(e,t)=>{let i=de(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Elu",r=>`elu_vf32(${r})`,`
const elu_alpha_ = ${i}(${t.alpha});

fn elu_f32(a: ${i}) -> ${i} {
return select((exp(a) - 1.0) * elu_alpha_, a, a >= 0.0);
}

fn elu_vf32(v: vec4<${i}>) -> vec4<${i}> {
return vec4(elu_f32(v.x), elu_f32(v.y), elu_f32(v.z), elu_f32(v.w));
}`,t.cacheKey))},Wt=(e="f32")=>`
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
}`,bs=e=>{let t=de(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Erf",i=>`erf_vf32(${i})`,Wt(t)))},vs=e=>{e.compute(K(e.inputs[0],"Exp","exp"))},xs=e=>{e.compute(K(e.inputs[0],"Floor","floor"))},ks=e=>{let t=de(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Gelu",i=>`0.5 * ${i} * (1.0 + erf_vf32(${i} * 0.7071067811865475))`,Wt(t)))},Ss=(e,t)=>{let i=de(e.inputs[0].dataType);e.compute(K(e.inputs[0],"LeakyRelu",r=>`select(leaky_relu_alpha_ * ${r}, ${r}, ${r} >= vec4<${i}>(0.0))`,`const leaky_relu_alpha_ = ${i}(${t.alpha});`,t.cacheKey))},Is=e=>{e.compute(K(e.inputs[0],"Not",t=>`!${t}`))},Ts=e=>{e.compute(K(e.inputs[0],"Neg",t=>`-${t}`))},zs=e=>{e.compute(K(e.inputs[0],"Reciprocal",t=>`1.0/${t}`))},Es=e=>{let t=de(e.inputs[0].dataType);e.compute(K(e.inputs[0],"Relu",i=>`select(vec4<${t}>(0.0), ${i}, ${i} > vec4<${t}>(0.0))`))},Cs=e=>{e.compute(K(e.inputs[0],"Sigmoid",t=>`(1.0 / (1.0 + exp(-${t})))`))},Os=e=>Q(e),As=(e,t)=>{let i=de(e.inputs[0].dataType);e.compute(K(e.inputs[0],"HardSigmoid",r=>`max(vec4<${i}>(0.0), min(vec4<${i}>(1.0), ${t.alpha} * ${r} + vec4<${i}>(${t.beta})))`,void 0,t.cacheKey))},Bs=e=>{e.compute(K(e.inputs[0],"Sin","sin"))},Rs=e=>{e.compute(K(e.inputs[0],"Sinh","sinh"))},Ds=e=>{e.compute(K(e.inputs[0],"Sqrt","sqrt"))},Ms=e=>{e.compute(K(e.inputs[0],"Tan","tan"))},Hi=e=>`sign(${e}) * (1 - exp(-2 * abs(${e}))) / (1 + exp(-2 * abs(${e})))`,Us=e=>{e.compute(K(e.inputs[0],"Tanh",Hi))},Fi=(e="f32")=>`
const fast_gelu_a: ${e} = 0.5;
const fast_gelu_b: ${e} = 0.7978845608028654;
const fast_gelu_c: ${e} = 0.035677408136300125;

fn tanh_v(v: vec4<${e}>) -> vec4<${e}> {
return ${Hi("v")};
}
`,ji=e=>`(fast_gelu_a + fast_gelu_a * tanh_v(${e} * (fast_gelu_c * ${e} * ${e} + fast_gelu_b))) * ${e}`,Ps=e=>{let t=de(e.inputs[0].dataType);e.compute(K(e.inputs[0],"FastGelu",ji,Fi(t),void 0,e.inputs[0].dataType))},qs=(e,t)=>{let i=de(e.inputs[0].dataType);return e.compute(K(e.inputs[0],"ThresholdedRelu",r=>`select(vec4<${i}>(0.0), ${r}, ${r} > thresholded_relu_alpha_)`,`const thresholded_relu_alpha_ = vec4<${i}>(${t.alpha});`,t.cacheKey)),0},Ns=e=>{e.compute(K(e.inputs[0],"Log","log"))},Vs=(e,t)=>`
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
`,Ls=e=>`quick_gelu_impl(${e})`,Ws=(e,t)=>{let i=de(e.inputs[0].dataType);e.compute(K(e.inputs[0],"QuickGelu",Ls,Vs(i,t.alpha),t.cacheKey,e.inputs[0].dataType))}}),Gs,Hs,Fs,Sp=T(()=>{W(),G(),Ki(),Gs=e=>{if(e[0].dims.length!==3)throw new Error("input should have 3 dimensions");if(![2560,5120,10240].includes(e[0].dims[2]))throw new Error("hidden state should be 2560, 5120 or 10240");if(e[1].dims.length!==1)throw new Error("bias is expected to have 1 dimensions");if(e[0].dims[2]!==e[1].dims[0])throw new Error("last dimension of input and bias are not the same")},Hs=e=>{let t=e[0].dims.slice();t[2]=t[2]/2;let i=S("input",e[0].dataType,e[0].dims,4),r=S("bias",e[0].dataType,[e[0].dims[2]],4),a=B("output",e[0].dataType,t,4),n=k.size(t)/4,s=se(e[0].dataType);return{name:"BiasSplitGelu",getRunData:()=>({outputs:[{dims:t,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)}}),getShaderSource:o=>`
const M_SQRT2 = sqrt(2.0);
const halfChannels = ${e[0].dims[2]/4/2}u;

${o.declareVariables(i,r,a)}

${Wt(s)}

${o.mainStart()}
${o.guardAgainstOutOfBoundsWorkgroupSizes(n)}
let biasIdx = global_idx % halfChannels;
let batchIndex = global_idx / halfChannels;
let inputOffset = biasIdx + batchIndex * halfChannels * 2;
let valueLeft = input[inputOffset] + bias[biasIdx];
let valueRight = input[inputOffset + halfChannels] + bias[biasIdx + halfChannels];
let geluRight = valueRight * 0.5 * (erf_vf32(valueRight / M_SQRT2) + 1);

${a.setByOffset("global_idx","valueLeft * geluRight")}
}`}},Fs=e=>{Gs(e.inputs),e.compute(Hs(e.inputs))}}),js,Ks,Re,Zs,Qs,Xs,Ys,Js,eo,to,io,ro,ao,Ip=T(()=>{N(),W(),G(),js=(e,t,i,r,a,n,s,o,u,l,d,p)=>{let c,h;typeof o=="string"?c=h=(m,w)=>`${o}((${m}),(${w}))`:typeof o=="function"?c=h=o:(c=o.scalar,h=o.vector);let f=B("outputData",d,r.length,4),g=S("aData",u,t.length,4),y=S("bData",l,i.length,4),_;if(a)if(n){let m=k.size(t)===1,w=k.size(i)===1,$=t.length>0&&t[t.length-1]%4===0,b=i.length>0&&i[i.length-1]%4===0;m||w?_=f.setByOffset("global_idx",h(m?`${g.type.value}(${g.getByOffset("0")}.x)`:g.getByOffset("global_idx"),w?`${y.type.value}(${y.getByOffset("0")}.x)`:y.getByOffset("global_idx"))):_=`
 let outputIndices = ${f.offsetToIndices("global_idx * 4u")};
 let offsetA = ${g.broadcastedIndicesToOffset("outputIndices",f)};
 let offsetB = ${y.broadcastedIndicesToOffset("outputIndices",f)};
 ${f.setByOffset("global_idx",h(s||$?g.getByOffset("offsetA / 4u"):`${g.type.value}(${g.getByOffset("offsetA / 4u")}[offsetA % 4u])`,s||b?y.getByOffset("offsetB / 4u"):`${y.type.value}(${y.getByOffset("offsetB / 4u")}[offsetB % 4u])`))}
`}else _=f.setByOffset("global_idx",h(g.getByOffset("global_idx"),y.getByOffset("global_idx")));else{if(!n)throw new Error("no necessary to use scalar implementation for element-wise binary op implementation.");let m=(w,$,b="")=>{let x=`aData[indexA${$}][componentA${$}]`,v=`bData[indexB${$}][componentB${$}]`;return`
 let outputIndices${$} = ${f.offsetToIndices(`global_idx * 4u + ${$}u`)};
 let offsetA${$} = ${g.broadcastedIndicesToOffset(`outputIndices${$}`,f)};
 let offsetB${$} = ${y.broadcastedIndicesToOffset(`outputIndices${$}`,f)};
 let indexA${$} = offsetA${$} / 4u;
 let indexB${$} = offsetB${$} / 4u;
 let componentA${$} = offsetA${$} % 4u;
 let componentB${$} = offsetB${$} % 4u;
 ${w}[${$}] = ${b}(${c(x,v)});
`};d===9?_=`
 var data = vec4<u32>(0);
 ${m("data",0,"u32")}
 ${m("data",1,"u32")}
 ${m("data",2,"u32")}
 ${m("data",3,"u32")}
 outputData[global_idx] = dot(vec4<u32>(0x1, 0x100, 0x10000, 0x1000000), vec4<u32>(data));`:_=`
 ${m("outputData[global_idx]",0)}
 ${m("outputData[global_idx]",1)}
 ${m("outputData[global_idx]",2)}
 ${m("outputData[global_idx]",3)}
`}return`
${e.registerUniform("vec_size","u32").declareVariables(g,y,f)}

${p??""}

${e.mainStart()}
${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
${_}
}`},Ks=(e,t,i,r,a,n,s=i.dataType)=>{let o=i.dims.map(g=>Number(g)??1),u=r.dims.map(g=>Number(g)??1),l=!k.areEqual(o,u),d=o,p=k.size(o),c=!1,h=!1,f=[l];if(l){let g=nt.calcShape(o,u,!1);if(!g)throw new Error("Can't perform binary op on the given tensors");d=g.slice(),p=k.size(d);let y=k.size(o)===1,_=k.size(u)===1,m=o.length>0&&o[o.length-1]%4===0,w=u.length>0&&u[u.length-1]%4===0;f.push(y),f.push(_),f.push(m),f.push(w);let $=1;for(let b=1;b<d.length;b++){let x=o[o.length-b],v=u[u.length-b];if(x===v)$*=x;else break}$%4===0?(h=!0,c=!0):(y||_||m||w)&&(c=!0)}else c=!0;return f.push(c),{name:e,shaderCache:{hint:t+f.map(g=>g.toString()).join("_"),inputDependencies:["rank","rank"]},getShaderSource:g=>js(g,o,u,d,c,l,h,a,i.dataType,r.dataType,s,n),getRunData:()=>({outputs:[{dims:d,dataType:s}],dispatchGroup:{x:Math.ceil(p/64/4)},programUniforms:[{type:12,data:Math.ceil(k.size(d)/4)},...M(o,u,d)]})}},Re=(e,t,i,r,a,n)=>{e.compute(Ks(t,a??"",e.inputs[0],e.inputs[1],i,r,n))},Zs=e=>{Re(e,"Add",(t,i)=>`${t}+${i}`)},Qs=e=>{Re(e,"Div",(t,i)=>`${t}/${i}`)},Xs=e=>{Re(e,"Equal",{scalar:(t,i)=>`u32(${t}==${i})`,vector:(t,i)=>`vec4<u32>(${t}==${i})`},void 0,void 0,9)},Ys=e=>{Re(e,"Mul",(t,i)=>`${t}*${i}`)},Js=e=>{let t=S("input",e.inputs[0].dataType,e.inputs[0].dims).type.value;Re(e,"Pow",{scalar:(i,r)=>`pow_custom(${i},${r})`,vector:(i,r)=>`pow_vector_custom(${i},${r})`},`
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
`)},eo=e=>{Re(e,"Sub",(t,i)=>`${t}-${i}`)},to=e=>{Re(e,"Greater",{scalar:(t,i)=>`u32(${t}>${i})`,vector:(t,i)=>`vec4<u32>(${t}>${i})`},void 0,void 0,9)},io=e=>{Re(e,"Less",{scalar:(t,i)=>`u32(${t}<${i})`,vector:(t,i)=>`vec4<u32>(${t}<${i})`},void 0,void 0,9)},ro=e=>{Re(e,"GreaterOrEqual",{scalar:(t,i)=>`u32(${t}>=${i})`,vector:(t,i)=>`vec4<u32>(${t}>=${i})`},void 0,void 0,9)},ao=e=>{Re(e,"LessOrEqual",{scalar:(t,i)=>`u32(${t}<=${i})`,vector:(t,i)=>`vec4<u32>(${t}<=${i})`},void 0,void 0,9)}}),no,so,oo,uo,lo,po,Tp=T(()=>{N(),W(),re(),G(),no=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");let i=0,r=e[i],a=r.dataType,n=r.dims.length;e.forEach((s,o)=>{if(o!==i){if(s.dataType!==a)throw new Error("input tensors should be one type");if(s.dims.length!==n)throw new Error("input tensors should have the same shape");s.dims.forEach((u,l)=>{if(l!==t&&u!==r.dims[l])throw new Error("non concat dimensions must match")})}})},so=(e,t)=>`
fn calculateInputIndex(index: u32) -> u32 {
let sizeInConcatAxis = array<u32, ${e}u>(${t});
for (var i: u32 = 0u; i < ${e}; i += 1u ) {
if (index < sizeInConcatAxis[i]) {
return i;
}
}
return ${e}u;
}`,oo=(e,t)=>{let i=e.length,r=[];for(let a=0;a<i;++a){let n=t.setByOffset("global_idx",e[a].getByIndices("indices"));i===1?r.push(n):a===0?r.push(`if (inputIndex == ${a}u) { ${n} }`):a===i-1?r.push(`else { ${n} }`):r.push(`else if (inputIndex == ${a}) { ${n} }`)}return r.join(`
`)},uo=(e,t,i,r)=>{let a=k.size(i),n=new Array(e.length),s=new Array(e.length),o=0,u=[],l=[],d=[{type:12,data:a}];for(let g=0;g<e.length;++g)o+=e[g].dims[t],n[g]=o,l.push(e[g].dims.length),s[g]=S(`input${g}`,r,l[g]),u.push("rank"),d.push({type:12,data:n[g]});for(let g=0;g<e.length;++g)d.push(...M(e[g].dims));d.push(...M(i));let p=B("output",r,i.length),c=p.indicesGet("indices",t),h=Array.from(Array(n.length).keys()).map(g=>`uniforms.sizeInConcatAxis${g}`).join(","),f=g=>`

${(()=>{g.registerUniform("outputSize","u32");for(let y=0;y<e.length;y++)g.registerUniform(`sizeInConcatAxis${y}`,"u32");return g.declareVariables(...s,p)})()}

${so(n.length,h)}

${g.mainStart()}
${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

var indices = ${p.offsetToIndices("global_idx")};

let inputIndex = calculateInputIndex(${c});
if (inputIndex != 0u) {
let sizeInConcatAxis = array<u32, ${n.length}u>(${h});
${c} -= sizeInConcatAxis[inputIndex - 1u];
}

${oo(s,p)}
}`;return{name:"Concat",shaderCache:{hint:`${t}`,inputDependencies:u},getRunData:()=>({outputs:[{dims:i,dataType:r}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:d}),getShaderSource:f}},lo=(e,t)=>{let i=e.inputs,r=i[0].dims,a=k.normalizeAxis(t.axis,r.length);no(i,a);let n=r.slice();n[a]=i.reduce((o,u)=>o+(u.dims.length>a?u.dims[a]:0),0);let s=i.filter(o=>k.size(o.dims)>0);e.compute(uo(s,a,n,i[0].dataType),{inputs:s})},po=e=>Q({axis:e.axis})}),Qe,Xe,Ye,Zi,Je=T(()=>{N(),W(),Qe=(e,t,i="f32")=>{switch(e.activation){case"Relu":return`value = max(value, ${t}(0.0));`;case"Sigmoid":return`value = (${t}(1.0) / (${t}(1.0) + exp(-value)));`;case"Clip":return`value = clamp(value, ${t}(${i}(uniforms.clip_min)), ${t}(${i}(uniforms.clip_max)));`;case"HardSigmoid":return`value = max(${t}(0.0), min(${t}(1.0), ${i}(uniforms.alpha) * value + ${i}(uniforms.beta)));`;case"LeakyRelu":return`value = select(${i}(uniforms.alpha) * value, value, value >= ${t}(0.0));`;case"Tanh":return`let e2x = exp(-2.0 * abs(value));
   value = sign(value) * (1.0 - e2x) / (1.0 + e2x);
`;case"":return"";default:throw new Error(`Unsupported activation ${e.activation}`)}},Xe=(e,t)=>{e.activation==="Clip"?t.push({type:1,data:e.clipMax},{type:1,data:e.clipMin}):e.activation==="HardSigmoid"?t.push({type:1,data:e.alpha},{type:1,data:e.beta}):e.activation==="LeakyRelu"&&t.push({type:1,data:e.alpha})},Ye=(e,t)=>{e.activation==="Clip"?t.push({name:"clip_max",type:"f32"},{name:"clip_min",type:"f32"}):e.activation==="HardSigmoid"?t.push({name:"alpha",type:"f32"},{name:"beta",type:"f32"}):e.activation==="LeakyRelu"&&t.push({name:"alpha",type:"f32"})},Zi=e=>{let t=e?.activation||"";if(t==="HardSigmoid"){let[i,r]=e?.activation_params||[.2,.5];return{activation:t,alpha:i,beta:r}}else if(t==="Clip"){let[i,r]=e?.activation_params||[Aa,Ba];return{activation:t,clipMax:r,clipMin:i}}else if(t==="LeakyRelu"){let[i]=e?.activation_params||[.01];return{activation:t,alpha:i}}return{activation:t}}}),oe,co,Qi=T(()=>{oe=(e,t)=>{switch(e){case 1:return t;case 2:return`vec2<${t}>`;case 3:return`vec3<${t}>`;case 4:return`vec4<${t}>`;default:throw new Error(`${e}-component is not supported.`)}},co=e=>`
${e?"value = value + getBiasByOutputCoords(coords);":""}
`}),ho,zp=T(()=>{ho=e=>`
fn getIndexFromCoords4D(coords : vec4<i32>, shape : vec4<i32>) -> i32 {
return dot(coords, vec4<i32>(
shape.y * shape.z * shape.w, shape.z * shape.w, shape.w, 1));
}
fn getOutputIndexFromCoords(coords : vec4<i32>) -> i32 {
return dot(coords, vec4<i32>(
i32(${e}.x), i32(${e}.y), i32(${e}.z), 1));
}
`}),yt,Xi,Yi=T(()=>{N(),W(),G(),Je(),yt=(e,t,i,r,a)=>{let n=r-i;return`
${Array.from({length:i}).map((s,o)=>`
if (${R(t.shape,o,t.rank)} != 1) {
${t.indicesSet(e,o,R(a,o+n,r))}
} else {
${t.indicesSet(e,o,0)}
}`).join("")}
`},Xi=(e,t,i,r,a=!1,n)=>{let s=e[0].dims,o=e[1].dims,u=s[s.length-2],l=o[o.length-1],d=s[s.length-1],p=ie(l),c=ie(d),h=ie(u),f=k.size(i)/p/h,g=e.length>2,y=r?r.slice(0,-2):i.slice(0,-2),_=[k.size(y),u,l],m=[{type:12,data:f},{type:12,data:u},{type:12,data:l},{type:12,data:d}];Xe(t,m),m.push(...M(y,s,o)),g&&m.push(...M(e[2].dims)),m.push(...M(_));let w=$=>{let b=Pi("batch_dims",e[0].dataType,y.length),x=S("a",e[0].dataType,s.length,c),v=S("b",e[1].dataType,o.length,p),I=B("output",e[0].dataType,_.length,p),z=se(I.type.tensor),O=Qe(t,I.type.value,z),V=[x,v],U="";if(g){let F=a?p:1;V.push(S("bias",e[2].dataType,e[2].dims.length,F)),U=`${a?`value += bias[col / ${F}];`:`value += ${I.type.value}(bias[row + i]);`}`}let L=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"}];Ye(t,L);let A=()=>{let F=`var a_data: ${x.type.value};`;for(let q=0;q<c;q++)F+=`
   let b_data${q} = b[(b_offset + (k + ${q}) * uniforms.N + col) / ${p}];`;for(let q=0;q<h;q++){F+=`a_data = a[(a_offset + (row + ${q}) * uniforms.K + k) / ${c}];`;for(let D=0;D<c;D++)F+=`
 values[${q}] = fma(${v.type.value}(a_data${c===1?"":`[${D}]`}), b_data${D}, values[${q}]);
`}return F};return`
${$.registerUniforms(L).registerInternalVariables(b).declareVariables(...V,I)}
${$.mainStart()}
${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let col = (global_idx % (uniforms.N / ${p})) * ${p};
var index1 = global_idx / (uniforms.N / ${p});
let stride1 = uniforms.M / ${h};
let row = (index1 % stride1) * ${h};
let batch = index1 / stride1;

${i.length===2?"":`let batch_indices = ${b.offsetToIndices("batch")};`}

var a_indices: ${x.type.indices};
${yt("a_indices",x,x.rank-2,b.rank,"batch_indices")}
${x.indicesSet("a_indices",x.rank-2,0)}
${x.indicesSet("a_indices",x.rank-1,0)}
let a_offset = ${x.indicesToOffset("a_indices")};

var b_indices: ${v.type.indices};
${yt("b_indices",v,v.rank-2,b.rank,"batch_indices")}
${v.indicesSet("b_indices",v.rank-2,0)}
${v.indicesSet("b_indices",v.rank-1,0)}
let b_offset = ${v.indicesToOffset("b_indices")};
var values: array<${I.type.value}, ${h}>;
for (var k: u32 = 0u; k < uniforms.K; k = k + ${c}) {
${A()}
}
for (var i = 0u; i < ${h}u; i++) {
var value = values[i];
${U}
${O}
let cur_indices = ${I.type.indices}(batch, row + i, col);
let offset = ${I.indicesToOffset("cur_indices")};
${I.setByOffset(`offset / ${p}`,"value")};
}
}
`};return{name:"MatMulNaive",shaderCache:{hint:`${t.activation};${p};${c};${h};${a}`,inputDependencies:g?["rank","rank","rank"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:n?n(i):i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(f/64)},programUniforms:m}),getShaderSource:w}}}),fo,mo,Ji,er,go,tr,_o,Gt,ir=T(()=>{N(),W(),G(),Je(),Yi(),Qi(),fo=(e,t)=>e?`
mm_Asub[inputRow][inputCol] = mm_readA(batch,
kStart + inputRow,
globalRowStart / innerElementSize + inputCol${t?", batchIndices":""});
`:`
mm_Asub[inputRow][inputCol] = mm_readA(batch,
globalRow + innerRow,
kStart / innerElementSize + inputCol${t?", batchIndices":""});
`,mo=(e,t)=>e?`
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
}`,Ji=(e,t,i="f32",r,a=!1,n=32,s=!1,o=32)=>{let u=t[1]*e[1],l=t[0]*e[0],d=a?u:n,p=a?n:u,c=d/t[0],h=n/t[1];if(!((a&&c===4&&e[1]===4||!a&&(c===3||c===4))&&d%t[0]===0&&n%t[1]===0&&e[0]===4))throw new Error(`If transposeA ${a} is true, innerElementSize ${c} and workPerThread[1] ${e[1]} must be 4.
Otherwise, innerElementSize ${c} must be 3 or 4.
tileAWidth ${d} must be divisible by workgroupSize[0]${t[0]}. tileInner ${n} must be divisible by workgroupSize[1] ${t[1]}. colPerThread ${e[0]} must be 4.`);return`
var<workgroup> mm_Asub: array<array<vec${c}<${i}>, ${d/c}>, ${p}>;
var<workgroup> mm_Bsub: array<array<vec4<${i}>, ${l/e[0]}>, ${n}>;

const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const innerElementSize = ${c};
const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
@builtin(global_invocation_id) globalId : vec3<u32>,
@builtin(workgroup_id) workgroupId : vec3<u32>) {
let localRow = i32(localId.y);
let tileRow = localRow * rowPerThread;
let tileCol = i32(localId.x);

let globalRow =i32(globalId.y) * rowPerThread;
let globalCol = i32(globalId.x);
let batch = ${s?"0":"i32(globalId.z)"};
${r?`let batchIndices = ${r.offsetToIndices("u32(batch)")};`:""}
let globalRowStart = i32(workgroupId.y) * ${u};

let num_tiles = ${s?`${Math.ceil(o/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

var acc: array<vec4<${i}>, rowPerThread>;

// Loop over shared dimension.
let tileRowB = localRow * ${h};
for (var t = 0; t < num_tiles; t = t + 1) {
// Load one tile of A into local memory.
for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
let inputRow = tileRow + innerRow;
let inputCol = tileCol;
${fo(a,r)}
}

// Load one tile of B into local memory.
for (var innerRow = 0; innerRow < ${h}; innerRow = innerRow + 1) {
let inputRow = tileRowB + innerRow;
let inputCol = tileCol;
mm_Bsub[inputRow][inputCol] = mm_readB(batch, kStart + inputRow, globalCol${r?", batchIndices":""});
}
kStart = kStart + tileInner;
workgroupBarrier();

// Compute acc values for a single thread.
for (var k = 0; k < tileInner / innerElementSize; k = k + 1) {
let BCached0 = mm_Bsub[k * innerElementSize][tileCol];
let BCached1 = mm_Bsub[k * innerElementSize + 1][tileCol];
let BCached2 = mm_Bsub[k * innerElementSize + 2][tileCol];
${c===3?"":"let BCached3 = mm_Bsub[k * innerElementSize + 3][tileCol];"}

${mo(a,c)}
}

workgroupBarrier();
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
mm_write(batch, globalRow + innerRow, globalCol, acc[innerRow]);
}
}`},er=(e,t)=>e?`
 mm_Asub[inputRow][inputCol] = mm_readA(batch,
   kStart + inputRow,
   globalRowStart + inputCol${t?", batchIndices":""});
 `:`
 mm_Asub[inputRow][inputCol] = mm_readA(batch,
   globalRowStart + inputRow,
   kStart + inputCol${t?", batchIndices":""});
 `,go=e=>e?"let ACached = mm_Asub[k][tileRow + innerRow];":"let ACached = mm_Asub[tileRow + innerRow][k];",tr=(e,t,i="f32",r,a=!1,n=32,s=!1,o=32,u=!1)=>{let l=e[1]*t[1],d=e[0]*t[0],p=a?l:n,c=a?n:l;if(!(c%t[1]===0&&p%t[0]===0&&n%t[1]===0))throw new Error(`tileAHight ${c} must be divisible by workgroupSize[1]${t[1]}, tileAWidth ${p} must be divisible by workgroupSize[0]${t[0]}, tileInner ${n} must be divisible by workgroupSize[1]${t[1]}`);let h=c/t[1],f=p/t[0],g=n/t[1],y=u?`
let localRow = i32(localId.y);
let localCol = i32(localId.x);
let globalRowStart = i32(workgroupId.y) * ${l};
let globalColStart = i32(workgroupId.x) * ${d};

// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
// Load one tile of A into local memory.
for (var inputRow = localRow; inputRow < ${c}; inputRow = inputRow + ${t[1]}) {
for (var inputCol = localCol; inputCol < ${p}; inputCol = inputCol + ${t[0]}) {
${er(a,r)}
}
}
// Load one tile of B into local memory.
for (var inputRow = localRow; inputRow < ${n}; inputRow = inputRow + ${t[1]}) {
 for (var inputCol = localCol; inputCol < ${d}; inputCol = inputCol + ${t[0]}) {
mm_Bsub[inputRow][inputCol] = mm_readB(batch,
 kStart + inputRow,
 globalColStart + inputCol${r?", batchIndices":""});
}
}
kStart = kStart + tileInner;
workgroupBarrier();

// Compute acc values for a single thread.
var BCached : array<${i}, colPerThread>;
for (var k = 0; k < tileInner; k = k + 1) {
for (var inner = 0; inner < colPerThread; inner = inner + 1) {
BCached[inner] = mm_Bsub[k][localCol + inner * ${t[0]}];
}
for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
let ACached = ${a?`mm_Asub[k][localRow + innerRow * ${t[1]}];`:`mm_Asub[localRow + innerRow * ${t[1]}][k];`}
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

let tileRowA = i32(localId.y) * ${h};
let tileColA = i32(localId.x) * ${f};
let tileRowB = i32(localId.y) * ${g};
// Loop over shared dimension.
for (var t = 0; t < num_tiles; t = t + 1) {
// Load one tile of A into local memory.
for (var innerRow = 0; innerRow < ${h}; innerRow = innerRow + 1) {
for (var innerCol = 0; innerCol < ${f}; innerCol = innerCol + 1) {
let inputRow = tileRowA + innerRow;
let inputCol = tileColA + innerCol;
${er(a,r)}
}
}

// Load one tile of B into local memory.
for (var innerRow = 0; innerRow < ${g}; innerRow = innerRow + 1) {
for (var innerCol = 0; innerCol < colPerThread; innerCol = innerCol + 1) {
let inputRow = tileRowB + innerRow;
let inputCol = tileCol + innerCol;
mm_Bsub[inputRow][inputCol] = mm_readB(batch,
kStart + inputRow,
globalCol + innerCol${r?", batchIndices":""});
}
}
kStart = kStart + tileInner;
workgroupBarrier();

// Compute acc values for a single thread.
var BCached : array<${i}, colPerThread>;
for (var k = 0; k < tileInner; k = k + 1) {
for (var inner = 0; inner < colPerThread; inner = inner + 1) {
BCached[inner] = mm_Bsub[k][tileCol + inner];
}

for (var innerRow = 0; innerRow < rowPerThread; innerRow = innerRow + 1) {
${go(a)}
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
var<workgroup> mm_Asub : array<array<${i}, ${p}>, ${c}>;
var<workgroup> mm_Bsub : array<array<${i}, ${d}>, ${n}>;
const rowPerThread = ${e[1]};
const colPerThread = ${e[0]};
const tileInner = ${n};

@compute @workgroup_size(${t[0]}, ${t[1]}, ${t[2]})
fn main(@builtin(local_invocation_id) localId : vec3<u32>,
@builtin(global_invocation_id) globalId : vec3<u32>,
@builtin(workgroup_id) workgroupId : vec3<u32>) {
let batch = ${s?"0":"i32(globalId.z)"};
${r?`let batchIndices = ${r.offsetToIndices("u32(batch)")};`:""}
let num_tiles = ${s?`${Math.ceil(o/n)}`:"(uniforms.dim_inner - 1) / tileInner + 1"};
var kStart = ${s?`i32(globalId.z) * ${o}`:"0"};

var acc : array<array<${i}, colPerThread>, rowPerThread>;
${y}
}
`},_o=(e,t,i,r,a=!1)=>{let[n,s,o,u]=r,l=se(r[0].type.tensor);return`
fn mm_readA(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${oe(e,l)} {
var value = ${oe(e,l)}(0.0);
let col = colIn * ${e};
if(row < uniforms.dim_a_outer && col < uniforms.dim_inner)
{
var aIndices: ${s.type.indices};
${yt("aIndices",s,s.rank-2,n.rank,"batchIndices")}
${s.indicesSet("aIndices",s.rank-2,"u32(row)")}
${s.indicesSet("aIndices",s.rank-1,"u32(colIn)")}
value = ${s.getByIndices("aIndices")};
}
return value;
}

fn mm_readB(batch: i32, row: i32, colIn: i32, batchIndices: ${n.type.indices}) -> ${oe(e,l)} {
var value = ${oe(e,l)}(0.0);
let col = colIn * ${e};
if(row < uniforms.dim_inner && col < uniforms.dim_b_outer)
{
var bIndices: ${o.type.indices};
${yt("bIndices",o,o.rank-2,n.rank,"batchIndices")}
${o.indicesSet("bIndices",o.rank-2,"u32(row)")}
${o.indicesSet("bIndices",o.rank-1,"u32(colIn)")}
value = ${o.getByIndices("bIndices")};
}
return value;
}

fn mm_write(batch: i32, row: i32, colIn: i32, valueIn: ${oe(e,l)}) {
let col = colIn * ${e};
if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer) {
var value = valueIn;
let coords = vec3<i32>(batch, row, colIn);
${t?`value = value + ${a?"bias[colIn]":`${oe(e,l)}(bias[row])`};`:""}
${i}
${u.setByIndices("vec3<u32>(coords)","value")}
}
}
`},Gt=(e,t,i,r,a=!1,n)=>{let s=e[0].dims,o=e[1].dims,u=s.slice(0,-2),l=o.slice(0,-2),d=r?r.slice(0,-2):i.slice(0,-2),p=k.size(d),c=s[s.length-2],h=s[s.length-1],f=o[o.length-1],g=h%4===0&&f%4===0,y=c<=8?[4,1,1]:[4,4,1],_=[8,8,1],m=[Math.ceil(f/_[0]/y[0]),Math.ceil(c/_[1]/y[1]),Math.ceil(p/_[2]/y[2])],w=g?4:1,$=[...u,c,h/w],b=$.length,x=[...l,h,f/w],v=x.length,I=[p,c,f/w],z=[{type:6,data:c},{type:6,data:f},{type:6,data:h}];Xe(t,z),z.push(...M(d,$,x));let O=["rank","rank"],V=e.length>2;V&&(z.push(...M(e[2].dims)),O.push("rank")),z.push(...M(I));let U=L=>{let A=d.length,F=Pi("batchDims",e[0].dataType,A,1),q=se(e[0].dataType),D=S("a",e[0].dataType,b,w),Z=S("b",e[1].dataType,v,w),P=B("result",e[0].dataType,I.length,w),te=[D,Z];if(V){let ue=a?w:1;te.push(S("bias",e[2].dataType,e[2].dims.length,ue))}let E=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"}];Ye(t,E);let C=se(P.type.tensor),H=Qe(t,P.type.value,C),Y=_o(w,V,H,[F,D,Z,P],a);return`
${L.registerUniforms(E).registerInternalVariables(F).declareVariables(...te,P)}
${Y}
${g?Ji(y,_,q,F):tr(y,_,q,F)}
        `};return{name:"MatMul",shaderCache:{hint:`${y};${t.activation};${g};${a}`,inputDependencies:O},getRunData:()=>({outputs:[{dims:n?n(i):i,dataType:e[0].dataType}],dispatchGroup:{x:m[0],y:m[1],z:m[2]},programUniforms:z}),getShaderSource:U}}}),yo,$o,Ep=T(()=>{N(),qe(),G(),Je(),Qi(),zp(),ir(),yo=(e,t,i,r,a=!1,n,s=4,o=4,u=4,l="f32")=>{let d=z=>{switch(z){case 1:return"resData = x[xIndex];";case 3:return`resData = vec3<${l}>(x[xIndex], x[xIndex + 1], x[xIndex + 2]);`;case 4:return"resData = x[xIndex / 4];";default:throw new Error(`innerElementSize ${z} is not supported.`)}},p=z=>{switch(z){case 1:return"return w[row * i32(uniforms.w_shape[3]) + colIn];";case 4:return"return w[row * i32(uniforms.w_shape[3]) / 4 + colIn];";default:throw new Error(`innerElementSize ${z} is not supported.`)}},c=e?`
let coord = vec4<i32>(batch, xRow, xCol, xCh);
`:`
let coord = vec4<i32>(batch, xCh, xRow, xCol);
`,h=e?`
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
`,f=e?"i32(uniforms.x_shape[1])":"i32(uniforms.x_shape[2])",g=e?"i32(uniforms.x_shape[2])":"i32(uniforms.x_shape[3])",y=e?"row":"col",_=e?"col":"row",m=`
let inChannels = i32(uniforms.w_shape[2]);
let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
let outRow = ${y} / outWidth;
let outCol = ${y} % outWidth;

let WRow = ${_} / (i32(uniforms.w_shape[1]) * inChannels);
let WCol = ${_} / inChannels % i32(uniforms.w_shape[1]);
let xRow = outRow * uniforms.stride[0] + uniforms.dilation[0] * WRow - uniforms.pad[0];
let xCol = outCol * uniforms.stride[1] + uniforms.dilation[1] * WCol - uniforms.pad[1];
let xCh = ${_} % inChannels;
var resData = ${oe(s,l)}(0.0);
// The bounds checking is always needed since we use it to pad zero for
// the 'same' padding type.
if (xRow >= 0 && xRow < ${f} && xCol >= 0 && xCol < ${g}) {
${c}
let xIndex = getIndexFromCoords4D(coord, vec4<i32>(uniforms.x_shape));
${d(s)}
}
return resData;`,w=e?t&&r?`
let col = colIn * ${s};
${m}`:`
let col = colIn * ${s};
if (row < uniforms.dim_a_outer && col < uniforms.dim_inner) {
${m}
}
return ${oe(s,l)}(0.0);`:r&&i?`
let col = colIn * ${s};
${m}`:`
let col = colIn * ${s};
if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
${m}
}
return ${oe(s,l)}(0.0);`,$=e?r&&i?p(o):`
let col = colIn * ${o};
if (row < uniforms.dim_inner && col < uniforms.dim_b_outer) {
${p(o)}
}
return ${oe(o,l)}(0.0);`:`
let col = colIn * ${o};
if (row < uniforms.dim_inner && col < uniforms.dim_a_outer) {
${p(o)}
}
return ${oe(o,l)}(0.0);`,b=oe(u,l),x=oe(e?s:o,l),v=oe(e?o:s,l),I=Qe(n,b,l);return`
fn mm_readA(batch: i32, row : i32, colIn : i32) -> ${x} {
${e?w:$}
}

fn mm_readB(batch: i32, row : i32, colIn : i32) -> ${v} {
${e?$:w}
}

fn mm_write(batch: i32, row : i32, colIn : i32, valueIn : ${b}) {
let col = colIn * ${u};
if (row < uniforms.dim_a_outer && col < uniforms.dim_b_outer)
{
var value = valueIn;
let outWidth = ${e?"i32(uniforms.result_shape[2])":"i32(uniforms.result_shape[3])"};
${h}
${co(a)}
${I}
setOutputAtCoords(coords[0], coords[1], coords[2], coords[3], value);
}
}`},$o=(e,t,i,r,a,n,s,o,u)=>{let l=t.format==="NHWC",d=l?e[0].dims[3]:e[0].dims[1],p=i[0],c=l?i[2]:i[3],h=l?i[1]:i[2],f=l?i[3]:i[1],g=l&&(d%4===0||d%3===0)&&f%4===0,y=l?f:c*h,_=l?c*h:f,m=[8,8,1],w=r<=8?[4,1,1]:[4,4,1],$=[Math.ceil(y/m[0]/w[0]),Math.ceil(_/m[1]/w[1]),Math.ceil(p/m[2]/w[2])];j("verbose",()=>`[conv2d_mm_webgpu] dispatch = ${$}`);let b=g?l&&d%4!==0?3:4:1,x=m[1]*w[1],v=m[0]*w[0],I=Math.max(m[0]*b,m[1]),z=r%x===0,O=a%v===0,V=n%I===0,U=g?[b,4,4]:[1,1,1],L=[{type:6,data:r},{type:6,data:a},{type:6,data:n},{type:6,data:[t.pads[0],t.pads[1]]},{type:6,data:t.strides},{type:6,data:t.dilations}];Xe(t,L),L.push(...M(e[0].dims,e[1].dims));let A=["rank","rank"];s&&(L.push(...M(e[2].dims)),A.push("rank")),L.push(...M(i));let F=q=>{let D=[{name:"dim_a_outer",type:"i32"},{name:"dim_b_outer",type:"i32"},{name:"dim_inner",type:"i32"},{name:"pad",type:"i32",length:2},{name:"stride",type:"i32",length:2},{name:"dilation",type:"i32",length:2}];Ye(t,D);let Z=g?4:1,P=se(e[0].dataType),te=`
fn setOutputAtIndex(flatIndex : i32, value : ${g?`vec4<${P}>`:P}) {
result[flatIndex] = ${g?`vec4<${P}>`:P}(value);
}
fn setOutputAtCoords(d0 : i32, d1 : i32, d2 : i32, d3 : i32, value : ${g?`vec4<${P}>`:P}) {
let flatIndex = getOutputIndexFromCoords(vec4<i32>(d0, d1, d2, d3));
setOutputAtIndex(flatIndex ${g?"/ 4":""}, value);
}`,E=S("x",e[0].dataType,e[0].dims.length,b===3?1:b),C=S("w",e[1].dataType,e[1].dims.length,Z),H=[E,C],Y=B("result",e[0].dataType,i.length,Z);if(s){let ue=S("bias",e[2].dataType,e[2].dims.length,Z);H.push(ue),te+=`
fn getBiasByOutputCoords(coords : vec4<i32>) -> ${g?`vec4<${P}>`:P} {
return bias[coords.${l?"w":"y"}${g?"/ 4":""}];
}`}return`
${ho("uniforms.result_strides")}
//struct Uniforms { xShape : vec4<i32>, wShape : vec4<i32>, outShape : vec4<i32>,
//  outShapeStrides: vec3<i32>, filterDims : vec2<i32>, pad : vec2<i32>, stride : vec2<i32>,
//  dilation : vec2<i32>, dimAOuter : i32, dimBOuter : i32, dimInner : i32 };
${q.registerUniforms(D).declareVariables(...H,Y)}
${te}
${yo(l,z,O,V,s,t,U[0],U[1],U[2],P)}
${g?Ji(w,m,P,void 0,!l,I):tr(w,m,P,void 0,!l,I,!1,void 0,o)}`};return{name:"Conv2DMatMul",shaderCache:{hint:`${t.cacheKey};${b};${g};${z};${O};${V};${x};${v};${I}`,inputDependencies:A},getRunData:()=>({outputs:[{dims:u?u(i):i,dataType:e[0].dataType}],dispatchGroup:{x:$[0],y:$[1],z:$[2]},programUniforms:L}),getShaderSource:F}}}),wo,rr,$t,bo,ar,vo,xo,ko,Cp=T(()=>{N(),qe(),W(),G(),Je(),Qi(),wo=e=>{let t=1;for(let i=0;i<e.length;i++)t*=e[i];return t},rr=e=>typeof e=="number"?[e,e,e]:e,$t=(e,t)=>t<=1?e:e+(e-1)*(t-1),bo=(e,t,i,r=1)=>{let a=$t(t,r);return Math.floor((e[0]*(i-1)-i+a)/2)},ar=(e,t,i,r,a)=>{a==null&&(a=bo(e,t[0],r[0]));let n=[0,0,0,i];for(let s=0;s<3;s++)e[s]+2*a>=t[s]&&(n[s]=Math.trunc((e[s]-t[s]+2*a)/r[s]+1));return n},vo=(e,t,i,r,a,n,s,o,u,l)=>{let d,p,c,h;if(e==="VALID"&&(e=0),typeof e=="number"){d={top:e,bottom:e,left:e,right:e,front:e,back:e};let f=ar([t,i,r,1],[o,u,l],1,[a,n,s],e);p=f[0],c=f[1],h=f[2]}else if(Array.isArray(e)){if(!e.every((g,y,_)=>g===_[0]))throw Error(`Unsupported padding parameter: ${e}`);d={top:e[0],bottom:e[1],left:e[2],right:e[3],front:e[4],back:e[5]};let f=ar([t,i,r,1],[o,u,l],1,[a,n,s],e[0]);p=f[0],c=f[1],h=f[2]}else if(e==="SAME_UPPER"){p=Math.ceil(t/a),c=Math.ceil(i/n),h=Math.ceil(r/s);let f=(p-1)*a+o-t,g=(c-1)*n+u-i,y=(h-1)*s+l-r,_=Math.floor(f/2),m=f-_,w=Math.floor(g/2),$=g-w,b=Math.floor(y/2),x=y-b;d={top:w,bottom:$,left:b,right:x,front:_,back:m}}else throw Error(`Unknown padding parameter: ${e}`);return{padInfo:d,outDepth:p,outHeight:c,outWidth:h}},xo=(e,t,i,r,a,n=!1,s="channelsLast")=>{let o,u,l,d,p;if(s==="channelsLast")[o,u,l,d,p]=e;else if(s==="channelsFirst")[o,p,u,l,d]=e;else throw new Error(`Unknown dataFormat ${s}`);let[c,,h,f,g]=t,[y,_,m]=rr(i),[w,$,b]=rr(r),x=$t(h,w),v=$t(f,$),I=$t(g,b),{padInfo:z,outDepth:O,outHeight:V,outWidth:U}=vo(a,u,l,d,y,_,m,x,v,I),L=n?c*p:c,A=[0,0,0,0,0];return s==="channelsFirst"?A=[o,L,O,V,U]:s==="channelsLast"&&(A=[o,O,V,U,L]),{batchSize:o,dataFormat:s,inDepth:u,inHeight:l,inWidth:d,inChannels:p,outDepth:O,outHeight:V,outWidth:U,outChannels:L,padInfo:z,strideDepth:y,strideHeight:_,strideWidth:m,filterDepth:h,filterHeight:f,filterWidth:g,effectiveFilterDepth:x,effectiveFilterHeight:v,effectiveFilterWidth:I,dilationDepth:w,dilationHeight:$,dilationWidth:b,inShape:e,outShape:A,filterShape:t}},ko=(e,t,i,r,a,n)=>{let s=n==="channelsLast";s?e[0].dims[3]:e[0].dims[1];let o=[64,1,1],u={x:i.map((y,_)=>_)},l=[Math.ceil(wo(u.x.map(y=>i[y]))/o[0]),1,1];j("verbose",()=>`[conv3d_naive_webgpu] dispatch = ${l}`);let d=1,p=k.size(i),c=[{type:12,data:p},{type:12,data:r},{type:12,data:a},{type:12,data:t.strides},{type:12,data:t.dilations}];Xe(t,c),c.push(...M(e[0].dims,e[1].dims));let h=["rank","rank"],f=e.length===3;f&&(c.push(...M(e[2].dims)),h.push("rank")),c.push(...M(i));let g=y=>{let _=[{name:"output_size",type:"u32"},{name:"filter_dims",type:"u32",length:r.length},{name:"pads",type:"u32",length:a.length},{name:"strides",type:"u32",length:t.strides.length},{name:"dilations",type:"u32",length:t.dilations.length}];Ye(t,_);let m=1,w=se(e[0].dataType),$=S("x",e[0].dataType,e[0].dims.length,d),b=S("W",e[1].dataType,e[1].dims.length,m),x=[$,b],v=B("result",e[0].dataType,i.length,m),I="";if(f){let V=S("bias",e[2].dataType,e[2].dims.length,m);x.push(V),I+=`
fn getBiasByOutputCoords(coords : array<u32, 5>) -> ${w} {
return bias[${s?R("coords",4,5):R("coords",1,5)}];
}`}let z=oe(d,w),O=Qe(t,z,w);return`
 ${I}
 fn getX(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
   let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
   return ${$.getByIndices("aIndices")};
 }
 fn getW(d0 : u32, d1 : u32, d2 : u32, d3 : u32, d4 : u32) -> f32 {
   let aIndices = array<u32, 5>(d0, d1, d2, d3, d4);
   return ${b.getByIndices("aIndices")};
 }
${y.registerUniforms(_).declareVariables(...x,v)}
${y.mainStart()}
${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
   let coords = ${v.offsetToIndices("global_idx")};
   let batch = ${R("coords",0,$.rank)};
   let d2 = ${s?R("coords",$.rank-1,$.rank):R("coords",1,$.rank)};
   let xFRCCorner = vec3<u32>(${s?R("coords",1,$.rank):R("coords",2,$.rank)},
   ${s?R("coords",2,$.rank):R("coords",3,$.rank)},
   ${s?R("coords",3,$.rank):R("coords",4,$.rank)}) * uniforms.strides - uniforms.pads;
   let xFCorner = xFRCCorner.x;
   let xRCorner = xFRCCorner.y;
   let xCCorner = xFRCCorner.z;
   let xShapeY = ${s?R("uniforms.x_shape",1,$.rank):R("uniforms.x_shape",2,$.rank)};
   let xShapeZ = ${s?R("uniforms.x_shape",2,$.rank):R("uniforms.x_shape",3,$.rank)};
   let xShapeW = ${s?R("uniforms.x_shape",3,$.rank):R("uniforms.x_shape",4,$.rank)};
   let xShapeU = ${s?R("uniforms.x_shape",4,$.rank):R("uniforms.x_shape",1,$.rank)};
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
           ${s?`let xValues = vec4<f32>(
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
             ${s?`value += getX(batch, xF, xR, xC, inputDepthNearestVec4)
               * getW(d2, inputDepthNearestVec4, wF, wR, wC);`:`value += getX(batch, inputDepthNearestVec4, xF, xR, xC)
               * getW(d2, inputDepthNearestVec4, wF, wR, wC);`}
         } else if (inputDepthVec4Remainder == 2) {
           ${s?`let xValues = vec2<f32>(
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
           ${s?`let xValues = vec3<f32>(
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
   ${f?"value = value + getBiasByOutputCoords(coords)":""};
   ${O}
   result[global_idx] = f32(value);
}`};return{name:"Conv3DNaive",shaderCache:{hint:`${t.cacheKey};${s};${d};${f}`,inputDependencies:h},getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:l[0],y:l[1],z:l[2]},programUniforms:c}),getShaderSource:g}}}),So,Io,Op=T(()=>{N(),W(),G(),Je(),So=(e,t,i,r)=>{let a=e.length>2,n=a?"value += b[output_channel];":"",s=e[0].dims,o=e[1].dims,u=t.format==="NHWC",l=u?i[3]:i[1],d=l/t.group,p=u&&d>=4?ie(l):1,c=k.size(i)/p,h=[{type:12,data:c},{type:12,data:t.dilations},{type:12,data:[t.strides[0],t.strides[1]]},{type:12,data:[t.pads[0],t.pads[1]]},{type:12,data:d}];Xe(t,h),h.push(...M(s,[o[0],o[1],o[2],o[3]/p]));let f=a?["rank","rank","rank"]:["rank","rank"];h.push(...M([i[0],i[1],i[2],i[3]/p]));let g=y=>{let _=B("output",e[0].dataType,i.length,p),m=se(_.type.tensor),w=Qe(t,_.type.value,m),$=S("x",e[0].dataType,s.length),b=S("w",e[1].dataType,o.length,p),x=[$,b];a&&x.push(S("b",e[2].dataType,e[2].dims,p));let v=[{name:"output_size",type:"u32"},{name:"dilations",type:"u32",length:t.dilations.length},{name:"strides",type:"u32",length:2},{name:"pads",type:"u32",length:2},{name:"output_channels_per_group",type:"u32"}];Ye(t,v);let I=u?`
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
 let xVal = ${$.get("batch","xHeight","xWidth","input_channel")};
 let wVal = ${b.get("wHeight","wWidth","wInChannel","output_channel")};
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

 let xVal = ${$.get("batch","input_channel","xHeight","xWidth")};
 let wVal = ${b.get("output_channel","wInChannel","wHeight","wWidth")};
 value += xVal * wVal;
}
}
}
`;return`
${y.registerUniforms(v).declareVariables(...x,_)}

${y.mainStart()}
${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

let outputIndices = ${_.offsetToIndices("global_idx")};
let batch: u32 = outputIndices[0];
let output_channel: u32 = outputIndices[${u?3:1}];
let xRCCorner: vec2<u32> = vec2<u32>(outputIndices[${u?1:2}], outputIndices[${u?2:3}]) * uniforms.strides - uniforms.pads;
let group_id: u32 = output_channel * ${p} / uniforms.output_channels_per_group;
var in_channel_offset = group_id * uniforms.w_shape[${u?2:1}];

var value: ${_.type.value} = ${_.type.value}(0);
${I}
${n}
${w}
${_.setByOffset("global_idx","value")}
}`};return{name:"GroupedConv",shaderCache:{hint:`${t.cacheKey}_${p}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:r?r(i):i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:h}),getShaderSource:g}},Io=(e,t,i,r)=>{let a=e.length>2,n=ie(i[3]),s=ie(i[2]),o=k.size(i)/n/s,u=[e[0].dims[0],e[0].dims[1],e[0].dims[2],e[0].dims[3]/n],l=[e[1].dims[0],e[1].dims[1],e[1].dims[2],e[1].dims[3]/n],d=[i[0],i[1],i[2],i[3]/n],p=[{type:12,data:o},{type:6,data:[t.strides[0],t.strides[1]]},{type:6,data:[t.pads[0],t.pads[1]]}];Xe(t,p),p.push(...M(u,l,d));let c=(s-1)*t.strides[1]+l[1],h=f=>{let g=B("output",e[0].dataType,d.length,n),y=se(g.type.tensor),_=Qe(t,g.type.value,y),m=S("x",e[0].dataType,u.length,n),w=S("w",e[1].dataType,l.length,n),$=[m,w];a&&$.push(S("b",e[2].dataType,e[2].dims,n));let b=a?"value += b[output_channel];":"",x=[{name:"output_size",type:"u32"},{name:"strides",type:"i32",length:2},{name:"pads",type:"i32",length:2}];return Ye(t,x),`
${f.registerUniforms(x).declareVariables(...$,g)}
${f.mainStart()}
${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let width0 = uniforms.output_shape[3];
let output_channel = global_idx % width0;
var index1 = global_idx / width0;
let width1 = uniforms.output_shape[2] / ${s}u;
let col = (index1 % width1) * ${s}u;
index1 = index1 / width1;
let row = index1 % uniforms.output_shape[1];
let batch = index1 / uniforms.output_shape[1];

let x_corner = vec2<i32>(i32(row), i32(col)) * uniforms.strides - uniforms.pads;

var x_vals: array<${m.type.value}, ${c}>;
var values: array<${g.type.value}, ${s}>;
let input_channel = output_channel;
// Use constant instead of uniform can give better performance for w's height/width.
for (var w_height: u32 = 0u; w_height < ${l[0]}; w_height++) {
let x_height = x_corner.x + i32(w_height);
if (x_height >= 0 && u32(x_height) < uniforms.x_shape[1]) {
for (var i = 0; i < ${c}; i++) {
let x_width = x_corner.y + i;
if (x_width >= 0 && u32(x_width) < uniforms.x_shape[2]) {
 x_vals[i] = ${m.get("batch","u32(x_height)","u32(x_width)","input_channel")};
} else {
 x_vals[i] = ${m.type.value}(0);
}
}
for (var w_width: u32 = 0u; w_width < ${l[1]}; w_width++) {
let w_val = ${w.get("w_height","w_width","0","output_channel")};
for (var i = 0u; i < ${s}u; i++) {
 values[i] = fma(x_vals[i * u32(uniforms.strides[1]) + w_width], w_val, values[i]);
}
}
}
}

for (var i = 0u; i < ${s}u; i++) {
var value = values[i];
${b}
${_}
${g.set("batch","row","col + i","output_channel","value")};
}
}`};return{name:"GroupedConv-Vectorize",shaderCache:{hint:`${t.cacheKey};${n};${s};${c};${l[0]};${l[1]}`,inputDependencies:a?["rank","rank","type"]:["rank","rank"]},getRunData:()=>({outputs:[{dims:r?r(i):i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:p}),getShaderSource:h}}}),To,Ht,zo,Ft,nr,sr,Eo,Co,or,Ap=T(()=>{W(),Ep(),Cp(),ir(),Op(),Je(),Yi(),We(),To=(e,t,i,r,a,n)=>{let s=e[0],o=e.slice(n?1:2,n?3:4),u=o.length,l=t[0],d=t.slice(2).map((c,h)=>c+(c-1)*(i[h]-1)),p=o.map((c,h)=>c+r[h]+r[h+u]).map((c,h)=>Math.floor((c-d[h]+a[h])/a[h]));return p.splice(0,0,s),p.splice(n?3:1,0,l),p},Ht=[2,3,1,0],zo=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length>5)throw new Error("greater than 5D is not supported");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let i=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],r=e[1].dims[1]*t.group;if(i!==r)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");if(e.length===3&&(e[2].dims.length!==1||e[1].dims[0]!==e[2].dims[0]))throw new Error("invalid bias");let a=e[0].dims.length-2;if(t.dilations.length!==a)throw new Error(`dilations should be ${a}D`);if(t.strides.length!==a)throw new Error(`strides should be ${a}D`);if(t.pads.length!==a*2)throw new Error(`pads should be ${a*2}D`);if(t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape")},Ft=(e,t)=>{let i=e.kernelShape.slice();i.length<t[1].dims.length-2&&i.push(...Array(t[1].dims.length-2-i.length).fill(0));for(let n=2;n<t[1].dims.length;++n)i[n-2]===0&&(i[n-2]=t[1].dims[n]);let r=e.pads.slice();Ut.adjustPadsBasedOnAutoPad(t[0].dims,e.strides,e.dilations,i,r,e.format==="NHWC",e.autoPad);let a=Object.assign({},e);return Object.assign(a,{kernelShape:i,pads:r}),a},nr=e=>{let t=Zi(e),i=e.format,r=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],a=e.dilations,n=e.group,s=e.kernel_shape,o=e.pads,u=e.strides,l=e.w_is_const();return{autoPad:r,format:i,dilations:a,group:n,kernelShape:s,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},sr=(e,t,i,r)=>{let a=i.format==="NHWC",n=To(t[0].dims,t[1].dims,i.dilations,i.pads,i.strides,a);if(i.group!==1){let x=[t[0]];if(a){let v=e.kernelCustomData.wT??e.compute(we(t[1],Ht),{inputs:[1],outputs:[i.wIsConst?-2:-1]})[0];i.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=v),x.push(v)}else x.push(t[1]);t.length===3&&x.push(t[2]),!e.adapterInfo.isArchitecture("ampere")&&a&&t[1].dims[0]===i.group&&t[1].dims[1]===1&&i.dilations[0]===1&&i.dilations[1]===1?e.compute(Io(x,i,n,r),{inputs:x}):e.compute(So(x,i,n,r),{inputs:x});return}let s=t.length===3,o=t[0].dims[a?1:2],u=t[0].dims[a?2:3],l=t[0].dims[a?3:1],d=t[1].dims[2],p=t[1].dims[3],c=n[a?1:2],h=n[a?2:3],f=n[a?3:1],g=a&&d===o&&p===u&&i.pads[0]===0&&i.pads[1]===0;if(g||d===1&&p===1&&i.dilations[0]===1&&i.dilations[1]===1&&i.strides[0]===1&&i.strides[1]===1&&i.pads[0]===0&&i.pads[1]===0){let x=n[0],v,I,z,O=[];if(a){let L=e.kernelCustomData.wT??e.compute(we(t[1],Ht),{inputs:[1],outputs:[i.wIsConst?-2:-1]})[0];if(i.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=L),g){let A=o*u*l;v=t[0].reshape([1,x,A]),I=L.reshape([1,A,f]),z=[1,x,f]}else v=t[0].reshape([x,o*u,l]),I=L.reshape([1,l,f]),z=[x,c*h,f];O.push(v),O.push(I)}else v=t[0].reshape([x,l,o*u]),I=t[1].reshape([1,f,l]),z=[x,f,c*h],O.push(I),O.push(v);s&&O.push(t[2]);let V=z[2],U=O[0].dims[O[0].dims.length-1];V<8&&U<8?e.compute(Xi(O,i,n,z,a,r),{inputs:O}):e.compute(Gt(O,i,n,z,a,r),{inputs:O});return}let y=!0,_=e.kernelCustomData.wT??e.compute(we(t[1],Ht),{inputs:[1],outputs:[i.wIsConst?-2:-1]})[0];i.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=_);let m=[t[0],_];s&&m.push(t[2]);let w=a?c*h:f,$=a?f:c*h,b=d*p*l;e.compute($o(m,i,n,w,$,b,s,y,r),{inputs:m})},Eo=(e,t)=>{let i=t.format==="NHWC",r=[e.inputs[0].reshape(i?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&r.push(e.inputs[2]);let a=[0,t.pads[0],0,t.pads[1]],n=[1].concat(t.strides),s=[1].concat(t.dilations),o=[1].concat(t.kernelShape),u=Ft({...t,pads:a,strides:n,dilations:s,kernelShape:o},r);sr(e,r,u,l=>i?[l[0],l[2],l[3]]:[l[0],l[1],l[3]])},Co=(e,t,i)=>{let r=i.format==="NHWC"?"channelsLast":"channelsFirst",a=Ft(i,t),n=i.autoPad==="NOTSET"?i.pads:i.autoPad,s=xo(t[0].dims,t[1].dims,i.strides,i.dilations,n,!1,r);e.compute(ko(t,a,s.outShape,[s.filterDepth,s.filterHeight,s.filterWidth],[s.padInfo.front,s.padInfo.top,s.padInfo.left],r))},or=(e,t)=>{if(zo(e.inputs,t),e.inputs[0].dims.length===3)Eo(e,t);else if(e.inputs[0].dims.length===5)Co(e,e.inputs,t);else{let i=Ft(t,e.inputs);sr(e,e.inputs,i)}}}),Oo,Bp=T(()=>{N(),qe(),W(),G(),Oo=(e,t,i)=>{let r=e.length>2,a=t.outputShape,n=t.format==="NHWC",s=t.group,o=e[1].dims,u=o[2]/s,l=o[3],d=n?ie(u):1,p=n&&l===1&&u>=4,c=p?Math.floor(u/4)*4:Math.floor(u/d)*d,h=u-c,f=n?ie(l):1,g=n?l===1?d:f:1,y=k.size(a)/f,_=[Math.ceil(y/64),1,1];j("verbose",()=>`[conv2d_backprop_webgpu] dispatch = ${_}`);let m=["rank","rank"],w=[t.strides[0],t.strides[1]],$=[t.kernelShape[n?1:2],t.kernelShape[n?2:3]],b=[t.dilations[0],t.dilations[1]],x=[$[0]+(t.dilations[0]<=1?0:(t.kernelShape[n?1:2]-1)*(t.dilations[0]-1)),$[1]+(t.dilations[1]<=1?0:(t.kernelShape[n?2:3]-1)*(t.dilations[1]-1))],v=[x[0]-1-Math.floor((t.pads[0]+t.pads[2])/2),x[1]-1-Math.floor((t.pads[1]+t.pads[3])/2)],I=[{type:12,data:y},{type:12,data:w},{type:12,data:$},{type:12,data:b},{type:12,data:x},{type:6,data:v},{type:12,data:c},{type:12,data:u},{type:12,data:l},...M(e[0].dims,e[1].dims)];r&&(I.push(...M(e[2].dims)),m.push("rank")),I.push(...M(a));let z=O=>{let V=[{name:"output_size",type:"u32"},{name:"strides",type:"u32",length:w.length},{name:"filter_dims",type:"u32",length:$.length},{name:"dilations",type:"u32",length:$.length},{name:"effective_filter_dims",type:"u32",length:x.length},{name:"pads",type:"i32",length:v.length},{name:"input_channels_per_group_int",type:"u32"},{name:"input_channels_per_group",type:"u32"},{name:"output_channels_per_group",type:"u32"}],U=se(e[0].dataType),L=n?1:2,A=n?2:3,F=n?3:1,q=S("W",e[1].dataType,e[1].dims.length,g),D=S("Dy",e[0].dataType,e[0].dims.length,d),Z=[D,q];r&&Z.push(S("bias",e[2].dataType,[a[F]].length,f));let P=B("result",e[0].dataType,a.length,f),te=()=>{let H="";if(p)d===4?H+=`
let xValue = ${D.getByOffset("x_offset")};
let wValue = ${q.getByOffset("w_offset")};
dotProd = dotProd + dot(xValue, wValue);
x_offset += 1u;
w_offset += 1u;`:d===2?H+=`
dotProd = dotProd + dot(vec4<${U}>(${D.getByOffset("x_offset")}, ${D.getByOffset("x_offset + 1u")}), vec4<${U}>(${q.getByOffset("w_offset")}, ${q.getByOffset("w_offset + 1u")}));
x_offset += 2u;
w_offset += 2u;`:d===1&&(H+=`
dotProd = dotProd + dot(vec4<${U}>(${D.getByOffset("x_offset")}, ${D.getByOffset("x_offset + 1u")}, ${D.getByOffset("x_offset + 2u")}, ${D.getByOffset("x_offset + 3u")}), vec4<${U}>(${q.getByOffset("w_offset")}, ${q.getByOffset("w_offset + 1u")}, ${q.getByOffset("w_offset + 2u")}, ${q.getByOffset("w_offset + 3u")}));
x_offset += 4u;
w_offset += 4u;`);else if(H+=`
       let xValue = ${n?D.getByOffset(`${D.indicesToOffset(`${D.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d}`):D.get("batch","inputChannel","idyR","idyC")};
`,d===1)H+=`
let w_offset = ${q.indicesToOffset(`${q.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel, wOutChannel)`)};
let wValue = ${q.getByOffset(`w_offset / ${g}`)};
dotProd = dotProd + xValue * wValue;`;else for(let Y=0;Y<d;Y++)H+=`
 let wValue${Y} = ${q.getByOffset(`${q.indicesToOffset(`${q.type.indices}(u32(wRPerm), u32(wCPerm), inputChannel + ${Y}, wOutChannel)`)} / ${g}`)};
 dotProd = dotProd + xValue[${Y}] * wValue${Y};`;return H},E=()=>{if(h===0)return"";if(!p)throw new Error(`packInputAs4 ${p} is not true.`);let H="";if(d===1){H+="dotProd = dotProd";for(let Y=0;Y<h;Y++)H+=`
 + ${D.getByOffset(`x_offset + ${Y}`)} * ${q.getByOffset(`w_offset + ${Y}`)}`;H+=";"}else if(d===2){if(h!==2)throw new Error(`Invalid inputChannelsRemainder ${h}.`);H+=`
let xValue = ${D.getByOffset("x_offset")};
let wValue = ${q.getByOffset("w_offset")};
dotProd = dotProd + dot(xValue, wValue);`}return H},C=`
 let outputIndices = ${P.offsetToIndices(`global_idx * ${f}`)};
 let batch = ${P.indicesGet("outputIndices",0)};
 let d1 = ${P.indicesGet("outputIndices",F)};
 let r = ${P.indicesGet("outputIndices",L)};
 let c = ${P.indicesGet("outputIndices",A)};
 let dyCorner = vec2<i32>(i32(r), i32(c)) - uniforms.pads;
 let dyRCorner = dyCorner.x;
 let dyCCorner = dyCorner.y;
 let groupId = d1 / uniforms.output_channels_per_group;
 let wOutChannel = d1 - groupId * uniforms.output_channels_per_group;
 // Convolve dy(?, ?, d2) with w(:, :, d1, d2) to compute dx(xR, xC, d1).
 // ? = to be determined. : = across all values in that axis.
 var dotProd = ${P.type.value}(0.0);
 var wR: u32 = 0;
 if (uniforms.dilations.x == 1) {
   // Minimum wR >= 0 that satisfies (dyRCorner + wR) % (uniforms.strides.x) == 0
   wR = u32(((dyRCorner + i32(uniforms.strides.x) - 1) / i32(uniforms.strides.x)) * i32(uniforms.strides.x) - dyRCorner);
 }
 for (; wR < uniforms.effective_filter_dims.x; wR = wR + 1) {
   if (wR % uniforms.dilations.x != 0) {
     continue;
   }
   let dyR = (${U}(dyRCorner) + ${U}(wR)) / ${U}(uniforms.strides[0]);
   let wRPerm = uniforms.filter_dims.x - 1 - wR / uniforms.dilations.x;
   if (dyR < 0.0 || dyR >= ${U}(uniforms.Dy_shape[${L}]) || fract(dyR) > 0.0 ||
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
     let dyC = (${U}(dyCCorner) + ${U}(wC)) / ${U}(uniforms.strides.y);
     let wCPerm = uniforms.filter_dims.y - 1 - wC / uniforms.dilations.y;
     if (dyC < 0.0 || dyC >= ${U}(uniforms.Dy_shape[${A}]) ||
         fract(dyC) > 0.0 || wCPerm < 0) {
       continue;
     }
     let idyC: u32 = u32(dyC);
     var inputChannel = groupId * uniforms.input_channels_per_group;
     ${p?`
     var x_offset = ${D.indicesToOffset(`${D.type.indices}(batch, idyR, idyC, inputChannel)`)} / ${d};
     var w_offset = ${q.indicesToOffset(`${q.type.indices}(wRPerm, wCPerm, inputChannel, wOutChannel)`)} / ${g};
       `:""}
     for (var d2: u32 = 0; d2 < uniforms.input_channels_per_group_int; d2 = d2 + ${p?4:d}) {
       ${te()}
       inputChannel = inputChannel + ${p?4:d};
     }
     ${E()}
     wC = wC + uniforms.strides.y - 1;
   }
   wR = wR + uniforms.strides[0] - 1;
 }
 let value = dotProd${r?` + bias[d1 / ${f}]`:""};
 ${P.setByOffset("global_idx","value")};
`;return`
${O.registerUniforms(V).declareVariables(...Z,P)}
${O.mainStart()}
${O.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")};
${C}}`};return{name:"ConvTranspose2D",shaderCache:{hint:`${t.cacheKey};${d}${g}${f}${p}${h}`,inputDependencies:m},getRunData:()=>({dispatchGroup:{x:_[0],y:_[1],z:_[2]},outputs:[{dims:i?i(a):a,dataType:e[0].dataType}],programUniforms:I}),getShaderSource:z}}}),Ao,Bo,Ro,ur,Do,Mo,lr,Uo,Po,Rp=T(()=>{Bp(),Je(),We(),Ao=(e,t,i,r,a,n)=>(e-1)*t+i+(r-1)*a+1-n,Bo=(e,t,i,r,a)=>{let n=Math.floor(e/2);t==="SAME_UPPER"?(i[r]=n,i[a]=e-n):t==="SAME_LOWER"&&(i[r]=e-n,i[a]=n)},Ro=(e,t,i,r,a,n,s,o,u,l)=>{let d=e.length-2,p=l.length===0;u.length<d&&u.push(...Array(d-u.length).fill(0));let c=e[0],h=t[o?3:1]*a;for(let f=0,g=e.length-d-(o?1:0);f<d;++f,++g){let y=e[g],_=p?y*s[f]:l[f],m=Ao(y,s[f],n[f],t[g],i[f],_);Bo(m,r,n,f,f+d),p&&l.push(s[f]*(y-1)+u[f]+(t[g]-1)*i[f]+1-n[f]-n[f+d])}l.splice(0,0,c),l.splice(o?3:1,0,h)},ur=(e,t)=>{let i=e.kernelShape.slice();if(e.kernelShape.length===0||e.kernelShape.reduce((p,c)=>p*c,1)===0){i.length=0;for(let p=2;p<t[1].dims.length;++p)i.push(t[1].dims[p])}let r=e.format==="NHWC";i.splice(0,0,t[1].dims[0]),i.splice(r?3:1,0,t[1].dims[1]);let a=e.pads.slice(),n=e.outputShape.slice(),s=e.outputPadding.slice(),o=t[0].dims,u=e.dilations.slice();if(u.reduce((p,c)=>p+c,0)===0){let p=t[0].dims.length-2;u=new Array(p).fill(1)}let l=e.strides.slice();if(l.reduce((p,c)=>p+c,0)===0){let p=t[0].dims.length-2;l=new Array(p).fill(1)}Ro(o,i,u,e.autoPad,e.group,a,l,r,s,n);let d=Object.assign({},e);return Object.assign(d,{kernelShape:i,pads:a,outputPadding:s,outputShape:n,dilations:u,strides:l}),d},Do=e=>{let t=Zi(e),i=e.format,r=["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][typeof e.autoPad>"u"?0:e.autoPad],a=e.dilations,n=e.group,s=e.kernelShape,o=e.pads,u=e.strides,l=e.wIsConst(),d=e.outputPadding,p=e.outputShape;return{autoPad:r,format:i,dilations:a,group:n,kernelShape:s,outputPadding:d,outputShape:p,pads:o,strides:u,wIsConst:l,...t,cacheKey:`${e.format};${t.activation};`}},Mo=(e,t)=>{if(!e||e.length!==2&&e.length!==3)throw new Error("Conv requires 2 or 3 inputs");if(e[0].dims.length!==4&&e[0].dims.length!==3)throw new Error("currently only support 2-dimensional conv");if(e[0].dims.length!==e[1].dims.length)throw new Error("filter does not have same dimension as input");let i=e[0].dims[t.format==="NHWC"?e[0].dims.length-1:1],r=e[1].dims[0];if(i!==r)throw new Error("FILTER_IN_CHANNEL should be equal to DATA_CHANNEL");let a=e[1].dims[1]*t.group;if(e.length===3&&(e[2].dims.length!==1||e[2].dims[0]!==a))throw new Error("invalid bias");let n=e[0].dims.length-2;if(t.dilations.reduce((s,o)=>s+o,0)>0&&t.dilations.length!==n)throw new Error(`dilations should be ${n}D`);if(t.strides.reduce((s,o)=>s+o,0)>0&&t.strides.length!==n)throw new Error(`strides should be ${n}D`);if(t.pads.reduce((s,o)=>s+o,0)>0&&t.pads.length!==n*2)throw new Error(`pads should be ${n*2}D`);if(t.outputPadding.length!==n&&t.outputPadding.length!==0)throw new Error(`output_padding should be ${n}D`);if(t.kernelShape.reduce((s,o)=>s+o,0)>0&&t.kernelShape.length!==0&&t.kernelShape.length!==e[1].dims.length-2)throw new Error("invalid kernel shape");if(t.outputShape.length!==0&&t.outputShape.length!==e[0].dims.length-2)throw new Error("invalid output shape")},lr=(e,t,i,r)=>{let a=e.kernelCustomData.wT??e.compute(we(t[1],[2,3,0,1]),{inputs:[1],outputs:[i.wIsConst?-2:-1]})[0];i.wIsConst&&!e.kernelCustomData.wT&&(e.kernelCustomData.wT=a);let n=[t[0],a];t.length===3&&n.push(t[2]),e.compute(Oo(n,i,r),{inputs:n})},Uo=(e,t)=>{let i=t.format==="NHWC",r=[e.inputs[0].reshape(i?[e.inputs[0].dims[0],1,e.inputs[0].dims[1],e.inputs[0].dims[2]]:[e.inputs[0].dims[0],e.inputs[0].dims[1],1,e.inputs[0].dims[2]]),e.inputs[1].reshape([e.inputs[1].dims[0],e.inputs[1].dims[1],1,e.inputs[1].dims[2]])];e.inputs.length===3&&r.push(e.inputs[2]);let a=t.kernelShape;(a.length===0||a[0]===0)&&(a=[e.inputs[1].dims[2]]);let n=t.dilations;(n.length===0||n[0]===0)&&(n=[1]);let s=t.strides;(s.length===0||s[0]===0)&&(s=[1]);let o=t.pads;o.length===0&&(o=[0,0]),o=[0,o[0],0,o[1]],s=[1].concat(s),n=[1].concat(n),a=[1].concat(a);let u=t.outputPadding;u=[0].concat(u);let l=ur({...t,pads:o,strides:s,dilations:n,kernelShape:a,outputPadding:u},r);lr(e,r,l,d=>i?[d[0],d[2],d[3]]:[d[0],d[1],d[3]])},Po=(e,t)=>{if(Mo(e.inputs,t),e.inputs[0].dims.length===3)Uo(e,t);else{let i=ur(t,e.inputs);lr(e,e.inputs,i)}}}),qo,No,Vo,Dp=T(()=>{N(),W(),re(),G(),qo=(e,t,i,r)=>{let a=k.size(t),n=t.length,s=S("input",e,n),o=B("output",e,n),u=i.dataType===6?i.getInt32Array()[0]:Number(i.getBigInt64Array()[0]),l=k.normalizeAxis(u,n),d=p=>{let c=` i32(${s.indicesGet("inputIndices","uniforms.axis")}) `,h=R("uniforms.input_shape","uniforms.axis",n),f=r.reverse?c+(r.exclusive?" + 1":""):"0",g=r.reverse?h:c+(r.exclusive?"":" + 1");return`
     ${p.registerUniform("outputSize","u32").registerUniform("axis","u32").declareVariables(s,o)}
     ${p.mainStart()}
       ${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
       var inputIndices = ${o.offsetToIndices("global_idx")};
       var sum = ${o.type.value}(0);
       let first : i32 = ${f};
       let last : i32 = ${g};
       for (var i : i32 = first; i < last; i++) {
         ${s.indicesSet("inputIndices","uniforms.axis","u32(i)")};
         sum = sum + ${s.getByIndices("inputIndices")};
       }
       ${o.setByOffset("global_idx","sum")};
     }`};return{name:"CumSum",shaderCache:{hint:r.cacheKey,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:t,dataType:e}],dispatchGroup:{x:Math.ceil(a/64)},programUniforms:[{type:12,data:a},{type:12,data:l},...M(t,t)]}),getShaderSource:d}},No=(e,t)=>{let i=e.inputs[0].dims,r=e.inputs[0].dataType,a=e.inputs[1];e.compute(qo(r,i,a,t),{inputs:[0]})},Vo=e=>{let t=e.exclusive===1,i=e.reverse===1;return Q({exclusive:t,reverse:i})}}),Lo,Wo,Go,Ho,Fo,Mp=T(()=>{N(),W(),re(),G(),Lo=e=>{if(!e||e.length!==1)throw new Error("DepthToSpace requires 1 input.");if(e[0].dims.length!==4)throw new Error("DepthToSpace requires 4D input.")},Wo=(e,t,i,r)=>{let a=[];a.push(`fn perm(i: ${r.type.indices}) -> ${i.type.indices} {
var a: ${i.type.indices};`);for(let n=0;n<t;++n)a.push(i.indicesSet("a",e[n],`i[${n}]`));return a.push("return a;}"),a.join(`
`)},Go=(e,t)=>{let i,r,a,n,s,o,u=t.format==="NHWC",l=t.blocksize,d=t.mode==="DCR";u?([i,r,a,n]=e.dims,s=d?[i,r,a,l,l,n/l**2]:[i,r,a,n/l**2,l,l],o=d?[0,1,3,2,4,5]:[0,1,4,2,5,3]):([i,r,a,n]=[e.dims[0],e.dims[2],e.dims[3],e.dims[1]],s=d?[i,l,l,n/l**2,r,a]:[i,n/l**2,l,l,r,a],o=d?[0,3,4,1,5,2]:[0,1,4,2,5,3]);let p=e.reshape(s),c=p.dims.length,h=e.dataType,f=S("a",h,c),g=B("output",h,c),y=_=>`
${_.registerUniform("output_size","u32").declareVariables(f,g)}

${Wo(o,c,f,g)}

${_.mainStart()}
${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

let indices = ${g.offsetToIndices("global_idx")};
let aIndices = perm(indices);

${g.setByOffset("global_idx",f.getByIndices("aIndices"))}
}`;return{name:"DepthToSpace",shaderCache:{hint:`${e.dims};${t.blocksize};${t.mode}`,inputDependencies:["rank"]},getRunData:_=>{let m=u?[i,r*l,a*l,n/l**2]:[i,n/l**2,r*l,a*l],w=k.size(m),$=p.dims,b=k.sortBasedOnPerm($,o);return{outputs:[{dims:m,dataType:_[0].dataType}],dispatchGroup:{x:Math.ceil(w/64)},programUniforms:[{type:12,data:w},...M($,b)]}},getShaderSource:y}},Ho=(e,t)=>{Lo(e.inputs),e.compute(Go(e.inputs[0],t))},Fo=e=>Q({blocksize:e.blocksize,mode:e.mode,format:e.format})}),jt,wt,dr,jo,Ko,Zo,Qo,pr,Xo,Yo,Jo,Up=T(()=>{N(),W(),re(),G(),jt="[a-zA-Z]|\\.\\.\\.",wt="("+jt+")+",dr="^"+wt+"$",jo="("+wt+",)*"+wt,Ko="^"+jo+"$",Zo=class{constructor(e=-1){this.symbolToIndices=new Map,this.inputIndex=e}addSymbol(e,t){let i=this.symbolToIndices.get(e);i===void 0?i=[t]:i.push(t),this.symbolToIndices.set(e,i)}},Qo=class{constructor(e,t){this.equation=t,this.hasEllipsis=!1,this.symbolToInfo=new Map,this.lhs=new Array,this.outputDims=[];let[i,r]=t.includes("->")?t.split("->",2):[t,""];if(!i.match(RegExp(Ko)))throw new Error("Invalid LHS term");if(i.split(",").forEach((a,n)=>{let s=e[n].dims.slice();if(!a.match(RegExp(dr)))throw new Error("Invalid LHS term");let o=this.processTerm(a,!0,s,n);this.lhs.push(o)}),r==="")r+=[...this.symbolToInfo.entries()].filter(([a,n])=>n.count===1||a==="...").map(([a])=>a).join("");else if(!r.match(RegExp(wt)))throw new Error("Invalid RHS");r.match(RegExp(jt,"g"))?.forEach(a=>{if(a==="...")this.outputDims=this.outputDims.concat(this.ellipsisDims);else{let n=this.symbolToInfo.get(a);if(n===void 0)throw new Error("Invalid RHS symbol");this.outputDims.push(n.dimValue)}}),this.rhs=this.processTerm(r,!1,this.outputDims)}addSymbol(e,t,i){let r=this.symbolToInfo.get(e);if(r!==void 0){if(r.dimValue!==t&&r.count!==1)throw new Error("Dimension mismatch");r.count++,r.inputIndices.push(i)}else r={count:1,dimValue:t,inputIndices:[i]};this.symbolToInfo.set(e,r)}processTerm(e,t,i,r=-1){let a=i.length,n=!1,s=[],o=0;if(!e.match(RegExp(dr))&&!t&&e!=="")throw new Error("Invalid LHS term");let u=e.match(RegExp(jt,"g")),l=new Zo(r);return u?.forEach((d,p)=>{if(d==="..."){if(n)throw new Error("Only one ellipsis is allowed per input term");n=!0;let c=a-u.length+1;if(c<0)throw new Error("Ellipsis out of bounds");if(s=i.slice(o,o+c),this.hasEllipsis){if(this.ellipsisDims.length!==s.length||this.ellipsisDims.toString()!==s.toString())throw new Error("Ellipsis dimensions mismatch")}else if(t)this.hasEllipsis=!0,this.ellipsisDims=s;else throw new Error("Ellipsis must be specified in the LHS");for(let h=0;h<s.length;h++){let f=String.fromCharCode(48+h);l.addSymbol(f,p+h),this.addSymbol(f,i[o++],r)}}else l.addSymbol(d,p+(this.hasEllipsis?this.ellipsisDims.length-1:0)),this.addSymbol(d,i[o++],r)}),l}},pr=e=>e+"_max",Xo=(e,t,i,r)=>{let a=e.map(l=>l.length).map((l,d)=>S(`input${d}`,t,l)),n=k.size(r),s=B("output",t,r.length),o=[...i.symbolToInfo.keys()].filter(l=>!i.rhs.symbolToIndices.has(l)),u=l=>{let d=[],p="var prod = 1.0;",c="var sum = 0.0;",h="sum += prod;",f=[],g=[],y=[],_=[],m=i.symbolToInfo.size===i.rhs.symbolToIndices.size;i.symbolToInfo.forEach(($,b)=>{if(i.rhs.symbolToIndices.has(b)){let x=i.rhs.symbolToIndices.get(b)?.[0];x!==void 0&&i.lhs.forEach((v,I)=>{if($.inputIndices.includes(I)){let z=v.symbolToIndices.get(b);if(z===void 0)throw new Error("Invalid symbol error");z.forEach(O=>{d.push(`${a[I].indicesSet(`input${I}Indices`,O,s.indicesGet("outputIndices",x))}`)})}})}else i.lhs.forEach((x,v)=>{if($.inputIndices.includes(v)){let I=x.symbolToIndices.get(b);if(I===void 0)throw new Error("Invalid symbol error");I.forEach(z=>{f.push(`${a[v].indicesSet(`input${v}Indices`,z,`${b}`)}`)}),_.push(`prod *= ${a[v].getByIndices(`input${v}Indices`)};`)}}),g.push(`for(var ${b}: u32 = 0; ${b} < uniforms.${pr(b)}; ${b}++) {`),y.push("}")});let w=m?[...d,`let sum = ${a.map(($,b)=>$.getByIndices(`input${b}Indices`)).join(" * ")};`]:[...d,c,...g,...f,p,..._,h,...y];return`
 ${l.registerUniforms(o.map($=>({name:`${pr($)}`,type:"u32"}))).registerUniform("outputSize","u32").declareVariables(...a,s)}

 ${l.mainStart()}
 ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
 var outputIndices = ${s.offsetToIndices("global_idx")};
 ${a.map(($,b)=>`var input${b}Indices: ${a[b].type.indices};`).join(`
`)}
 ${w.join(`
`)};
 ${s.setByOffset("global_idx","sum")};
}`};return{name:"Einsum",shaderCache:{hint:i.equation,inputDependencies:e.map(()=>"rank")},getRunData:()=>{let l=o.filter(p=>i.symbolToInfo.has(p)).map(p=>({type:12,data:i.symbolToInfo.get(p)?.dimValue||0}));l.push({type:12,data:n});let d=e.map((p,c)=>[...M(p)]).reduce((p,c)=>p.concat(c),l);return d.push(...M(r)),{outputs:[{dims:r,dataType:t}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:d}},getShaderSource:u}},Yo=(e,t)=>{let i=new Qo(e.inputs,t.equation),r=i.outputDims,a=e.inputs.map((n,s)=>n.dims);e.compute(Xo(a,e.inputs[0].dataType,i,r))},Jo=e=>{let t=e.equation.replace(/\s+/g,"");return Q({equation:t})}}),eu,cr,tu,iu,ru,Pp=T(()=>{N(),W(),G(),eu=e=>{if(!e||e.length!==2)throw new Error("Expand requires 2 input.");let t=e[0].dims,i=Array.from(e[1].getBigInt64Array(),Number),r=i.length<t.length?0:i.length-t.length,a=t.length<i.length?0:t.length-i.length;for(;r<i.length&&a<t.length;++r,++a)if(i[r]!==t[a]&&i[r]!==1&&t[a]!==1)throw new Error("Expand requires shape to be broadcastable to input")},cr=(e,t)=>{let i=e.length-t.length,r=[];for(let a=0;a<i;++a)r.push(e[a]);for(let a=0;a<t.length;++a)r.push(t[a]===1?e[a+i]:t[a]);return r},tu=(e,t)=>e.length>t.length?cr(e,t):cr(t,e),iu=e=>{let t=e[0].dims,i=Array.from(e[1].getBigInt64Array(),Number),r=tu(t,i),a=e[0].dataType,n=a===9||k.size(t)===1,s=a===9||t.length>0&&t[t.length-1]%4===0?4:1,o=n||r.length>0&&r[r.length-1]%4===0?4:1,u=Math.ceil(k.size(r)/o),l=p=>{let c=S("input",a,t.length,s),h=B("output",a,r.length,o),f;if(a===9){let g=(y,_,m="")=>`
let outputIndices${_} = ${h.offsetToIndices(`outputOffset + ${_}u`)};
let offset${_} = ${c.broadcastedIndicesToOffset(`outputIndices${_}`,h)};
let index${_} = offset${_} / 4u;
let component${_} = offset${_} % 4u;
${y}[${_}] = ${m}(${c.getByOffset(`index${_}`)}[component${_}]);
`;f=`
let outputOffset = global_idx * ${o};
var data = vec4<u32>(0);
${g("data",0,"u32")}
${g("data",1,"u32")}
${g("data",2,"u32")}
${g("data",3,"u32")}
${h.setByOffset("global_idx","data")}
}`}else f=`
let outputIndices = ${h.offsetToIndices(`global_idx * ${o}`)};
let inputOffset = ${c.broadcastedIndicesToOffset("outputIndices",h)};
let data = ${h.type.value}(${c.getByOffset(`inputOffset / ${s}`)});
${h.setByOffset("global_idx","data")}
}`;return`
${p.registerUniform("vec_size","u32").declareVariables(c,h)}
${p.mainStart()}
${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
${f}`},d=[{type:12,data:u},...M(t,r)];return{name:"Expand",shaderCache:{hint:`${r.length};${s}${o}`,inputDependencies:["rank"]},getShaderSource:l,getRunData:()=>({outputs:[{dims:r,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:d})}},ru=e=>{eu(e.inputs),e.compute(iu(e.inputs),{inputs:[0]})}}),au,nu,qp=T(()=>{N(),W(),G(),Ki(),au=e=>{let t=e[0].dataType,i=k.size(e[0].dims),r=k.size(e[1].dims),a=r%4===0,n=s=>{let o=S("x",t,[1],4),u=S("bias",t,[1],4),l=B("y",t,[1],4),d=[{name:"output_vec_size",type:"u32"},{name:"bias_size",type:"u32"}],p=h=>`
let bias${h}_offset: u32 = (global_idx * 4 + ${h}) % uniforms.bias_size;
let bias${h} = ${u.getByOffset(`bias${h}_offset / 4`)}[bias${h}_offset % 4];`,c=a?`
let bias = ${u.getByOffset("global_idx % (uniforms.bias_size / 4)")};`:`${p(0)}${p(1)}${p(2)}${p(3)}
let bias = ${o.type.value}(bias0, bias1, bias2, bias3);`;return`${s.registerUniforms(d).declareVariables(o,u,l)}

${Fi(de(t))}

${s.mainStart(st)}
${s.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_vec_size")}

let x = ${o.getByOffset("global_idx")};
${c}
let x_in = x + bias;
${l.setByOffset("global_idx",ji("x_in"))}
}`};return{name:"FastGeluWithBias",shaderCache:{hint:`${a}`,inputDependencies:["type","type"]},getShaderSource:n,getRunData:s=>({outputs:[{dims:s[0].dims,dataType:s[0].dataType}],programUniforms:[{type:12,data:Math.ceil(i/4)},{type:12,data:r}],dispatchGroup:{x:Math.ceil(i/st/4)}})}},nu=e=>{e.inputs.length<2||k.size(e.inputs[1].dims)===0?Ps(e):e.compute(au(e.inputs))}}),su,ou,uu,lu,Np=T(()=>{N(),W(),re(),G(),su=e=>{if(!e||e.length!==2)throw new Error("Gather requires 2 inputs.")},ou=(e,t)=>{let i=e[0].dims,r=e[1].dims,a=i.length,n=k.normalizeAxis(t.axis,a),s=i.slice(0);s.splice(n,1,...r);let o=i[n],u=e[0].dataType===9?4:1,l=Math.ceil(k.size(s)/u),d=[{type:12,data:l},{type:6,data:o},{type:12,data:n},...M(e[0].dims,e[1].dims,s)],p=c=>{let h=S("data",e[0].dataType,e[0].dims.length,u),f=S("inputIndices",e[1].dataType,e[1].dims.length),g=B("output",e[0].dataType,s.length,u),y=m=>{let w=r.length,$=`var indicesIndices${m}  = ${f.type.indices}(0);`;for(let b=0;b<w;b++)$+=`${w>1?`indicesIndices${m}[${b}]`:`indicesIndices${m}`} = ${s.length>1?`outputIndices${m}[uniforms.axis + ${b}]`:`outputIndices${m}`};`;$+=`
var idx${m} = ${f.getByIndices(`indicesIndices${m}`)};
if (idx${m} < 0) {
 idx${m} = idx${m} + uniforms.axisDimLimit;
}
var dataIndices${m} : ${h.type.indices};
`;for(let b=0,x=0;b<a;b++)b===n?($+=`${a>1?`dataIndices${m}[${b}]`:`dataIndices${m}`} = u32(idx${m});`,x+=w):($+=`${a>1?`dataIndices${m}[${b}]`:`dataIndices${m}`} = ${s.length>1?`outputIndices${m}[${x}]`:`outputIndices${m}`};`,x++);return $},_;if(e[0].dataType===9){let m=(w,$,b="")=>`
let outputIndices${$} = ${g.offsetToIndices(`outputOffset + ${$}u`)};
${y($)};
let offset${$} = ${h.indicesToOffset(`dataIndices${$}`)};
let index${$} = offset${$} / 4u;
let component${$} = offset${$} % 4u;
${w}[${$}] = ${b}(${h.getByOffset(`index${$}`)}[component${$}]);
`;_=`
let outputOffset = global_idx * ${u};
var value = vec4<u32>(0);
${m("value",0,"u32")}
${m("value",1,"u32")}
${m("value",2,"u32")}
${m("value",3,"u32")}
${g.setByOffset("global_idx","value")}
`}else _=`
let outputIndices = ${g.offsetToIndices("global_idx")};
${y("")};
let value = ${h.getByIndices("dataIndices")};
${g.setByOffset("global_idx","value")};
`;return`
${c.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(h,f,g)}
${c.mainStart()}
${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
${_}
}`};return{name:"Gather",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:s,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:p}},uu=e=>Q({axis:e.axis}),lu=(e,t)=>{let i=e.inputs;su(i),e.compute(ou(e.inputs,t))}}),du,pu,cu,Vp=T(()=>{N(),W(),G(),du=(e,t,i,r,a,n,s,o,u)=>{let l=[{type:12,data:n},{type:12,data:r},{type:12,data:a},{type:12,data:i},{type:12,data:s},{type:12,data:o},{type:12,data:u}],d=[n];l.push(...M(t.dims,d));let p=c=>{let h=S("indices_data",t.dataType,t.dims.length),f=B("input_slice_offsets_data",12,1,1),g=[h,f],y=[{name:"output_size",type:"u32"},{name:"batch_dims",type:"u32"},{name:"input_dims",type:"u32",length:a.length},{name:"sizes_from_slice_dims_data",type:"u32",length:i.length},{name:"num_slices_per_batch",type:"u32"},{name:"input_batch_stride",type:"u32"},{name:"num_slice_dims",type:"u32"}];return`
${c.registerUniforms(y).declareVariables(...g)}
${c.mainStart()}
${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let batch_idx = global_idx / uniforms.num_slices_per_batch;
let base_offset = batch_idx * uniforms.input_batch_stride;

let slice_indices_base_offset = global_idx * uniforms.num_slice_dims;
var relative_slice_offset = 0;
for (var dim_idx = 0u; dim_idx < uniforms.num_slice_dims; dim_idx ++) {
var index = i32(indices_data[dim_idx + slice_indices_base_offset].x);
let input_dim_idx = uniforms.batch_dims + dim_idx;
if (index < 0) {
${a.length===1?"index += i32(uniforms.input_dims);":"index += i32(uniforms.input_dims[input_dim_idx]);"}
}
${i.length===1?"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data);":"relative_slice_offset += index * i32(uniforms.sizes_from_slice_dims_data[dim_idx]);"}
}

input_slice_offsets_data[global_idx] =  base_offset + u32(relative_slice_offset);
}`};return e.compute({name:"computeSliceOffsets",shaderCache:{hint:`${a.length}_${i.length}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:d,dataType:e.inputs[1].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:l}),getShaderSource:p},{inputs:[t],outputs:[-1]})[0]},pu=(e,t)=>{let i=e.inputs,r=i[0].dims,a=i[0].dataType,n=i[1].dims,s=n[n.length-1],o=k.sizeToDimension(n,n.length-1),u=k.sizeFromDimension(r,t.batchDims+s),l=k.sizeToDimension(r,t.batchDims),d=k.sizeFromDimension(r,t.batchDims),p=o/l,c=new Array(s),h=u;for(let $=0;$<s;++$)c[s-1-$]=h,h*=r[t.batchDims+s-1-$];let f=du(e,i[1],c,t.batchDims,r,o,p,d,s),g=t.batchDims+s;if(g>r.length)throw new Error("last dimension of indices must not be larger than rank of input tensor");let y=n.slice(0,-1).concat(r.slice(g)),_=k.size(y),m=[{type:12,data:_},{type:12,data:u},...M(i[0].dims,f.dims,y)],w=$=>{let b=S("data",i[0].dataType,i[0].dims.length),x=S("slice_offsets",12,f.dims.length),v=B("output",i[0].dataType,y.length);return`
${$.registerUniform("output_size","u32").registerUniform("slice_size","u32").declareVariables(b,x,v)}
 ${$.mainStart()}
 ${$.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let slice_offset = slice_offsets[global_idx / uniforms.slice_size];
output[global_idx] = data[u32(slice_offset) + global_idx % uniforms.slice_size];
}`};e.compute({name:"GatherND",shaderCache:{hint:t.cacheKey,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:y,dataType:a}],dispatchGroup:{x:Math.ceil(_/64)},programUniforms:m}),getShaderSource:w},{inputs:[i[0],f]})},cu=e=>({batchDims:e.batch_dims,cacheKey:""})}),hu,fu,mu,gu,Lp=T(()=>{N(),W(),re(),G(),hu=(e,t)=>{if(e.length<3||e.length>4)throw new Error("GatherBlockQuantized requires 3 or 4 inputs.");let i=k.normalizeAxis(t.quantizeAxis,e[0].dims.length),r=t.blockSize,a=e[0],n=e[2],s=e.length===4?e[3]:void 0;if(n.dims.length!==a.dims.length||!a.dims.map((o,u)=>u===i?Math.ceil(o/r)===n.dims[u]:o===n.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Scales must have the same rank as the input tensor and the dims should match except on gatherAxis.");if(s){if(s.dataType!==a.dataType)throw new Error("Zero point must have the same data type as the input tensor.");if(s.dims.length!==n.dims.length||!s.dims.map((o,u)=>o===n.dims[u]).reduce((o,u)=>o&&u,!0))throw new Error("Zero point must have the same rank as the input tensor and the dims should match except on quantizeAxis.")}},fu=(e,t)=>{let i=e[0].dims,r=e[1].dims,a=i.length,n=k.normalizeAxis(t.gatherAxis,a),s=k.normalizeAxis(t.quantizeAxis,a),o=i.slice(0);o.splice(n,1,...r);let u=k.size(o),l=e[2].dataType,d=e[0].dataType===22,p=[{type:12,data:u},{type:12,data:s},{type:12,data:n},{type:12,data:t.blockSize},...M(...e.map((h,f)=>h.dims),o)],c=h=>{let f=S("data",e[0].dataType,e[0].dims.length),g=S("inputIndices",e[1].dataType,e[1].dims.length),y=S("scales",e[2].dataType,e[2].dims.length),_=e.length>3?S("zeroPoint",e[3].dataType,e[3].dims.length):void 0,m=B("output",l,o.length),w=[f,g,y];_&&w.push(_);let $=[{name:"output_size",type:"u32"},{name:"quantize_axis",type:"u32"},{name:"gather_axis",type:"u32"},{name:"block_size",type:"u32"}];return`
${h.registerUniforms($).declareVariables(...w,m)}
${h.mainStart()}
let output_indices = ${m.offsetToIndices("global_idx")};
var indices_indices = ${g.type.indices}(0);
${r.length>1?`
for (var i: u32 = 0; i < ${r.length}; i++) {
 let index = ${m.indicesGet("output_indices","uniforms.gather_axis + i")};
 ${g.indicesSet("indices_indices","i","index")};
}`:`indices_indices = ${m.indicesGet("output_indices","uniforms.gather_axis")};`};
var data_indices = ${f.type.indices}(0);
for (var i: u32 = 0; i < uniforms.gather_axis; i++) {
let index = ${m.indicesGet("output_indices","i")};
${f.indicesSet("data_indices","i","index")};
}
var index_from_indices = ${g.getByIndices("indices_indices")};
if (index_from_indices < 0) {
index_from_indices += ${i[n]};
}
${f.indicesSet("data_indices","uniforms.gather_axis","u32(index_from_indices)")};
for (var i = uniforms.gather_axis + 1; i < ${o.length}; i++) {
let index = ${m.indicesGet("output_indices",`i + ${r.length} - 1`)};
${f.indicesSet("data_indices","i","index")};
}
let data_offset = ${f.indicesToOffset("data_indices")};
let data_index = data_offset % 8;
// Convert 4-bit packed data to 8-bit packed data.
let packed_4bit_quantized_data = ${f.getByOffset("data_offset / 8")};
let packed_8bit_quantized_data = (packed_4bit_quantized_data >> (4 * (data_index % 2))) & 0x0f0f0f0f;
let quantized_data_vec = ${d?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_quantized_data));
let quantized_data = quantized_data_vec[data_index / 2];
var scale_indices = data_indices;
let quantize_axis_index = ${y.indicesGet("data_indices","uniforms.quantize_axis")} / uniforms.block_size;
${y.indicesSet("scale_indices","uniforms.quantize_axis","quantize_axis_index")};
var scale = ${y.getByIndices("scale_indices")};
${_?`
   let zero_point_indices = scale_indices;
   let zero_point_offset = ${_.indicesToOffset("zero_point_indices")};
   let zero_point_index = zero_point_offset % 8;
   let packed_4bit_zero_points = ${_.getByOffset("zero_point_offset / 8")};
   let packed_8bit_zero_points = (packed_4bit_zero_points >> (4 * (zero_point_index % 2))) & 0x0f0f0f0f;
   let zero_point_vec = ${d?"unpack4xI8":"unpack4xU8"}(u32(packed_8bit_zero_points));
   let zero_point = zero_point_vec[zero_point_index / 2];`:"var zero_point = 0"};
let dequantized_data = ${de(l)}(quantized_data - zero_point) * scale;
${m.setByOffset("global_idx","dequantized_data")};
}`};return{name:"GatherBlockQuantized",shaderCache:{hint:`${t.cacheKey};${e.filter((h,f)=>f!==1).map(h=>h.dims.join("_")).join(";")}`,inputDependencies:Array.from({length:e.length},(h,f)=>"rank")},getRunData:()=>({outputs:[{dims:o,dataType:l}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:p}),getShaderSource:c}},mu=(e,t)=>{let i=e.inputs;hu(i,t),e.compute(fu(e.inputs,t))},gu=e=>Q({blockSize:e.blockSize,gatherAxis:e.gatherAxis,quantizeAxis:e.quantizeAxis})}),_u,yu,$u,wu,Wp=T(()=>{N(),W(),re(),G(),_u=e=>{if(!e||e.length!==2)throw new Error("GatherElements requires 2 inputs.");if(e[0].dims.length<1)throw new Error("GatherElements requires that the data input be rank >= 1.");if(e[0].dims.length!==e[1].dims.length)throw new Error(`GatherElements requires that the data input and
          indices input tensors be of same rank.`)},yu=(e,t)=>{let i=e[0].dims,r=e[0].dataType,a=i.length,n=e[1].dims,s=e[1].dataType,o=k.normalizeAxis(t.axis,a),u=i[o],l=n.slice(0),d=k.size(l),p=S("input",r,a),c=S("indicesInput",s,n.length),h=B("output",r,l.length),f=[{type:12,data:d},{type:6,data:u},{type:12,data:o}];return f.push(...M(i,n,l)),{name:"GatherElements",shaderCache:{inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:l,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:f}),getShaderSource:g=>`
${g.registerUniform("outputSize","u32").registerUniform("axisDimLimit","i32").registerUniform("axis","u32").declareVariables(p,c,h)}
${g.mainStart()}
${g.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

let outputIndices = ${h.offsetToIndices("global_idx")};

var idx = ${c.getByOffset("global_idx")};
if (idx < 0) {
idx = idx + uniforms.axisDimLimit;
}
var inputIndices = ${p.type.indices}(outputIndices);
${p.indicesSet("inputIndices","uniforms.axis","u32(idx)")};
let value = ${p.getByIndices("inputIndices")};

${h.setByOffset("global_idx","value")};
}`}},$u=e=>Q({axis:e.axis}),wu=(e,t)=>{let i=e.inputs;_u(i),e.compute(yu(e.inputs,t))}}),bu,vu,xu,ku,Gp=T(()=>{N(),W(),G(),bu=e=>{if(!e)throw new Error("Input is missing");if(e.length<2||e.length>3)throw new Error("Invaid input number.");if(e.length===3&&e[2].dims.length>2)throw new Error("Invalid input shape of C");if(e[0].dataType!==e[1].dataType||e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("Input types are mismatched")},vu=(e,t)=>{let i=e[0].dims.slice(),r=e[1].dims.slice(),[a,n,s]=Oa.getShapeOfGemmResult(i,t.transA,r,t.transB,e.length===3?e[2].dims:void 0),o=[a,n];if(!o)throw new Error("Can't use gemm on the given tensors");let u=16,l=Math.ceil(n/u),d=Math.ceil(a/u),p=!0,c=k.size(o),h=[{type:12,data:p?l:c},{type:12,data:a},{type:12,data:n},{type:12,data:s},{type:1,data:t.alpha},{type:1,data:t.beta}],f=["type","type"];e.length===3&&(h.push(...M(e[2].dims)),f.push("rank")),h.push(...M(o));let g=_=>{let m="";t.transA&&t.transB?m="value += a[k * uniforms.M + m] * b[n * uniforms.K + k];":t.transA&&!t.transB?m="value += a[k * uniforms.M + m] * b[k * uniforms.N + n];":!t.transA&&t.transB?m="value += a[m * uniforms.K + k] * b[n * uniforms.K + k];":!t.transA&&!t.transB&&(m="value += a[m * uniforms.K + k] * b[k * uniforms.N + n];");let w=t.alpha===1?"":"value *= uniforms.alpha;",$=S("a",e[0].dataType,e[0].dims),b=S("b",e[1].dataType,e[1].dims),x=$.type.value,v=null,I=[$,b];e.length===3&&(v=S("c",e[2].dataType,e[2].dims.length),I.push(v));let z=B("output",e[0].dataType,o.length);I.push(z);let O=[{name:"output_size",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}];return`
${_.registerUniforms(O).declareVariables(...I)}

${_.mainStart()}
${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

let m = global_idx / uniforms.N;
let n = global_idx % uniforms.N;

var value = ${x}(0);
for (var k: u32 = 0u; k < uniforms.K; k++) {
${m}
}

${w}
${v!=null?`let cOffset = ${v.broadcastedIndicesToOffset("vec2(m, n)",z)}; value += ${x}(uniforms.beta) * ${v.getByOffset("cOffset")};`:""}
output[global_idx] = value;
}`},y=_=>{let m=S("a",e[0].dataType,e[0].dims),w=S("b",e[1].dataType,e[1].dims),$=null,b=[m,w];e.length===3&&($=S("c",e[2].dataType,e[2].dims.length),b.push($));let x=B("output",e[0].dataType,o.length);b.push(x);let v=[{name:"num_tile_n",type:"u32"},{name:"M",type:"u32"},{name:"N",type:"u32"},{name:"K",type:"u32"},{name:"alpha",type:"f32"},{name:"beta",type:"f32"}],I="",z="";t.transA&&t.transB?(z=`
var col = tile_row_start + local_id.x;
var row = k_start + local_id.y;
if (col < uniforms.M && row < uniforms.K) {
tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
} else {
tile_a[local_id.y][local_id.x] = ${m.type.value}(0);
}

col = k_start + local_id.x;
row = tile_col_start + local_id.y;
if (col < uniforms.K && row < uniforms.N) {
tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
} else {
tile_b[local_id.y][local_id.x] = ${w.type.value}(0);
}
`,I="value += tile_a[k][local_id.y] * tile_b[local_id.x][k];"):t.transA&&!t.transB?(z=`
var col = tile_row_start + local_id.x;
var row = k_start + local_id.y;
if (col < uniforms.M && row < uniforms.K) {
tile_a[local_id.y][local_id.x] = a[row * uniforms.M + col];
} else {
tile_a[local_id.y][local_id.x] = ${m.type.value}(0);
}

col = tile_col_start + local_id.x;
row = k_start + local_id.y;
if (col < uniforms.N && row < uniforms.K) {
tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
} else {
tile_b[local_id.y][local_id.x] = ${w.type.value}(0);
}
`,I="value += tile_a[k][local_id.y] * tile_b[k][local_id.x];"):!t.transA&&t.transB?(z=`
var col = k_start + local_id.x;
var row = tile_row_start + local_id.y;
if (col < uniforms.K && row < uniforms.M) {
tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
} else {
tile_a[local_id.y][local_id.x] = ${m.type.value}(0);
}

col = k_start + local_id.x;
row = tile_col_start + local_id.y;
if (col < uniforms.K && row < uniforms.N) {
tile_b[local_id.y][local_id.x] = b[row * uniforms.K + col];
} else {
tile_b[local_id.y][local_id.x] = ${w.type.value}(0);
}
`,I="value += tile_a[local_id.y][k] * tile_b[local_id.x][k];"):!t.transA&&!t.transB&&(z=`
var col = k_start + local_id.x;
var row = tile_row_start + local_id.y;
if (col < uniforms.K && row < uniforms.M) {
tile_a[local_id.y][local_id.x] = a[row * uniforms.K + col];
} else {
tile_a[local_id.y][local_id.x] = ${m.type.value}(0);
}

col = tile_col_start + local_id.x;
row = k_start + local_id.y;
if (col < uniforms.N && row < uniforms.K) {
tile_b[local_id.y][local_id.x] = b[row * uniforms.N + col];
} else {
tile_b[local_id.y][local_id.x] = ${w.type.value}(0);
}
`,I="value += tile_a[local_id.y][k] * tile_b[k][local_id.x];");let O=t.alpha===1?"":"value *= uniforms.alpha;";return`
${_.registerUniforms(v).declareVariables(...b)}
var<workgroup> tile_a: array<array<${m.type.storage}, ${u}>, ${u}>;
var<workgroup> tile_b: array<array<${w.type.storage}, ${u}>, ${u}>;
${_.mainStart([u,u,1])}
let tile_col_start = (workgroup_index % uniforms.num_tile_n) * ${u};
let tile_row_start = (workgroup_index / uniforms.num_tile_n) * ${u};
let num_tiles = (uniforms.K - 1) / ${u} + 1;
var k_start = 0u;
var value = ${x.type.value}(0);
for (var t: u32 = 0u; t < num_tiles; t++) {
${z}
k_start = k_start + ${u};
workgroupBarrier();

for (var k: u32 = 0u; k < ${u}; k++) {
${I}
}
workgroupBarrier();
}

${O}
let m = tile_row_start + local_id.y;
let n = tile_col_start + local_id.x;
${$!=null?`let cOffset = ${$.broadcastedIndicesToOffset("vec2(m, n)",x)}; value += ${x.type.value}(uniforms.beta) * ${$.getByOffset("cOffset")};`:""}
if (m < uniforms.M && n < uniforms.N) {
output[m * uniforms.N + n] = value;
}
}`};return p?{name:"GemmShared",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:l*d},programUniforms:h}),getShaderSource:y}:{name:"Gemm",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:o,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:h}),getShaderSource:g}},xu=e=>{let t=e.transA,i=e.transB,r=e.alpha,a=e.beta;return{transA:t,transB:i,alpha:r,beta:a,cacheKey:`${e.transA};${e.transB};${e.alpha===1}`}},ku=(e,t)=>{bu(e.inputs),e.compute(vu(e.inputs,t))}}),Me,Ne,et,tt,Su,Iu,Tu,zu,Eu,Cu,Ou,Au,Bu,Ru,Hp=T(()=>{N(),W(),re(),G(),[Me,Ne,et,tt]=[0,1,2,3],Su=e=>{if(e[0].dims.length!==4)throw new Error("only 4-D tensor is supported.");if(e[0].dims.length!==e[1].dims.length)throw new Error("input dimensions must be equal to grid dimensions");if(e[0].dims.length-2!==e[1].dims[e[1].dims.length-1])throw new Error(`last dimension of grid must be equal to ${e[0].dims.length-2}`);if(e[0].dims[0]!==e[1].dims[0])throw new Error("grid batch size must match input batch size")},Iu=`
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
`,Tu=e=>`
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
`,zu=e=>`
fn gs_denormalize(n: f32, length: i32) -> f32 {
${e.alignCorners===0?`
// alignCorners: false => [-1, 1] to [-0.5, length - 0.5]
return ((n + 1.0) * f32(length) - 1.0) / 2.0;
`:`
// alignCorners: true => [-1, 1] to [0, length - 1]
return (n + 1.0) / 2.0 * (f32(length - 1));
`}
}
`,Eu=e=>`
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
`,Cu=(e,t,i)=>`
fn pixel_at_grid(r: i32, c: i32, H: i32, W: i32, batch: u32, channel: u32, border: vec4<f32>) -> ${t} {
var pixel = ${t}(0);
var indices = vec4<u32>(0);
indices[${Me}] = batch;
indices[${Ne}] = channel;`+(()=>{switch(i.paddingMode){case"zeros":return`
if (r >= 0 && r < H && c >=0 && c < W) {
 indices[${et}] = u32(r);
 indices[${tt}] = u32(c);
} else {
 return ${t}(0);
}
`;case"border":return`
indices[${et}] = u32(clamp(r, 0, H - 1));
indices[${tt}] = u32(clamp(c, 0, W - 1));
`;case"reflection":return`
indices[${et}] = gs_reflect(r, border[1], border[3]);
indices[${tt}] = gs_reflect(c, border[0], border[2]);
`;default:throw new Error(`padding mode ${i.paddingMode} is not supported`)}})()+`
return ${e.getByIndices("indices")};
}
`,Ou=(e,t,i)=>(()=>{switch(i.mode){case"nearest":return`
let result = pixel_at_grid(i32(round(y)), i32(round(x)), H_in, W_in, indices[${Me}], indices[${Ne}], border);
`;case"bilinear":return`
let x1 = i32(floor(x));
let y1 = i32(floor(y));
let x2 = x1 + 1;
let y2 = y1 + 1;

let p11 = pixel_at_grid(y1, x1, H_in, W_in, indices[${Me}], indices[${Ne}], border);
let p12 = pixel_at_grid(y1, x2, H_in, W_in, indices[${Me}], indices[${Ne}], border);
let p21 = pixel_at_grid(y2, x1, H_in, W_in, indices[${Me}], indices[${Ne}], border);
let p22 = pixel_at_grid(y2, x2, H_in, W_in, indices[${Me}], indices[${Ne}], border);

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
   p[h][w] = pixel_at_grid(h + y0, w + x0, H_in, W_in, indices[${Me}], indices[${Ne}], border);
 }
}

let dx = x - f32(x0 + 1);
let dy = y - f32(y0 + 1);
let result = gs_bicubic_interpolate(p, dx, dy);
`;default:throw new Error(`mode ${i.mode} is not supported`)}})()+`${e.setByOffset("global_idx","result")}`,Au=(e,t)=>{let i=S("x",e[0].dataType,e[0].dims.length),r=[e[1].dims[0],e[1].dims[1],e[1].dims[2]],a=S("grid",e[1].dataType,r.length,2),n=[e[0].dims[0],e[0].dims[1],e[1].dims[1],e[1].dims[2]];t.format==="NHWC"&&(n=[e[0].dims[0],e[1].dims[1],e[1].dims[2],e[0].dims[3]],[Me,Ne,et,tt]=[0,3,1,2]);let s=B("output",e[0].dataType,n.length),o=i.type.value,u=k.size(n),l=[{type:12,data:u},...M(e[0].dims,r,n)],d=p=>`
${p.registerUniform("output_size","u32").declareVariables(i,a,s)}
${Iu}
${Tu(o)}
${zu(t)}
${Eu(t)}
${Cu(i,o,t)}

${p.mainStart()}
${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let H_in = i32(uniforms.x_shape[${et}]);
let W_in = i32(uniforms.x_shape[${tt}]);

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

let indices = ${s.offsetToIndices("global_idx")};
var grid_indices = vec3<u32>(indices[${Me}], indices[${et}], indices[${tt}]);
let nxy = ${a.getByIndices("grid_indices")};
var x = gs_denormalize(f32(nxy[0]), W_in);
var y = gs_denormalize(f32(nxy[1]), H_in);

${Ou(s,o,t)}
}`;return{name:"GridSample",shaderCache:{hint:`${t.cacheKey}`,inputDependencies:["type","type"]},getRunData:p=>{let c=k.size(n);return{outputs:[{dims:n,dataType:p[0].dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:l}},getShaderSource:d}},Bu=(e,t)=>{Su(e.inputs),e.compute(Au(e.inputs,t))},Ru=e=>Q({alignCorners:e.align_corners,mode:e.mode,paddingMode:e.padding_mode,format:e.format})}),he,Du,Mu,hr,Uu,bt,Pu,qu=T(()=>{N(),W(),re(),Bi(),Gi(),G(),We(),he=(e,t)=>e.length>t&&e[t].dims.length>0?e[t]:void 0,Du=(e,t)=>{let i=e[0],r=he(e,1),a=he(e,2),n=he(e,3),s=he(e,4),o=he(e,5),u=he(e,6),l=he(e,7);if(i.dims.length!==3&&i.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let d=i.dims[0],p=i.dims[1],c=i.dims.length===3?i.dims[2]:t.numHeads*i.dims[4],h=p,f=0,g=0,y=Math.floor(c/t.numHeads);if(u&&l&&k.size(u.dims)&&k.size(l.dims)){if(u.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(u.dims[0]!==d||u.dims[1]!==t.numHeads||u.dims[3]!==y)throw new Error('Input "past_key" shape (batch_size, num_heads, past_sequence_length, head_size)');if(l.dims[0]!==d||l.dims[1]!==t.numHeads||l.dims[3]!==y)throw new Error('Input "past_value" shape (batch_size, num_heads, past_sequence_length, head_size)');if(u.dims[2]!==l.dims[2])throw new Error('Input "past_key" and "past_value" shall have same dim 2 (past_sequence_length)');if(l.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');f=u.dims[2],g=u.dims[2]}else if(u&&k.size(u.dims)||l&&k.size(l.dims))throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _;if(r&&k.size(r.dims)>0){if(i.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(r.dims.length<3||r.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(i.dims[0]!==r.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(r.dims.length===3){if(r.dims[2]!==i.dims[2])throw new Error('Input "query" and "key" shall have same dim 2 (hidden_size)');_=2,h=r.dims[1]}else if(r.dims.length===5){if(r.dims[2]!==t.numHeads||r.dims[3]!==2||r.dims[4]!==y)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');_=5,h=r.dims[1]}else{if(r.dims[1]!==t.numHeads||r.dims[3]!==y)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');_=0,h=r.dims[2]}}else{if(i.dims.length!==5)throw new Error('Input "query" is expected to have 5 dimensions when key is empty');if(i.dims[2]!==t.numHeads||i.dims[3]!==3)throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}if(n&&k.size(n.dims)>0){if(n.dims.length!==1)throw new Error('Input "bias" is expected to have 1 dimension');if(r&&r.dims.length===5&&r.dims[3]===2)throw new Error("bias is not allowed for packed kv.")}let m=f+h,w=0;if(s&&k.size(s.dims)>0){w=8;let v=s.dims;throw v.length===1?v[0]===d?w=1:v[0]===3*d+2&&(w=3):v.length===2&&v[0]===d&&v[1]===m&&(w=5),w===8?new Error('Input "key_padding_mask" shape shall be (batch_size) or (batch_size, total_sequence_length)'):new Error("Mask not supported")}let $=!1,b=c;if(a&&k.size(a.dims)>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(i.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(h!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');b=a.dims[2]}else{if(h!==a.dims[2])throw new Error('Input "key" and "value" shall have the same dim 2 (kv_sequence_length)');b=a.dims[1]*a.dims[3],$=!0}}let x=!1;if(s&&k.size(s.dims)>0)throw new Error("Key padding mask is not supported");if(o&&k.size(o.dims)>0){if(o.dims.length!==4)throw new Error('Input "attention_bias" is expected to have 4 dimensions');if(o.dims[0]!==d||o.dims[1]!==t.numHeads||o.dims[2]!==p||o.dims[3]!==m)throw new Error('Expect "attention_bias" shape (batch_size, num_heads, sequence_length, total_sequence_length)')}return{batchSize:d,sequenceLength:p,pastSequenceLength:f,kvSequenceLength:h,totalSequenceLength:m,maxSequenceLength:g,inputHiddenSize:0,hiddenSize:c,vHiddenSize:b,headSize:y,vHeadSize:Math.floor(b/t.numHeads),numHeads:t.numHeads,isUnidirectional:!1,pastPresentShareBuffer:!1,maskFilterValue:t.maskFilterValue,maskType:w,scale:t.scale,broadcastResPosBias:x,passPastInKv:$,qkvFormat:_}},Mu=e=>Q({...e}),hr=Q({perm:[0,2,1,3]}),Uu=(e,t,i,r,a,n,s)=>{let o=[r,a,n],u=k.size(o),l=[{type:12,data:u},{type:12,data:s},{type:12,data:n}],d=p=>{let c=B("qkv_with_bias",t.dataType,o),h=S("qkv",t.dataType,o),f=S("bias",i.dataType,o),g=[{name:"output_size",type:"u32"},{name:"bias_offset",type:"u32"},{name:"hidden_size",type:"u32"}];return`
${p.registerUniforms(g).declareVariables(h,f,c)}
${p.mainStart()}
${p.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let bias_offset_idx = (global_idx % uniforms.hidden_size) + uniforms.bias_offset;

qkv_with_bias[global_idx] = qkv[global_idx] + bias[bias_offset_idx];
}`};return e.compute({name:"MultiHeadAttentionAddBias",shaderCache:{inputDependencies:["type","type"]},getRunData:()=>({outputs:[{dims:o,dataType:t.dataType,gpuDataType:0}],dispatchGroup:{x:Math.ceil(u/64)},programUniforms:l}),getShaderSource:d},{inputs:[t,i],outputs:[-1]})[0]},bt=(e,t,i,r,a,n,s,o)=>{let u=n;if(s&&k.size(s.dims)>0){if(r===1)throw new Error("AddBiasReshape is not implemented. Please export your model with packed QKV or KV");return u=Uu(e,n,s,t,r,i*a,o),u=u.reshape([t,r,i,a]),i===1||r===1?u:e.compute(we(u,hr.perm),{inputs:[u],outputs:[-1]})[0]}else return n.dims.length===3&&(u=n.reshape([t,r,i,a])),i===1||r===1?u:e.compute(we(u,hr.perm),{inputs:[u],outputs:[-1]})[0]},Pu=(e,t)=>{let i=Du(e.inputs,t),r=e.inputs[0],a=he(e.inputs,1),n=he(e.inputs,2),s=he(e.inputs,3),o=he(e.inputs,4),u=he(e.inputs,5),l=he(e.inputs,6),d=he(e.inputs,7);if(r.dims.length===5)throw new Error("Packed QKV is not implemented");if(a?.dims.length===5)throw new Error("Packed KV is not implemented");let p=a&&n&&a.dims.length===4&&n.dims.length===4,c=bt(e,i.batchSize,i.numHeads,i.sequenceLength,i.headSize,r,s,0);if(p)return gt(e,c,a,n,o,void 0,l,d,u,i);if(!a||!n)throw new Error("key and value must be provided");let h=bt(e,i.batchSize,i.numHeads,i.kvSequenceLength,i.headSize,a,s,i.hiddenSize),f=bt(e,i.batchSize,i.numHeads,i.kvSequenceLength,i.vHeadSize,n,s,2*i.hiddenSize);gt(e,c,h,f,o,void 0,l,d,u,i)}}),Nu,Vu,Lu,Wu,fr,Gu,Hu,Fu=T(()=>{N(),W(),re(),G(),Nu=e=>{if(!e||e.length<1)throw new Error("too few inputs")},Vu=(e,t)=>{let i=[],r=t.numOutputs;return e[1].dims[0]>0&&(e[1].getBigInt64Array().forEach(a=>i.push(Number(a))),r=i.length),Q({numOutputs:r,axis:t.axis,splitSizes:i})},Lu=e=>`
fn calculateOutputIndex(index: u32) -> u32 {
for (var i: u32 = 0u; i < ${e}u; i += 1u ) {
if (index < ${R("uniforms.size_in_split_axis","i",e)}) {
return i;
}
}
return ${e}u;
}`,Wu=e=>{let t=e.length,i=[];for(let r=0;r<t;++r){let a=e[r].setByIndices("indices","input[global_idx]");t===1?i.push(a):r===0?i.push(`if (output_number == ${r}u) { ${a} }`):r===t-1?i.push(`else { ${a} }`):i.push(`else if (output_number == ${r}) { ${a} }`)}return`
fn writeBufferData(output_number: u32, indices: ${e[0].type.indices}, global_idx: u32) {
${i.join(`
`)}
}`},fr=(e,t)=>{let i=e[0].dims,r=k.size(i),a=e[0].dataType,n=k.normalizeAxis(t.axis,i.length),s=new Array(t.numOutputs),o=S("input",a,i.length),u=new Array(t.numOutputs),l=[],d=[],p=0,c=[{type:12,data:r}];for(let f=0;f<t.numOutputs;f++){p+=t.splitSizes[f],u[f]=p;let g=i.slice();g[n]=t.splitSizes[f],d.push(g),s[f]=B(`output${f}`,a,g.length),l.push({dims:d[f],dataType:e[0].dataType})}c.push({type:12,data:u},...M(i,...d));let h=f=>`
${f.registerUniform("input_size","u32").registerUniform("size_in_split_axis","u32",u.length).declareVariables(o,...s)}
${Lu(u.length)}
${Wu(s)}

${f.mainStart()}
${f.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.input_size")}

var indices = ${o.offsetToIndices("global_idx")};
var index = ${o.indicesGet("indices",n)};
let output_number = calculateOutputIndex(index);
if (output_number != 0) {
index -= ${R("uniforms.size_in_split_axis","output_number - 1u",u.length)};
${o.indicesSet("indices",n,"index")};
}
writeBufferData(output_number, indices, global_idx);
}`;return{name:"Split",shaderCache:{hint:t.cacheKey,inputDependencies:["rank"]},getShaderSource:h,getRunData:()=>({outputs:l,dispatchGroup:{x:Math.ceil(r/64)},programUniforms:c})}},Gu=(e,t)=>{Nu(e.inputs);let i=e.inputs.length===1?t:Vu(e.inputs,t);e.compute(fr(e.inputs,i),{inputs:[0]})},Hu=e=>{let t=e.axis,i=e.splitSizes,r=e.numOutputs<0?i.length:e.numOutputs;if(r!==i.length)throw new Error("numOutputs and splitSizes lengh must be equal");return Q({axis:t,numOutputs:r,splitSizes:i})}}),ju,Kt,Ku,Zu=T(()=>{N(),W(),re(),G(),ju=(e,t)=>{let[i,r,a,n]=e,{numHeads:s,rotaryEmbeddingDim:o}=t;if(i.dims.length!==3&&i.dims.length!==4)throw new Error(`Input 'x' is expected to have 3 or 4 dimensions, got ${i.dims.length}`);if(!k.areEqual(r.dims,[])&&!k.areEqual(r.dims,[1])&&r.dims.length!==2)throw new Error(`Input 'position_ids' is expected to have 0, 1, or 2 dimensions, got ${r.dims.length}`);if(a.dims.length!==2)throw new Error(`Input 'cos_cache' is expected to have 2 dimensions, got ${a.dims.length}`);if(n.dims.length!==2)throw new Error(`Input 'sin_cache' is expected to have 2 dimensions, got ${n.dims.length}`);if(!k.areEqual(a.dims,n.dims))throw new Error("Inputs 'cos_cache' and 'sin_cache' are expected to have the same shape");if(o>0&&s===0)throw new Error("num_heads must be provided if rotary_embedding_dim is specified");let u=i.dims[0],l=i.dims[i.dims.length-2],d=a.dims[0],p=k.sizeFromDimension(i.dims,1)/l,c=o===0?a.dims[1]*2:p/s;if(o>c)throw new Error("rotary_embedding_dim must be less than or equal to head_size");if(r.dims.length===2){if(u!==r.dims[0])throw new Error(`Input 'position_ids' dimension 0 should be of size batch_size, got ${r.dims[0]}`);if(l!==r.dims[1])throw new Error(`Input 'position_ids' dimension 1 should be of size sequence_length, got ${r.dims[1]}`)}if(c/2!==a.dims[1]&&o/2!==a.dims[1])throw new Error(`Input 'cos_cache' dimension 1 should be same as head_size / 2 or rotary_embedding_dim / 2, got ${a.dims[1]}`);if(l>d)throw new Error("Updating cos_cache and sin_cache in RotaryEmbedding is not currently supported")},Kt=(e,t)=>{let{interleaved:i,numHeads:r,rotaryEmbeddingDim:a,scale:n}=t,s=e[0].dims[0],o=k.sizeFromDimension(e[0].dims,1),u=e[0].dims[e[0].dims.length-2],l=o/u,d=e[2].dims[1],p=a===0?d*2:l/r,c=new Array(s,u,l/p,p-d),h=k.computeStrides(c),f=[{type:1,data:n},{type:12,data:c},{type:12,data:h},...e[0].dims.length===3?new Array({type:12,data:[o,l,p,1]}):[],...e[0].dims.length===4?new Array({type:12,data:[o,p,u*p,1]}):[],...M(e[0].dims,e[1].dims,e[2].dims,e[3].dims,e[0].dims)],g=y=>{let _=S("input",e[0].dataType,e[0].dims.length),m=S("position_ids",e[1].dataType,e[1].dims.length),w=S("cos_cache",e[2].dataType,e[2].dims.length),$=S("sin_cache",e[3].dataType,e[3].dims.length),b=B("output",e[0].dataType,e[0].dims.length);return y.registerUniforms([{name:"scale",type:"f32"},{name:"global_shape",type:"u32",length:c.length},{name:"global_strides",type:"u32",length:h.length},{name:"input_output_strides",type:"u32",length:h.length}]),`
${y.declareVariables(_,m,w,$,b)}

${y.mainStart(st)}
let half_rotary_emb_dim = uniforms.${w.name}_shape[1];
let bsnh = global_idx / uniforms.global_strides % uniforms.global_shape;
let size = uniforms.global_shape[0] * uniforms.global_strides[0];
${y.guardAgainstOutOfBoundsWorkgroupSizes("size")}

if (bsnh[3] < half_rotary_emb_dim) {
 let position_ids_idx =
     ${m.broadcastedIndicesToOffset("bsnh.xy",B("",m.type.tensor,2))};
 let position_id =
     u32(${m.getByOffset("position_ids_idx")}) + select(0, bsnh[1], position_ids_idx == 0);
 let i = dot(bsnh, uniforms.input_output_strides) + select(0, bsnh[3], ${i});
 let j = i + select(half_rotary_emb_dim, 1, ${i});
 let re = ${_.getByOffset("i")} * ${w.get("position_id","bsnh[3]")} -
     ${_.getByOffset("j")} * ${$.get("position_id","bsnh[3]")};
 ${b.setByOffset("i","re")}
 let im = ${_.getByOffset("i")} * ${$.get("position_id","bsnh[3]")} +
     ${_.getByOffset("j")} * ${w.get("position_id","bsnh[3]")};
 ${b.setByOffset("j","im")}
} else {
 let k = dot(bsnh, uniforms.input_output_strides) + half_rotary_emb_dim;
 ${b.setByOffset("k",_.getByOffset("k"))}
}
}`};return{name:"RotaryEmbedding",shaderCache:{hint:Q({interleaved:i}).cacheKey,inputDependencies:["rank","rank","rank","rank"]},getShaderSource:g,getRunData:()=>({outputs:[{dims:e[0].dims,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(k.size(c)/st)},programUniforms:f})}},Ku=(e,t)=>{ju(e.inputs,t),e.compute(Kt(e.inputs,t))}}),Qu,Xu,mr,Yu,Ju,Fp=T(()=>{re(),N(),Gi(),qu(),Fu(),We(),Zu(),G(),Qu=(e,t)=>{if(t.doRotary&&e.length<=7)throw new Error("cos_cache and sin_cache inputs are required if do_rotary is specified");let i=e[0],r=e[1],a=e[2],n=e[3],s=e[4];if(t.doRotary!==0&&e.length<=7)throw new Error("cos_cast and sin_cache are expected if do_rotary attribute is non-zero");if(t.localWindowSize!==-1)throw new Error("Local attention is not supported");if(t.softcap!==0)throw new Error("Softcap is not supported");if(t.rotaryInterleaved!==0)throw new Error("Rotary interleaved is not supported");if(t.smoothSoftmax)throw new Error("Smooth softmax is not supported");if(i.dims.length!==3&&i.dims.length!==5)throw new Error("Input query is expected to have 3 or 5 dimensions");let o=!1,u=i.dims[0],l=i.dims[1],d=i.dims.length===3?o?i.dims[2]/3:i.dims[2]:t.numHeads*i.dims[4],p=l,c=0,h=!r||r.dims.length===0,f=Math.floor(h?d/(t.numHeads+2*t.kvNumHeads):d/t.numHeads);h&&(d=f*t.numHeads);let g=n&&n.dims.length!==0,y=s&&s.dims.length!==0;if(g&&n.dims.length===4&&n.dims[0]===u&&n.dims[1]!==t.kvNumHeads&&n.dims[2]===t.kvNumHeads&&n.dims[3]===f)throw new Error("BSNH pastKey/pastValue is not supported");if(g&&y){if(n.dims.length!==4)throw new Error('Input "past_key" is expected to have 4 dimensions');if(s.dims.length!==4)throw new Error('Input "past_value" is expected to have 4 dimensions');c=n.dims[2]}else if(g||y)throw new Error('Input "past_key" and "past_value" shall be both present or both absent');let _=1;if(r&&r.dims.length>0){if(i.dims.length!==3)throw new Error('Input "query" is expected to have 3 dimensions when key is given');if(r.dims.length<3||r.dims.length>5)throw new Error('Input "key" is expected to have 3, 4, or 5 dimensions');if(i.dims[0]!==r.dims[0])throw new Error('Input "query" and "key" shall have same dim 0 (batch size)');if(r.dims.length===3){if(i.dims[2]%r.dims[2]!==0)throw new Error('Dimension 2 of "query" should be a multiple of "key"');p=r.dims[1]}else if(r.dims.length===5){if(r.dims[2]!==t.numHeads||r.dims[3]!==2||r.dims[4]!==f)throw new Error('Expect "key" shape (batch_size, kv_sequence_length, num_heads, 2, head_size) for packed kv');if(a)throw new Error('Expect "value" be none when "key" has packed kv format.');p=r.dims[1]}else{if(r.dims[1]!==t.numHeads||r.dims[3]!==f)throw new Error('Expect "key" shape (batch_size, num_heads, kv_sequence_length, head_size) for past_key');p=r.dims[2]}}else{if(i.dims.length!==3&&i.dims.length!==5)throw new Error('Input "query" is expected to have 3 or 5 dimensions when key is empty');if(i.dims.length===5&&(i.dims[2]!==t.numHeads||i.dims[3]!==3))throw new Error('Expect "query" shape (batch_size, kv_sequence_length, num_heads, 3, head_size) for packed kv');_=3}let m=0,w=!1,$=t.kvNumHeads?f*t.kvNumHeads:d;if(a&&a.dims.length>0){if(a.dims.length!==3&&a.dims.length!==4)throw new Error('Input "value" is expected to have 3 or 4 dimensions');if(i.dims[0]!==a.dims[0])throw new Error('Input "query" and "value" shall have same dim 0 (batch_size)');if(a.dims.length===3){if(p!==a.dims[1])throw new Error('Input "key" and "value" shall have the same dim 1 (kv_sequence_length)');$=a.dims[2]}else{if(p!==a.dims[2])throw new Error('Input "past_key" and "past_value" shall have the same dim 2 (kv_sequence_length)');$=a.dims[1]*a.dims[3],w=!0}}let b=e.length>4?e[5]:void 0;if(b&&b.dims.length!==1&&b.dims[0]!==u)throw new Error('Input "seqlens" is expected to have 1 dimension and the same dim 0 as batch_size');return{batchSize:u,sequenceLength:l,pastSequenceLength:c,kvSequenceLength:p,totalSequenceLength:-1,maxSequenceLength:-1,inputHiddenSize:0,hiddenSize:d,vHiddenSize:$,headSize:f,vHeadSize:Math.floor($/t.kvNumHeads),numHeads:t.numHeads,kvNumHeads:t.kvNumHeads,nReps:t.numHeads/t.kvNumHeads,pastPresentShareBuffer:!1,maskType:m,scale:t.scale,broadcastResPosBias:!1,passPastInKv:w,qkvFormat:_}},Xu=Q({perm:[0,2,1,3]}),mr=(e,t,i)=>{let r=t,a=i.kvNumHeads;return t.dims.length===3&&i.kvSequenceLength!==0&&(r=t.reshape([i.batchSize,i.kvSequenceLength,a,i.headSize]),r=e.compute(we(r,Xu.perm),{inputs:[r],outputs:[-1]})[0]),r},Yu=(e,t,i,r)=>{let a=7,n=["type","type"],s=[e*t],o=e*t,u=[{type:12,data:o},{type:12,data:t},{type:12,data:e}],l=d=>{let p=S("seq_lens",i.dataType,i.dims),c=S("total_seq_lens",r.dataType,r.dims),h=B("pos_ids",a,s),f=[{name:"output_size",type:"u32"},{name:"sequence_length",type:"u32"},{name:"batch_size",type:"u32"}];return`
${d.registerUniforms(f).declareVariables(p,c,h)}
${d.mainStart()}
${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let total_sequence_length = u32(${c.getByOffset("0")});
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
${h.setByOffset("global_idx","pos_id")}
} else if (is_subsequent_prompt) {
let past_seqlen = total_seqlen - i32(uniforms.sequence_length);
if (past_seqlen + sequence_idx < total_seqlen) {
pos_id = past_seqlen + sequence_idx;
} else {
pos_id = 1;
}
${h.setByOffset("global_idx","pos_id")}
} else if (global_idx < uniforms.batch_size) {
${h.setByOffset("global_idx","seqlen")}
};
}
`};return{name:"GeneratePositionIds",shaderCache:{hint:`${e};${t}`,inputDependencies:n},getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(o/64)},programUniforms:u}),getShaderSource:l}},Ju=(e,t)=>{let i=Qu(e.inputs,t);if(e.inputs[0].dims.length===5)throw new Error("Packed QKV is not implemented");if(e.inputs[1]?.dims.length===5)throw new Error("Packed KV is not implemented");let r=e.inputs[0],a=e.inputs[1]&&e.inputs[1].dims.length>0?e.inputs[1]:void 0,n=e.inputs[2]&&e.inputs[2].dims.length>0?e.inputs[2]:void 0,s=e.inputs[3]&&e.inputs[3].dims.length!==0?e.inputs[3]:void 0,o=e.inputs[4]&&e.inputs[4].dims.length!==0?e.inputs[4]:void 0,u=e.inputs.length>4?e.inputs[5]:void 0,l=e.inputs.length>5?e.inputs[6]:void 0,d=i.kvNumHeads?i.kvNumHeads:i.numHeads,p=Q({axis:2,numOutputs:3,splitSizes:[i.numHeads*i.headSize,d*i.headSize,d*i.headSize]}),[c,h,f]=!a&&!n?e.compute(fr([r],p),{inputs:[r],outputs:[-1,-1,-1]}):[r,a,n],g,y;if(t.doRotary){let $=e.compute(Yu(i.batchSize,i.sequenceLength,u,l),{inputs:[u,l],outputs:[-1]})[0],b=e.inputs[7],x=e.inputs[8],v=Q({interleaved:t.rotaryInterleaved!==0,numHeads:i.numHeads,rotaryEmbeddingDim:0,scale:t.scale}),I=[c,$,b,x],z=[-1];g=e.compute(Kt(I,v),{inputs:I,outputs:z})[0],I.splice(0,1,h);let O=Q({interleaved:t.rotaryInterleaved!==0,numHeads:i.kvNumHeads,rotaryEmbeddingDim:0,scale:t.scale});y=e.compute(Kt(I,O),{inputs:I,outputs:z})[0]}let _=bt(e,i.batchSize,i.numHeads,i.sequenceLength,i.headSize,t.doRotary?g:c,void 0,0),m=mr(e,t.doRotary?y:h,i),w=mr(e,f,i);gt(e,_,m,w,void 0,void 0,s,o,void 0,i,u,l)}}),gr,el,tl,il,jp=T(()=>{N(),W(),We(),G(),gr=(e,t,i,r,a,n,s,o)=>{let u=ie(n),l=u===1?"f32":`vec${u}f`,d=u===1?"vec2f":`mat2x${u}f`,p=a*s,c=64;p===1&&(c=256);let h=[a,s,n/u],f=[a,s,2],g=["rank","type","type"],y=[];y.push(...M(h,f));let _=m=>{let w=S("x",t.dataType,3,u),$=S("scale",i.dataType,i.dims),b=S("bias",r.dataType,r.dims),x=B("output",1,3,2),v=[w,$,b,x];return`
var<workgroup> workgroup_shared : array<${d}, ${c}>;
const workgroup_size = ${c}u;
${m.declareVariables(...v)}
${m.mainStart(c)}
let batch = workgroup_index / uniforms.x_shape[1];
let channel = workgroup_index % uniforms.x_shape[1];
let hight = uniforms.x_shape[2];
// initialize workgroup memory
var sum = ${l}(0);
var squared_sum = ${l}(0);
for (var h = local_idx; h < hight; h += workgroup_size) {
let value = ${l}(${w.get("batch","channel","h")});
sum += value;
squared_sum += value * value;
}
workgroup_shared[local_idx] = ${d}(sum, squared_sum);
workgroupBarrier();

for (var currSize = workgroup_size >> 1;  currSize > 0; currSize = currSize >> 1) {
if (local_idx < currSize) {
workgroup_shared[local_idx] = workgroup_shared[local_idx] + workgroup_shared[local_idx + currSize];
}
workgroupBarrier();
}
if (local_idx == 0) {
let sum_final = ${Le("workgroup_shared[0][0]",u)} / f32(hight * ${u});
let squared_sum_final = ${Le("workgroup_shared[0][1]",u)} / f32(hight * ${u});

let inv_std_dev = inverseSqrt(squared_sum_final - sum_final * sum_final + f32(${o}));
let channel_scale = inv_std_dev * f32(scale[channel]);
let channel_shift = f32(bias[channel]) - sum_final * channel_scale;
output[workgroup_index] = vec2f(channel_scale, channel_shift);
}
}`};return e.compute({name:"InstanceNormComputeChannelScaleShift",shaderCache:{hint:`${u};${o};${c}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:f,dataType:1}],dispatchGroup:{x:p},programUniforms:y}),getShaderSource:_},{inputs:[t,i,r],outputs:[-1]})[0]},el=(e,t,i)=>{let r=t[0].dims,a=r,n=2,s=r[0],o=r[1],u=k.sizeFromDimension(r,n),l=ie(u),d=k.size(a)/l,p=gr(e,t[0],t[1],t[2],s,u,o,i.epsilon),c=[s,o,u/l],h=[s,o],f=["type","none"],g=y=>{let _=S("x",t[0].dataType,c.length,l),m=S("scale_shift",1,h.length,2),w=B("output",t[0].dataType,c.length,l),$=[_,m,w];return`
${y.registerUniform("output_size","u32").declareVariables(...$)}
${y.mainStart()}
${y.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let outputIndices = ${w.offsetToIndices("global_idx")};
let batch = outputIndices[0];
let channel = outputIndices[1];
let scale_shift = ${m.getByIndices("vec2<u32>(batch, channel)")};
let value = ${_.getByOffset("global_idx")} * ${w.type.value}(scale_shift.x) + ${w.type.value}(scale_shift.y);
${w.setByOffset("global_idx","value")};
}`};e.compute({name:"InstanceNormalization",shaderCache:{hint:`${l}`,inputDependencies:f},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(d/64)},programUniforms:[{type:12,data:d},...M(c,h,c)]}),getShaderSource:g},{inputs:[t[0],p]})},tl=(e,t,i)=>{let r=t[0].dims,a=r,n=r[0],s=r[r.length-1],o=k.sizeFromDimension(r,1)/s,u=ie(s),l=k.size(a)/u,d=[{type:12,data:o},{type:12,data:Math.floor(s/u)}],p=["type","type"],c=!1,h=[0,r.length-1];for(let _=0;_<r.length-2;_++)c=c||r[_+1]!==1,h.push(_+1);c=c&&r[r.length-1]!==1;let f=c?e.compute(we(e.inputs[0],h),{inputs:[e.inputs[0]],outputs:[-1]})[0]:e.inputs[0].reshape(Array.from({length:r.length},(_,m)=>r[h[m]])),g=gr(e,f,t[1],t[2],n,o,s,i.epsilon),y=_=>{let m=se(t[0].dataType),w=u===1?"vec2f":`mat${u}x2f`,$=v=>{let I=v===0?"x":"y",z=u===1?"f32":`vec${u}f`;switch(u){case 1:return`${m}(${z}(scale.${I}))`;case 2:return`vec2<${m}>(${z}(scale[0].${I}, scale[1].${I}))`;case 4:return`vec4<${m}>(${z}(scale[0].${I}, scale[1].${I}, scale[2].${I}, scale[3].${I}))`;default:throw new Error(`Not supported compoents ${u}`)}},b=S("input",t[0].dataType,t[0].dims,u),x=B("output",t[0].dataType,a,u);return`
@group(0) @binding(0) var<storage, read> input : array<${b.type.storage}>;
@group(0) @binding(1) var<storage, read> scale_input : array<${w}>;
@group(0) @binding(2) var<storage, read_write> output : array<${x.type.storage}>;
struct Uniforms {H: u32, C : u32};
@group(0) @binding(3) var<uniform> uniforms: Uniforms;

${_.mainStart()}
let current_image_number = global_idx / (uniforms.C * uniforms.H);
let current_channel_number = global_idx % uniforms.C;

let scale_offset = current_image_number * uniforms.C + current_channel_number;
let scale = scale_input[scale_offset];
output[global_idx] = fma(input[global_idx], ${$(0)}, ${$(1)});
}`};e.compute({name:"InstanceNormalizationNHWC",shaderCache:{hint:`${u}`,inputDependencies:p},getRunData:()=>({outputs:[{dims:a,dataType:t[0].dataType}],dispatchGroup:{x:Math.ceil(l/64)},programUniforms:d}),getShaderSource:y},{inputs:[t[0],g]})},il=(e,t)=>{t.format==="NHWC"?tl(e,e.inputs,t):el(e,e.inputs,t)}}),rl,al,nl,Kp=T(()=>{N(),W(),G(),rl=e=>{if(!e||e.length<2)throw new Error("layerNorm requires at least 2 inputs.")},al=(e,t,i)=>{let r=t.simplified,a=e[0].dims,n=e[1],s=!r&&e[2],o=a,u=k.normalizeAxis(t.axis,a.length),l=k.sizeToDimension(a,u),d=k.sizeFromDimension(a,u),p=k.size(n.dims),c=s?k.size(s.dims):0;if(p!==d||s&&c!==d)throw new Error(`Size of X.shape()[axis:] == ${d}.
Size of scale and bias (if provided) must match this.
Got scale size of ${p} and bias size of ${c}`);let h=[];for(let b=0;b<a.length;++b)b<u?h.push(a[b]):h.push(1);let f=ie(d),g=["type","type"],y=[{type:12,data:l},{type:1,data:d},{type:12,data:Math.floor(d/f)},{type:1,data:t.epsilon}];s&&g.push("type");let _=i>1,m=i>2,w=b=>{let x=se(e[0].dataType),v=[S("x",e[0].dataType,e[0].dims,f),S("scale",n.dataType,n.dims,f)];s&&v.push(S("bias",s.dataType,s.dims,f)),v.push(B("output",e[0].dataType,o,f)),_&&v.push(B("mean_data_output",1,h)),m&&v.push(B("inv_std_output",1,h));let I=[{name:"norm_count",type:"u32"},{name:"norm_size",type:"f32"},{name:"norm_size_vectorized",type:"u32"},{name:"epsilon",type:"f32"}];return`
${b.registerUniforms(I).declareVariables(...v)}
${b.mainStart()}
${b.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.norm_count")}
let offset = global_idx * uniforms.norm_size_vectorized;
var mean_vector = ${Ui("f32",f)};
var mean_square_vector = ${Ui("f32",f)};

for (var h: u32 = 0u; h < uniforms.norm_size_vectorized; h++) {
let value = ${ot(x,f,"x[h + offset]")};
mean_vector += value;
mean_square_vector += value * value;
}
let mean = ${Le("mean_vector",f)} / uniforms.norm_size;
let inv_std_dev = inverseSqrt(${Le("mean_square_vector",f)} / uniforms.norm_size ${r?"":"- mean * mean"} + uniforms.epsilon);

for (var j: u32 = 0; j < uniforms.norm_size_vectorized; j++) {
let f32input = ${ot(x,f,"x[j + offset]")};
let f32scale = ${ot(x,f,"scale[j]")};
output[j + offset] = ${v[0].type.value}((f32input ${r?"":"- mean"}) * inv_std_dev * f32scale
${s?`+ ${ot(x,f,"bias[j]")}`:""}
);
}

${_?"mean_data_output[global_idx] = mean":""};
${m?"inv_std_output[global_idx] = inv_std_dev":""};
}`},$=[{dims:o,dataType:e[0].dataType}];return _&&$.push({dims:h,dataType:1}),m&&$.push({dims:h,dataType:1}),{name:"LayerNormalization",shaderCache:{hint:`${f};${i};${r}`,inputDependencies:g},getRunData:()=>({outputs:$,dispatchGroup:{x:Math.ceil(l/64)},programUniforms:y}),getShaderSource:w}},nl=(e,t)=>{rl(e.inputs),e.compute(al(e.inputs,t,e.outputCount))}}),sl,ol,Zp=T(()=>{W(),Yi(),ir(),sl=e=>{if(!e||e.length!==2)throw new Error("MatMul requires 2 inputs.");if(e[0].dims[e[0].dims.length-1]!==e[1].dims[e[1].dims.length-2])throw new Error("shared dimension does not match.")},ol=e=>{sl(e.inputs);let t=nt.calcShape(e.inputs[0].dims,e.inputs[1].dims,!0);if(!t)throw new Error("Can't use matmul on the given tensors");let i=t[t.length-1],r=e.inputs[0].dims[e.inputs[0].dims.length-1];if(i<8&&r<8)e.compute(Xi(e.inputs,{activation:""},t));else{let a=t[t.length-2],n=k.size(e.inputs[0].dims.slice(0,-2)),s=k.size(e.inputs[1].dims.slice(0,-2));if(n!==1&&a===1&&s===1){let o=e.inputs[0].reshape([1,n,r]),u=e.inputs[1].reshape([1,r,i]),l=[1,n,i],d=[o,u];e.compute(Gt(d,{activation:""},t,l),{inputs:d})}else e.compute(Gt(e.inputs,{activation:""},t))}}}),ul,ll,dl,pl,cl,Qp=T(()=>{N(),W(),re(),G(),ul=(e,t)=>{if(e.length<3||e.length>4)throw new Error("MatMulNBits requires 3 or 4 inputs");let i=e[0],r=i.dims.length;if(i.dims[r-1]!==t.k)throw new Error("The last dim of input shape does not match the k value");let a=Math.floor((t.k+t.blockSize-1)/t.blockSize),n=t.blockSize/8*t.bits,s=e[1];if(!k.areEqual(s.dims,[t.n,a,n]))throw new Error("The second inputs must be 3D tensor with shape N X nBlocksPerCol X blobSize");let o=e[2].dims;if(k.size(o)!==t.n*a)throw new Error("scales input size error.");if(e.length===4){let u=e[3].dims,l=t.bits>4?t.n*a:t.n*Math.floor((a+1)/2);if(k.size(u)!==l)throw new Error("zeroPoints input size error.")}},ll=(e,t)=>{let i=e[0].dims,r=i.length,a=i[r-2],n=t.k,s=t.n,o=i.slice(0,r-2),u=k.size(o),l=e[1].dims[2]/4,d=e[0].dataType,p=ie(t.k),c=ie(l),h=ie(s),f=o.concat([a,s]),g=a>1&&s/h%2===0?2:1,y=k.size(f)/h/g,_=64,m=[],w=[u,a,n/p],$=k.convertShape(e[1].dims).slice();$.splice(-1,1,l/c),m.push(...M(w)),m.push(...M($)),m.push(...M(e[2].dims)),e.length===4&&m.push(...M(k.convertShape(e[3].dims)));let b=[u,a,s/h];m.push(...M(b));let x=v=>{let I=w.length,z=S("a",e[0].dataType,I,p),O=S("b",12,$.length,c),V=S("scales",e[2].dataType,e[2].dims.length),U=[z,O,V],L=e.length===4?S("zero_points",12,e[3].dims.length):void 0;L&&U.push(L);let A=b.length,F=B("output",e[0].dataType,A,h),q=se(e[0].dataType),D=(()=>{switch(p){case 1:return`array<${q}, 8>`;case 2:return`mat4x2<${q}>`;case 4:return`mat2x4<${q}>`;default:throw new Error(`${p}-component is not supported.`)}})(),Z=()=>{let E=`
// reuse a data
 var input_offset = ${z.indicesToOffset(`${z.type.indices}(batch, row, word_offset)`)};
 var a_data: ${D};
 for (var j: u32 = 0; j < ${8/p}; j++) {
   a_data[j] = ${z.getByOffset("input_offset")};
   input_offset++;
 }
`;for(let C=0;C<h*g;C++)E+=`
 b_value = ${c===1?`b${C}_data`:`b${C}_data[i]`};
 b_value_lower = unpack4xU8(b_value & b_mask);
 b_value_upper = unpack4xU8((b_value >> 4) & b_mask);
 b_quantized_values = ${D}(${Array.from({length:4},(H,Y)=>`${q}(b_value_lower[${Y}]), ${q}(b_value_upper[${Y}])`).join(", ")});
 b_dequantized_values = ${p===1?`${D}(${Array.from({length:8},(H,Y)=>`(b_quantized_values[${Y}] - ${L?`zero_point${C}`:"zero_point"}) * scale${C}`).join(", ")});`:`(b_quantized_values - ${D}(${Array(8).fill(`${L?`zero_point${C}`:"zero_point"}`).join(",")})) * scale${C};`};
 workgroup_shared[local_id.x * ${g} + ${Math.floor(C/h)}]${h>1?`[${C%h}]`:""} += ${Array.from({length:8/p},(H,Y)=>`${p===1?`a_data[${Y}] * b_dequantized_values[${Y}]`:`dot(a_data[${Y}], b_dequantized_values[${Y}])`}`).join(" + ")};
`;return E},P=()=>{let E=`
 var col_index = col * ${h};
 ${L?`
 let zero_point_bytes_per_col = (nBlocksPerCol + 1) / 2;
 var zero_point_byte_count: u32;
 var zero_point_word_index: u32;
 var zero_point_byte_offset: u32;
 let zero_point_nibble_offset: u32 = block & 0x1u;
 var zero_point_bits_offset: u32;
 var zero_point_word: u32;`:`
 // The default zero point is 8 for unsigned 4-bit quantization.
 let zero_point = ${q}(8);`}
 `;for(let C=0;C<h*g;C++)E+=`
 let scale${C} = ${V.getByOffset("col_index * nBlocksPerCol + block")};
 ${L?`
 zero_point_byte_count = col_index * zero_point_bytes_per_col + (block >> 0x1u);
 zero_point_word_index = zero_point_byte_count >> 0x2u;
 zero_point_byte_offset = zero_point_byte_count & 0x3u;
 zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
 zero_point_word = ${L.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
 let zero_point${C} = ${q}((zero_point_word) & 0xFu);`:""}
 col_index += 1;`;return E},te=()=>{let E=`col_index = col * ${h};`;for(let C=0;C<h*g;C++)E+=`
 let b${C}_data = ${O.getByIndices(`${O.type.indices}(col_index, block, word)`)};
 col_index += 1;`;return E+=`
 var b_value: u32;
 let b_mask: u32 = 0x0F0F0F0Fu;
 var b_value_lower: vec4<u32>;
 var b_value_upper: vec4<u32>;
 var b_quantized_values: ${D};
 var b_dequantized_values: ${D};`,E};return`
var<workgroup> workgroup_shared: array<${F.type.value}, ${g*_}>;
${v.declareVariables(...U,F)}
${v.mainStart([_,1,1])}
let output_indices = ${F.offsetToIndices(`(global_idx / ${_}) * ${g}`)};
let col = output_indices[2];
let row = output_indices[1];
let batch = output_indices[0];
let nBlocksPerCol = uniforms.b_shape[1];

for (var block = local_id.x; block < nBlocksPerCol; block += ${_}) {
 //process one block
 var word_offset: u32 = block * ${t.blockSize/p};
 ${P()}
 for (var word: u32 = 0; word < ${l}; word += ${c}) {
   ${te()}
   for (var i: u32 = 0; i < ${c}; i++) {
     ${Z()}
     word_offset += ${8/p};
   }
 }
}
workgroupBarrier();

if (local_id.x < ${g}) {
 var output_value: ${F.type.value} = ${F.type.value}(0);
 var workgroup_shared_offset: u32 = local_id.x;
 for (var b: u32 = 0u; b < ${_}u; b++) {
   output_value += workgroup_shared[workgroup_shared_offset];
   workgroup_shared_offset += ${g};
 }
 ${F.setByIndices(`${F.type.indices}(batch, row, col + local_id.x)`,"output_value")};
}
}`};return{name:"MatMulNBits",shaderCache:{hint:`${t.blockSize};${t.bits};${p};${c};${h};${g};${_}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:f,dataType:d}],dispatchGroup:{x:y},programUniforms:m}),getShaderSource:x}},dl=(e,t)=>{let i=e[0].dims,r=i.length,a=i[r-2],n=t.k,s=t.n,o=i.slice(0,r-2),u=k.size(o),l=e[1].dims[2]/4,d=e[0].dataType,p=ie(t.k),c=ie(l),h=o.concat([a,s]),f=128,g=s%8===0?8:s%4===0?4:1,y=f/g,_=y*c*8,m=_/p,w=_/t.blockSize,$=k.size(h)/g,b=[],x=[u,a,n/p],v=k.convertShape(e[1].dims).slice();v.splice(-1,1,l/c),b.push(...M(x)),b.push(...M(v)),b.push(...M(e[2].dims)),e.length===4&&b.push(...M(k.convertShape(e[3].dims)));let I=[u,a,s];b.push(...M(I));let z=O=>{let V=x.length,U=S("a",e[0].dataType,V,p),L=S("b",12,v.length,c),A=S("scales",e[2].dataType,e[2].dims.length),F=[U,L,A],q=e.length===4?S("zero_points",12,e[3].dims.length):void 0;q&&F.push(q);let D=I.length,Z=B("output",e[0].dataType,D),P=se(e[0].dataType),te=()=>{switch(p){case 1:return`
let a_data0 = vec4<${P}>(sub_a[word_offset], sub_a[word_offset + 1], sub_a[word_offset + 2], sub_a[word_offset + 3]);
let a_data1 = vec4<${P}>(sub_a[word_offset + 4], sub_a[word_offset + 5], sub_a[word_offset + 6], sub_a[word_offset + 7]);`;case 2:return`
let a_data0 = vec4<${P}>(sub_a[word_offset], sub_a[word_offset + 1]);
let a_data1 = vec4<${P}>(sub_a[word_offset + 2], sub_a[word_offset + 3]);`;case 4:return`
let a_data0 = sub_a[word_offset];
let a_data1 = sub_a[word_offset + 1];`;default:throw new Error(`${p}-component is not supported.`)}};return`
var<workgroup> sub_a: array<${U.type.value}, ${m}>;
var<workgroup> inter_results: array<array<${Z.type.value}, ${y}>, ${g}>;
${O.declareVariables(...F,Z)}
${O.mainStart([y,g,1])}
let output_indices = ${Z.offsetToIndices(`workgroup_index * ${g}`)};
let col = output_indices[2];
let row = output_indices[1];
let batch = output_indices[0];
let n_blocks_per_col = uniforms.b_shape[1];
let num_tiles =  (n_blocks_per_col - 1) / ${w} + 1;

// Loop over shared dimension.
for (var tile: u32 = 0; tile < num_tiles; tile += 1) {
 let a_col_start = tile * ${m};
 // load one tile A data into shared memory.
 for (var a_offset = local_idx; a_offset < ${m}; a_offset += ${f})
 {
   let a_col = a_col_start + a_offset;
   if (a_col < uniforms.a_shape[2])
   {
     sub_a[a_offset] = ${U.getByIndices(`${U.type.indices}(batch, row, a_col)`)};
   } else {
     sub_a[a_offset] = ${U.type.value}(0);
   }
 }
 workgroupBarrier();

 // each thread process one block
 let b_row = col + local_id.y;
 let block = tile * ${w} + local_id.x;
 ${q?`
 let zero_point_bytes_per_col = (n_blocks_per_col + 1) / 2;
 let zero_point_byte_count = b_row * zero_point_bytes_per_col + (block >> 0x1u);
 let zero_point_word_index = zero_point_byte_count >> 0x2u;
 let zero_point_byte_offset = zero_point_byte_count & 0x3u;
 let zero_point_nibble_offset: u32 = block & 0x1u;
 let zero_point_bits_offset = (zero_point_byte_offset << 3) + (zero_point_nibble_offset << 2);
 let zero_point_word = ${q.getByOffset("zero_point_word_index")} >> zero_point_bits_offset;
 let zero_point = ${P}((zero_point_word) & 0xFu);`:`
 // The default zero point is 8 for unsigned 4-bit quantization.
 let zero_point = ${P}(8);`}
 let scale = ${A.getByOffset("b_row * n_blocks_per_col + block")};
 let b_data = ${L.getByIndices(`${L.type.indices}(b_row, block, 0)`)};
 var word_offset = local_id.x * ${t.blockSize/p};
 for (var i: u32 = 0; i < ${c}; i++) {
   ${te()}
   let b_value = ${c===1?"b_data":"b_data[i]"};
   let b_value_lower = unpack4xU8(b_value & 0x0F0F0F0Fu);
   let b_value_upper = unpack4xU8((b_value >> 4) & 0x0F0F0F0Fu);
   let b_quantized_values = mat2x4<${P}>(${Array.from({length:4},(E,C)=>`${P}(b_value_lower[${C}]), ${P}(b_value_upper[${C}])`).join(", ")});
   let b_dequantized_values = (b_quantized_values - mat2x4<${P}>(${Array(8).fill("zero_point").join(",")})) * scale;
   inter_results[local_id.y][local_id.x] += ${Array.from({length:2},(E,C)=>`${`dot(a_data${C}, b_dequantized_values[${C}])`}`).join(" + ")};
   word_offset += ${8/p};
 }
 workgroupBarrier();
}

if (local_idx < ${g}) {
 var output_value: ${Z.type.value} = ${Z.type.value}(0);
 for (var b = 0u; b < ${y}; b++) {
   output_value += inter_results[local_idx][b];
 }
 if (col + local_idx < uniforms.output_shape[2])
 {
   ${Z.setByIndices(`${Z.type.indices}(batch, row, col + local_idx)`,"output_value")}
 }
}
}`};return{name:"BlockwiseMatMulNBits32",shaderCache:{hint:`${t.blockSize};${p};${c};${y};${g}`,inputDependencies:Array(e.length).fill("rank")},getRunData:()=>({outputs:[{dims:h,dataType:d}],dispatchGroup:{x:$},programUniforms:b}),getShaderSource:z}},pl=(e,t)=>{ul(e.inputs,t),t.blockSize===32&&e.adapterInfo.isVendor("intel")&&e.adapterInfo.isArchitecture("gen-12lp")?e.compute(dl(e.inputs,t)):e.compute(ll(e.inputs,t))},cl=e=>Q(e)}),hl,fl,ml,gl,_l,yl,$l,wl,bl,Xp=T(()=>{N(),W(),G(),hl=e=>{if(!e||e.length<1)throw new Error("Too few inputs");if(e[0].dataType!==1&&e[0].dataType!==10)throw new Error("Input type must be float or float16.");if(e.length>=2){let t=e[0].dims.length*2===e[1].dims[0];if(e.length===4&&(t=e[3].dims[0]*2===e[1].dims[0]),!t)throw new Error("The pads should be a 1D tensor of shape [2 * input_rank] or [2 * num_axes].")}},fl=(e,t,i)=>{let r="";for(let a=t-1;a>=0;--a)r+=`
 k = i32(${e.indicesGet("indices",a)}) - ${R("uniforms.pads",a,i)};
 if (k < 0) {
   break;
 }
 if (k >= i32(${R("uniforms.x_shape",a,t)})) {
   break;
 }
 offset += k * i32(${R("uniforms.x_strides",a,t)});
`;return`
value = ${e.type.value}(uniforms.constant_value);
for (var i = 0; i < 1; i++) {
 var offset = 0;
 var k = 0;
 ${r}
 value = x[offset];
}
`},ml=(e,t,i)=>{let r="";for(let a=t-1;a>=0;--a)r+=`
     k = i32(${e.indicesGet("indices",a)}) - ${R("uniforms.pads",a,i)};
     if (k < 0) {
       k = -k;
     }
     {
       let _2n_1 = 2 * (i32(${R("uniforms.x_shape",a,t)}) - 1);
       k = k % _2n_1;
       if(k >= i32(${R("uniforms.x_shape",a,t)})) {
         k = _2n_1 - k;
       }
     }
     offset += k * i32(${R("uniforms.x_strides",a,t)});
 `;return`
   var offset = 0;
   var k = 0;
   ${r}
   value = x[offset];
`},gl=(e,t,i)=>{let r="";for(let a=t-1;a>=0;--a)r+=`
     k = i32(${e.indicesGet("indices",a)}) - ${R("uniforms.pads",a,i)};
     if (k < 0) {
       k = 0;
     }
     if (k >= i32(${R("uniforms.x_shape",a,t)})) {
       k = i32(${R("uniforms.x_shape",a,t)}) - 1;
     }
     offset += k * i32(${R("uniforms.x_strides",a,t)});
 `;return`
   var offset = 0;
   var k = 0;
   ${r}
   value = x[offset];
`},_l=(e,t,i)=>{let r="";for(let a=t-1;a>=0;--a)r+=`
     k = i32(${e.indicesGet("indices",a)}) - ${R("uniforms.pads",a,i)};
     if (k < 0)  {
       k += i32(${R("uniforms.x_shape",a,t)}]);
     }
     if (k >= i32(${R("uniforms.x_shape",a,t)})) {
       k -= i32(${R("uniforms.x_shape",a,t)});
     }
     offset += k * i32(${R("uniforms.x_strides",a,t)});
 `;return`
   var offset = 0;
   var k = 0;
   ${r}
   value = x[offset];
`},yl=(e,t,i)=>{switch(i.mode){case 0:return fl(e,t,i.pads.length);case 1:return ml(e,t,i.pads.length);case 2:return gl(e,t,i.pads.length);case 3:return _l(e,t,i.pads.length);default:throw new Error("Invalid mode")}},$l=(e,t)=>{let i=k.padShape(e[0].dims.slice(),t.pads),r=e[0].dims,a=k.size(i),n=[{type:12,data:a},{type:6,data:t.pads}],s=e.length>=3&&e[2].data;t.mode===0&&n.push({type:s?e[2].dataType:1,data:t.value}),n.push(...M(e[0].dims,i));let o=["rank"],u=l=>{let d=B("output",e[0].dataType,i.length),p=S("x",e[0].dataType,r.length),c=p.type.value,h=yl(d,r.length,t),f=[{name:"output_size",type:"u32"},{name:"pads",type:"i32",length:t.pads.length}];return t.mode===0&&f.push({name:"constant_value",type:s?c:"f32"}),`
 ${l.registerUniforms(f).declareVariables(p,d)}
 ${l.mainStart()}
 ${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}

 let indices = ${d.offsetToIndices("global_idx")};

 var value = ${c}(0);
 ${h}
 output[global_idx] = value;
}`};return{name:"Pad",shaderCache:{hint:`${t.mode}${s}`,inputDependencies:o},getRunData:()=>({outputs:[{dims:i,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(k.size(i)/64)},programUniforms:n}),getShaderSource:u}},wl=(e,t)=>{if(e.length>1){let i=e[1].getBigInt64Array(),r=e.length>=3&&e[2].data?e[2].dataType===10?e[2].getUint16Array()[0]:e[2].getFloat32Array()[0]:0,a=e[0].dims.length,n=new Int32Array(2*a).fill(0);if(e.length>=4){let o=e[3].getBigInt64Array();for(let u=0;u<o.length;u++)n[Number(o[u])]=Number(i[u]),n[Number(o[u])+a]=Number(i[u+o.length])}else i.forEach((o,u)=>n[Number(u)]=Number(o));let s=[];return n.forEach(o=>s.push(o)),{mode:t.mode,value:r,pads:s}}else return t},bl=(e,t)=>{hl(e.inputs);let i=wl(e.inputs,t);e.compute($l(e.inputs,i),{inputs:[0]})}}),vt,_r,yr,$r,wr,vl,xl,br,vr,kl,Sl,xr,Il,Tl,kr,zl,El,Cl,Ol,Yp=T(()=>{ze(),N(),W(),G(),vt=e=>{if(ee.webgpu.validateInputContent&&(!e||e.length!==1))throw new Error("Pool ops requires 1 input.")},_r=(e,t,i)=>{let r=t.format==="NHWC",a=e.dims.slice();r&&a.splice(1,0,a.pop());let n=Object.hasOwnProperty.call(t,"dilations"),s=t.kernelShape.slice(),o=t.strides.slice(),u=n?t.dilations.slice():[],l=t.pads.slice();Ut.adjustPoolAttributes(i,a,s,o,u,l);let d=Ut.computePoolOutputShape(i,a,o,u,s,l,t.autoPad),p=Object.assign({},t);n?Object.assign(p,{kernelShape:s,strides:o,pads:l,dilations:u,cacheKey:t.cacheKey}):Object.assign(p,{kernelShape:s,strides:o,pads:l,cacheKey:t.cacheKey});let c=d.slice();return c.push(c.splice(1,1)[0]),[p,r?c:d]},yr=(e,t)=>{let i=t.format==="NHWC",r=k.size(e),a=k.size(t.kernelShape),n=[{type:12,data:r},{type:12,data:a}],s=[{name:"outputSize",type:"u32"},{name:"kernelSize",type:"u32"}];if(t.kernelShape.length<=2){let o=t.kernelShape[t.kernelShape.length-1],u=t.strides[t.strides.length-1],l=t.pads[t.pads.length/2-1],d=t.pads[t.pads.length-1],p=!!(l+d);n.push({type:12,data:o},{type:12,data:u},{type:12,data:l},{type:12,data:d}),s.push({name:"kw",type:"u32"},{name:"sw",type:"u32"},{name:"pwStart",type:"u32"},{name:"pwEnd",type:"u32"});let c=!1;if(t.kernelShape.length===2){let h=t.kernelShape[t.kernelShape.length-2],f=t.strides[t.strides.length-2],g=t.pads[t.pads.length/2-2],y=t.pads[t.pads.length-2];c=!!(g+y),n.push({type:12,data:h},{type:12,data:f},{type:12,data:g},{type:12,data:y}),s.push({name:"kh",type:"u32"},{name:"sh",type:"u32"},{name:"phStart",type:"u32"},{name:"phEnd",type:"u32"})}return[n,s,!0,p,c]}else{if(i)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let o=k.computeStrides(t.kernelShape);n.push({type:12,data:o},{type:12,data:t.pads},{type:12,data:t.strides}),s.push({name:"kernelStrides",type:"u32",length:o.length},{name:"pads",type:"u32",length:t.pads.length},{name:"strides",type:"u32",length:t.strides.length});let u=t.pads.reduce((l,d)=>l+d);return[n,s,!!u,!1,!1]}},$r=(e,t,i,r,a,n,s,o,u,l,d,p)=>{let c=a.format==="NHWC",h=t.type.value,f=B("output",t.type.tensor,r);if(a.kernelShape.length<=2){let g="",y="",_="",m=i-(c?2:1);if(d?g=`
     for (var i: u32 = 0u; i < uniforms.kw; i++) {
       xIndices[${m}] = indices[${m}] * uniforms.sw - uniforms.pwStart + i;
       if (xIndices[${m}] < 0 || xIndices[${m}]
           >= uniforms.x_shape[${m}]) {
         pad++;
         continue;
       }
       let x_val = x[${t.indicesToOffset("xIndices")}];
       ${n}
     }`:g=`
     for (var i: u32 = 0u; i < uniforms.kw; i++) {
       xIndices[${m}] = indices[${m}] * uniforms.sw - uniforms.pwStart + i;
       let x_val = x[${t.indicesToOffset("xIndices")}];
       ${n}
     }`,a.kernelShape.length===2){let w=i-(c?3:2);p?y=`
     for (var j: u32 = 0u; j < uniforms.kh; j++) {
       xIndices[${w}] = indices[${w}] * uniforms.sh - uniforms.phStart + j;
       if (xIndices[${w}] < 0 || xIndices[${w}] >= uniforms.x_shape[${w}]) {
         pad += i32(uniforms.kw);
         continue;
       }
   `:y=`
     for (var j: u32 = 0u; j < uniforms.kh; j++) {
       xIndices[${w}] = indices[${w}] * uniforms.sh - uniforms.phStart + j;
     `,_=`
   }
 `}return`
 ${e.registerUniforms(u).declareVariables(t,f)}

 ${e.mainStart()}
   ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}

   let indices = ${f.offsetToIndices("global_idx")};
   var xIndices = ${f.offsetToIndices("global_idx")};

   var value = ${h}(${o});
   var pad = 0;
   ${y}
   ${g}
   ${_}
   ${s}

   output[global_idx] = value;
 }`}else{if(c)throw new Error("Pooling with kernelShape.length > 2 is not supported for NHWC format.");let g=a.kernelShape.length,y=a.pads.length,_="";return l?_=`
     if (xIndices[j] >= uniforms.x_shape[j]) {
       pad++;
       isPad = true;
       break;
     }
   }
   if (!isPad) {
     let x_val = x[${t.indicesToOffset("xIndices")}];
     ${n}
   }`:_=`
   }
   let x_val = x[${t.indicesToOffset("xIndices")}];
   ${n}
 `,`
 ${e.registerUniforms(u).declareVariables(t,f)}

 ${e.mainStart()}
   ${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
   let indices = ${f.offsetToIndices("global_idx")};
   var xIndices = ${f.offsetToIndices("global_idx")};

   var offsets: array<u32, ${g}>;

   var value = ${h}(${o});
   var pad = 0;
   var isPad = false;

   for (var i: u32 = 0u; i < uniforms.kernelSize; i++) {
     var offset = i;
     for (var j = 0u; j < ${g-1}u; j++) {
       offsets[j] = offset / ${R("uniforms.kernelStrides","j",g)};
       offset -= offsets[j] * ${R("uniforms.kernelStrides","j",g)};
     }
     offsets[${g-1}] = offset;

     isPad = false;
     for (var j = ${i-g}u; j < ${i}u; j++) {
       xIndices[j] = indices[j] * ${R("uniforms.strides",`j - ${i-g}u`,g)}
         + offsets[j - ${i-g}u] - ${R("uniforms.pads","j - 2u",y)};
       ${_}
   }
   ${s}

   output[global_idx] = value;
 }`}},wr=e=>`${e.format};${e.ceilMode};${e.autoPad};${e.kernelShape.length}`,vl=e=>`${wr(e)};${e.countIncludePad}`,xl=e=>`${wr(e)};${e.storageOrder};${e.dilations}`,br=e=>({format:e.format,autoPad:["NOTSET","VALID","SAME_UPPER","SAME_LOWER"][e.auto_pad],ceilMode:e.ceil_mode,kernelShape:e.kernel_shape,strides:e.strides,pads:e.pads}),vr=(e,t,i,r)=>{let[a,n]=_r(t,r,i),s=S("x",t.dataType,t.dims.length),o=s.type.value,u="value += x_val;",l="";a.countIncludePad?l+=`value /= ${o}(uniforms.kernelSize);`:l+=`value /= ${o}(i32(uniforms.kernelSize) - pad);`;let[d,p,c,h,f]=yr(n,a);d.push(...M(t.dims,n));let g=["rank"];return{name:e,shaderCache:{hint:`${r.cacheKey};${c};${h};${f}`,inputDependencies:g},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(k.size(n)/64)},programUniforms:d}),getShaderSource:y=>$r(y,s,t.dims.length,n.length,a,u,l,0,p,c,h,f)}},kl=e=>{let t=e.count_include_pad!==0,i=br(e);if(i.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for AveragePool");let r={countIncludePad:t,...i,cacheKey:""};return{...r,cacheKey:vl(r)}},Sl=(e,t)=>{vt(e.inputs),e.compute(vr("AveragePool",e.inputs[0],!1,t))},xr={autoPad:"",ceilMode:0,countIncludePad:!1,kernelShape:[],strides:[],pads:[],storageOrder:0,dilations:[]},Il=e=>{let t=e.format;return{format:t,...xr,cacheKey:t}},Tl=(e,t)=>{vt(e.inputs),e.compute(vr("GlobalAveragePool",e.inputs[0],!0,t))},kr=(e,t,i,r)=>{let[a,n]=_r(t,r,i),s=`
value = max(x_val, value);
`,o="",u=S("x",t.dataType,t.dims.length),l=["rank"],[d,p,c,h,f]=yr(n,a);return d.push(...M(t.dims,n)),{name:e,shaderCache:{hint:`${r.cacheKey};${c};${h};${f}`,inputDependencies:l},getRunData:()=>({outputs:[{dims:n,dataType:t.dataType}],dispatchGroup:{x:Math.ceil(k.size(n)/64)},programUniforms:d}),getShaderSource:g=>$r(g,u,t.dims.length,n.length,a,s,o,t.dataType===10?-65504:-1e5,p,c,h,f)}},zl=(e,t)=>{vt(e.inputs),e.compute(kr("MaxPool",e.inputs[0],!1,t))},El=e=>{let t=e.storage_order,i=e.dilations,r=br(e);if(t!==0)throw new Error("column major storage order is not yet supported for MaxPool");if(r.ceilMode!==0)throw new Error("using ceil() in shape computation is not yet supported for MaxPool");let a={storageOrder:t,dilations:i,...r,cacheKey:""};return{...a,cacheKey:xl(a)}},Cl=e=>{let t=e.format;return{format:t,...xr,cacheKey:t}},Ol=(e,t)=>{vt(e.inputs),e.compute(kr("GlobalMaxPool",e.inputs[0],!0,t))}}),Al,Bl,Rl,Dl,Jp=T(()=>{N(),W(),re(),G(),Al=(e,t)=>{if(e.length<2||e.length>3)throw new Error("DequantizeLinear requires 2 or 3 inputs.");if(e.length===3&&e[1].dims===e[2].dims)throw new Error("x-scale and x-zero-point must have the same shape.");if(e.length===3&&e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[0].dataType===6&&e.length>2)throw new Error("In the case of dequantizing int32 there is no zero point.");if(e[1].dims.length!==0&&e[1].dims.length!==1&&e[1].dims.length!==e[0].dims.length)throw new Error("scale input must be a scalar, a 1D tensor, or have the same rank as the input tensor.");if(e.length>2){if(e[0].dataType!==e[2].dataType)throw new Error("x and x-zero-point must have the same data type.");if(e[1].dims.length!==e[2].dims.length)throw new Error("scale and zero-point inputs must have the same rank.");if(!e[1].dims.map((i,r)=>i===e[2].dims[r]).reduce((i,r)=>i&&r,!0))throw new Error("scale and zero-point inputs must have the same shape.")}if(t.blockSize>0){if(e[1].dims.length===0||e[1].dims.length===1&&e[1].dims[0]===1)throw new Error("blockSize must be set only for block quantization.");if(!e[1].dims.map((a,n)=>n===t.axis||a===e[0].dims[n]).reduce((a,n)=>a&&n,!0))throw new Error("For block qunatization, scale input shape to match the input shape except for the axis");if(e[1].dims.length!==e[0].dims.length)throw new Error("For block qunatization the scale input rank must be the same as the x rank.");let i=e[0].dims[t.axis],r=e[1].dims[t.axis];if(t.blockSize<Math.ceil(i/r)||t.blockSize>Math.ceil(i/(r-1)-1))throw new Error("blockSize must be with in the range [ceil(dI / Si), ceil(dI / (Si - 1) - 1)].")}},Bl=(e,t)=>{let i=k.normalizeAxis(t.axis,e[0].dims.length),r=e[0].dataType,a=r===3,n=e[0].dims,s=e[1].dataType,o=k.size(n),u=r===3||r===2,l=u?[Math.ceil(k.size(e[0].dims)/4)]:e[0].dims,d=e[1].dims,p=e.length>2?e[2]:void 0,c=p?u?[Math.ceil(k.size(p.dims)/4)]:p.dims:void 0,h=d.length===0||d.length===1&&d[0]===1,f=h===!1&&d.length===1,g=ie(o),y=h&&(!u||g===4),_=y?g:1,m=y&&!u?g:1,w=S("input",u?12:r,l.length,m),$=S("scale",s,d.length),b=p?S("zero_point",u?12:r,c.length):void 0,x=B("output",s,n.length,_),v=[w,$];b&&v.push(b);let I=[l,d];p&&I.push(c);let z=[{type:12,data:o/_},{type:12,data:i},{type:12,data:t.blockSize},...M(...I,n)],O=V=>{let U=[{name:"output_size",type:"u32"},{name:"axis",type:"u32"},{name:"block_size",type:"u32"}];return`
${V.registerUniforms(U).declareVariables(...v,x)}
${V.mainStart()}
${V.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let output_indices = ${x.offsetToIndices("global_idx")};

// Set input x
${u?`
 let input = ${w.getByOffset("global_idx / 4")};
 let x_vec = ${a?"unpack4xI8(input)":"unpack4xU8(input)"};
 let x_value = ${_===1?"x_vec[global_idx % 4]":"x_vec"};`:`let x_value = ${w.getByOffset("global_idx")};`};

// Set scale input
${h?`let scale_value= ${$.getByOffset("0")}`:f?`
 let scale_index = ${x.indicesGet("output_indices","uniforms.axis")};
 let scale_value= ${$.getByOffset("scale_index")};`:`
 var scale_indices: ${$.type.indices} = output_indices;
 let index = ${$.indicesGet("scale_indices","uniforms.axis")} / uniforms.block_size;
 ${$.indicesSet("scale_indices","uniforms.axis","index")};
 let scale_value= ${$.getByIndices("scale_indices")};`};

// Set zero-point input
${b?h?u?`
     let zero_point_input = ${b.getByOffset("0")};
     let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
     let zero_point_value= zero_point_vec[0]`:`let zero_point_value = ${b.getByOffset("0")}`:f?u?`
     let zero_point_index = ${x.indicesGet("output_indices","uniforms.axis")};
     let zero_point_input = ${b.getByOffset("zero_point_index / 4")};
     let zero_point_vec =  ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
     let zero_point_value = zero_point_vec[zero_point_index % 4]`:`
     let zero_point_index = ${x.indicesGet("output_indices","uniforms.axis")};
     let zero_point_value = ${b.getByOffset("zero_point_index")};`:u?`
     let zero_point_offset = ${$.indicesToOffset("scale_indices")};
     let zero_point_input = ${b.getByOffset("zero_point_offset / 4")};
     let zero_point_vec = ${a?"unpack4xI8(zero_point_input)":"unpack4xU8(zero_point_input)"};
     let zero_point_value = zero_point_vec[zero_point_offset % 4];`:`let zero_point_value = ${b.getByIndices("scale_indices")};`:`let zero_point_value = ${u?a?"i32":"u32":w.type.value}(0);`};
// Compute and write output
${x.setByOffset("global_idx",`${x.type.value}(x_value - zero_point_value) * scale_value`)};
}`};return{name:"DequantizeLinear",shaderCache:{hint:t.cacheKey,inputDependencies:b?["rank","rank","rank"]:["rank","rank"]},getShaderSource:O,getRunData:()=>({outputs:[{dims:n,dataType:s}],dispatchGroup:{x:Math.ceil(o/_/64),y:1,z:1},programUniforms:z})}},Rl=(e,t)=>{Al(e.inputs,t),e.compute(Bl(e.inputs,t))},Dl=e=>Q({axis:e.axis,blockSize:e.blockSize})}),Ml,Ul,Pl,ec=T(()=>{ze(),N(),G(),Ml=(e,t,i)=>{let r=e===t,a=e<t&&i<0,n=e>t&&i>0;if(r||a||n)throw new Error("Range these inputs' contents are invalid.")},Ul=(e,t,i,r)=>{let a=Math.abs(Math.ceil((t-e)/i)),n=[a],s=a,o=[{type:12,data:s},{type:r,data:e},{type:r,data:i},...M(n)],u=l=>{let d=B("output",r,n.length),p=d.type.value,c=[{name:"outputSize",type:"u32"},{name:"start",type:p},{name:"delta",type:p}];return`
${l.registerUniforms(c).declareVariables(d)}
${l.mainStart()}
${l.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
output[global_idx] = uniforms.start + ${p}(global_idx) * uniforms.delta;
}`};return{name:"Range",shaderCache:{hint:`${r}`},getShaderSource:u,getRunData:()=>({outputs:[{dims:n,dataType:r}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:o})}},Pl=e=>{let t=0,i=0,r=0;e.inputs[0].dataType===6?(t=e.inputs[0].getInt32Array()[0],i=e.inputs[1].getInt32Array()[0],r=e.inputs[2].getInt32Array()[0]):e.inputs[0].dataType===1&&(t=e.inputs[0].getFloat32Array()[0],i=e.inputs[1].getFloat32Array()[0],r=e.inputs[2].getFloat32Array()[0]),ee.webgpu.validateInputContent&&Ml(t,i,r),e.compute(Ul(t,i,r,e.inputs[0].dataType),{inputs:[]})}}),ql,Sr,Ir,Nl,Vl,Ll,tc=T(()=>{N(),W(),re(),G(),ql=(e,t,i,r)=>{if(e!=="none"&&r!=="i32"&&r!=="u32"&&r!=="f32")throw new Error(`Input ${r} is not supported with reduction ${e}.`);let a=`{
     var oldValue = 0;
     loop {
       let newValueF32 =`,n=`;
       let newValue = bitcast<i32>(newValueF32);
       let res = atomicCompareExchangeWeak(&${t}, oldValue, newValue);
       if res.exchanged {
         break;
       }
       oldValue = res.old_value;
     }
   }`;switch(e){case"none":return`${t}=${i};`;case"add":return r==="i32"||r==="u32"?`atomicAdd(&${t}, bitcast<${r}>(${i}));`:`
   ${a}bitcast<${r}>(oldValue) + (${i})${n}`;case"max":return r==="i32"||r==="u32"?`atomicMax(&${t}, bitcast<${r}>(${i}));`:`
     ${a}max(bitcast<f32>(oldValue), (${i}))${n}`;case"min":return r==="i32"||r==="u32"?`atomicMin(&${t}, bitcast<${r}>(${i}));`:`${a}min(bitcast<${r}>(oldValue), (${i}))${n}`;case"mul":return`${a}(bitcast<${r}>(oldValue) * (${i}))${n}`;default:throw new Error(`Reduction ${e} is not supported.`)}},Sr=(e,t)=>`${e===1?`
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
data_offset += u32((u32(index) * element_count_dim));`,Ir=(e,t,i)=>`for (var i = 0u; i < uniforms.num_updates_elements; i++) {
let value = updates[uniforms.num_updates_elements * ${i?"global_idx":"idx"} + i];
${ql(e.reduction,"output[data_offset + i]","value",t)}
}`,Nl=(e,t)=>{let i=e[0].dims,r=e[1].dims,a=i,n=1,s=Math.ceil(k.size(r)/n),o=r[r.length-1],u=k.sizeFromDimension(i,o),l=k.sizeFromDimension(r,0)/o,d=[{type:12,data:s},{type:12,data:o},{type:12,data:u},...M(e[1].dims,e[2].dims,a)],p=c=>{let h=S("indices",e[1].dataType,e[1].dims.length),f=S("updates",e[2].dataType,e[2].dims.length,n),g=t.reduction!=="none"&&t.reduction!==""?Fa("output",e[0].dataType,a.length):B("output",e[0].dataType,a.length,n);return`
${c.registerUniform("output_size","u32").registerUniform("last_index_dimension","u32").registerUniform("num_updates_elements","u32").declareVariables(h,f,g)}
${c.mainStart()}
${c.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
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
${Sr(i.length,!1)}
}
${Ir(t,g.type.value,!1)}
}
return;
}

var data_offset = 0u;
var indices_start = uniforms.last_index_dimension * global_idx;
var indices_end = indices_start + uniforms.last_index_dimension;
for (var i = indices_start; i < indices_end; i++) {
var index = i32(indices[i].x);
${Sr(i.length,!0)}
}
${Ir(t,g.type.value,!0)}
}`};return{name:"ScatterND",shaderCache:{hint:`${t.cacheKey}_${t.reduction}`,inputDependencies:["rank","rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(s/64)},programUniforms:d}),getShaderSource:p}},Vl=e=>Q({reduction:e.reduction}),Ll=(e,t)=>{e.compute(Nl(e.inputs,t),{inputs:[e.inputs[1],e.inputs[2]],outputs:[]})}}),Wl,Gl,Hl,Tr,Fl,jl,Kl,Zl,Ql,Xl,Yl,Jl,zr,ed,td,id,rd,ad,nd,sd,ic=T(()=>{N(),W(),re(),G(),Wl=(e,t)=>{if(e.every(i=>i>0||(()=>{throw new Error("Resize requires scales input values to be positive")})),e.length>0){if(t.mode==="linear"){if(!(e.length===2||e.length===3||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1||e.length===5&&e[0]===1&&e[1]===1))throw new Error(`For linear mode, Resize requires scales to be 2D, 3D, 4D with either two outermost or one innermost and
 one outermost scale values equal to 1, or 5D with two outermost scale values equal to 1`)}else if(t.mode==="cubic"&&!(e.length===2||e.length===4&&e[0]===1&&e[1]===1||e.length===4&&e[0]===1&&e[3]===1))throw new Error("Resize requires scales input size to be 2 or 4 for cubic mode")}},Gl=(e,t,i)=>{t.every(a=>a>=0&&a<i||(()=>{throw new Error("Resize requires axes input values to be positive and less than rank")}));let r=new Array(i).fill(1);return t.forEach((a,n)=>r[a]=e[n]),r},Hl=(e,t,i,r,a,n)=>{let[s,o,u]=i>10?[1,2,3]:[-1,e.length>1?1:-1,-1],l=e[0].dims.length;if(s>0&&e.length>s&&e[s].dims.length>0)e[s].getFloat32Array().forEach(d=>n.push(d));else if(t.coordinateTransformMode==="tf_crop_and_resize")throw new Error("Resize requires RoI input to be specified when coordinateTransformMode is tfCropAndResize");if(o>0&&e.length>o&&e[o].dims.length===1&&e[o].dims[0]>0){if(e[o].getFloat32Array().forEach(d=>r.push(d)),r.length!==0&&r.length!==l&&i>=18&&r.length!==t.axes.length)throw new Error("Resize requires scales input size to be same as input rank or axes size for opset 18 and up");Wl(r,t),t.axes.length>0&&Gl(r,t.axes,l).forEach((d,p)=>r[p]=d)}if(u>0&&e.length>u&&e[u].dims.length===1&&e[u].dims[0]>0&&(e[u].getBigInt64Array().forEach(d=>a.push(Number(d))),a.length!==0&&a.length!==l&&i>=18&&a.length!==t.axes.length))throw new Error("Resize requires sizes input size to be same as input rank or axes size for opset 18 and up");if(t.axes.length>0){if(r.length!==0&&r.length!==t.axes.length)throw new Error('Resize requires "scales" input size to be of axes rank when axes attributes is specified');if(a.length!==0&&a.length!==t.axes.length)throw new Error('Resize requires "sizes" input size to be of rank axes rank when axes attributes is specified')}if(typeof r<"u"&&typeof a<"u"&&r.length>0&&a.length>l)throw new Error("Resize requires only of scales or sizes to be specified")},Tr=(e,t,i,r)=>`
// The whole part and the fractional part are calculated separately due to inaccuracy of floating
// point division. As an example, f32(21) / f32(7) may evaluate to 2.99... instead of 3, causing an
// offset-by-one error later in floor().
let big = (${e}) * (${t});
let whole = ${r}(big / (${i}));
let fract = ${r}(big % (${i})) / ${r}(${i});
return whole + fract;
`,Fl=(e,t)=>`fn getOriginalCoordinateFromResizedCoordinate(xResized: u32, xScale: f32, lengthResized: u32,
lengthOriginal: u32, roiStart: f32, roiEnd: f32) -> ${t} { `+(()=>{switch(e){case"asymmetric":return`
if (xScale < 1.0 || floor(xScale) != xScale) {
 return ${t}(xResized) / ${t}(xScale);
} else {
 ${Tr("xResized","lengthOriginal","lengthResized",t)}
}
`;case"pytorch_half_pixel":return`if (lengthResized > 1) {
         return (${t}(xResized) + 0.5) / ${t}(xScale) - 0.5;
       } else {
         return 0.0;
       }`;case"tf_half_pixel_for_nn":return`return (${t}(xResized) + 0.5) / ${t}(xScale);`;case"align_corners":return`if (lengthResized == 1) {
         return 0.0;
       } else {
         ${Tr("xResized","lengthOriginal - 1","lengthResized - 1",t)}
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
       return offset + ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;case"half_pixel":return`return ((${t}(xResized) + 0.5) / ${t}(xScale)) - 0.5;`;default:throw new Error(`Coordinate transform mode ${e} is not supported`)}})()+"}",jl=(e,t,i)=>`fn getNearestPixelFromOriginal(xOriginal: ${i}, isDownSample: bool) -> ${i} {`+(()=>{switch(e){case"round_prefer_ceil":return"if (fract(xOriginal) == 0.5) {             return ceil(xOriginal);           } else {             return round(xOriginal);           }";case"floor":return"return floor(xOriginal);";case"ceil":return"return ceil(xOriginal);";case"round_prefer_floor":return"if (fract(xOriginal) == 0.5) {                     return floor(xOriginal);                   } else {                     return round(xOriginal);                   }";case"simple":default:if(t<11)return"if (isDownSample)                     {                       return ceil(xOriginal);                     } else {                       return xOriginal;                     }";throw new Error(`Nearest mode ${e} is not supported`)}})()+"}",Kl=(e,t,i)=>{let r=new Array(i).fill(0).concat(new Array(i).fill(1)),a=e.length===0?r:e.slice();return t.length>0?(t.forEach((n,s)=>{r[n]=a[s],r[s+i]=a[t.length+s]}),r):a},Zl=(e,t,i,r)=>{let a=[];if(i.length>0)if(r.length>0){if(e.forEach(n=>a.push(n)),Math.max(...r)>e.length)throw new Error("axes is out of bound");r.forEach((n,s)=>a[n]=i[s])}else i.forEach(n=>a.push(n));else{if(t.length===0)throw new Error("Resize requires either scales or sizes.");a=e.map((n,s)=>Math.round(n*t[s]))}return a},Ql=(e,t,i)=>{let r=(()=>{switch(i.keepAspectRatioPolicy){case"not_larger":return i.axes.length>0?Math.min(...i.axes.map(n=>t[n]),Number.MAX_VALUE):Math.min(...t,Number.MAX_VALUE);case"not_smaller":return i.axes.length>0?Math.max(...i.axes.map(n=>t[n]),Number.MIN_VALUE):Math.max(...t,Number.MIN_VALUE);default:throw new Error(`Keep aspect ratio policy ${i.keepAspectRatioPolicy} is not supported`)}})();t.fill(1,0,t.length);let a=e.slice();return i.axes.length>0?(i.axes.forEach(n=>t[n]=r),i.axes.forEach(n=>a[n]=Math.round(e[n]*t[n]))):(t.fill(r,0,t.length),a.forEach((n,s)=>a[s]=Math.round(n*t[s]))),a},Xl=(e,t,i,r,a)=>`
fn calculateOriginalIndicesFromOutputIndices(output_indices: ${e.type.indices}) -> array<${e.type.value}, ${i.length}> {
var original_indices: array<${e.type.value}, ${i.length}>;
for (var i:u32 = 0; i < ${i.length}; i++) {
var output_index = ${e.indicesGet("output_indices","i")};
var scale = ${R("uniforms.scales","i",r)};
var roi_low = ${R("uniforms.roi","i",a)};
var roi_hi = ${R("uniforms.roi",`i + ${t.length}`,a)};
if (scale == 1.0) {
original_indices[i] = ${e.type.value}(output_index);
} else {
var input_shape_i = ${R("uniforms.input_shape","i",t.length)};
var output_shape_i = ${R("uniforms.output_shape","i",i.length)};
original_indices[i] = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                                input_shape_i, roi_low, roi_hi);
}
}
return original_indices;
}`,Yl=(e,t,i,r,a,n,s)=>`
fn calculateInputIndicesFromOutputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
var input_indices: ${e.type.indices};
for (var i:u32 = 0; i < ${r.length}; i++) {
var output_index = ${t.indicesGet("output_indices","i")};
var input_index: u32;
var scale = ${R("uniforms.scales","i",a)};
if (scale == 1.0) {
input_index = output_index;
} else {
var roi_low = ${R("uniforms.roi","i",n)};
var roi_hi = ${R("uniforms.roi",`i + ${i.length}`,n)};
var input_shape_i = ${R("uniforms.input_shape","i",i.length)};
var output_shape_i = ${R("uniforms.output_shape","i",r.length)};
var original_idx = getOriginalCoordinateFromResizedCoordinate(output_index, scale, output_shape_i,
                                                             input_shape_i, roi_low, roi_hi);
if (!${s} || (original_idx >= 0 && original_idx < ${t.type.value}(input_shape_i))) {
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
}`,Jl=(e,t)=>`
fn checkInputIndices(input_indices: ${e.type.indices}) -> bool {
for (var i:u32 = 0; i < ${t.length}; i++) {
var input_index = ${e.indicesGet("input_indices","i")};
if (input_index < 0 || input_index >= ${R("uniforms.input_shape","i",t.length)}) {
return false;
}
}
return true;
}`,zr=(e,t,i,r)=>e.rank>r?`
${e.indicesSet("input_indices",t,"channel")};
${e.indicesSet("input_indices",i,"batch")};
`:"",ed=(e,t,i,r,a)=>{let[n,s,o,u]=i.length===2?[-1,0,1,-1]:[0,2,3,1],l=e.type.value;return`
fn getInputValue(batch: u32, channel: u32, row: u32, col: u32) -> ${l} {
var input_indices: ${e.type.indices};
${e.indicesSet("input_indices",s,`max(0, min(row, ${i[s]} - 1))`)};
${e.indicesSet("input_indices",o,`max(0, min(col, ${i[o]} - 1))`)};
${zr(e,u,n,2)}
return ${e.getByIndices("input_indices")};
}

fn bilinearInterpolation(output_indices: ${t.type.indices}) -> ${l} {
var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
var row:${l} = originalIndices[${s}];
var col:${l} = originalIndices[${o}];
${r?`if (row < 0 || row > (${i[s]} - 1) || col < 0 || col > (${i[o]} - 1)) {
return ${a};
}`:""};
row = max(0, min(row, ${i[s]} - 1));
col = max(0, min(col, ${i[o]} - 1));
var row1: u32 = u32(row);
var col1: u32 = u32(col);
var row2: u32 = u32(row + 1);
var col2: u32 = u32(col + 1);
var channel: u32 = ${i.length>2?`u32(originalIndices[${u}])`:"0"};
var batch: u32 =  ${i.length>2?`u32(originalIndices[${n}])`:"0"};
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
}`},td=(e,t,i,r,a,n,s,o,u,l)=>{let d=i.length===2,[p,c]=d?[0,1]:[2,3],h=e.type.value,f=g=>{let y=g===p?"row":"col";return`
fn ${y}CubicInterpolation(input_indices: ${e.type.indices}, output_indices: ${t.type.indices}) -> ${h} {
var output_index = ${t.indicesGet("output_indices",g)};
var originalIdx: ${h} = getOriginalCoordinateFromResizedCoordinate(output_index, ${a[g]},
${r[g]}, ${i[g]}, ${n[g]}, ${n[g]} + ${i.length});
var fractOriginalIdx: ${h} = originalIdx - floor(originalIdx);
var coefs = getCubicInterpolationCoefs(fractOriginalIdx);

if (${o} && (originalIdx < 0 || originalIdx > (${i[g]} - 1))) {
return ${u};
}
var data: array<${h}, 4> = array<${h}, 4>(0.0, 0.0, 0.0, 0.0);
for (var i: i32 = -1; i < 3; i++) {
var ${y}: ${h} = originalIdx + ${h}(i);
if (${y} < 0 || ${y} >= ${i[g]}) {
 ${l?`coefs[i + 1] = 0.0;
             continue;`:o?`return ${u};`:`${y} = max(0, min(${y}, ${i[g]} - 1));`};
}
var input_indices_copy: ${e.type.indices} = input_indices;
${e.indicesSet("input_indices_copy",g,`u32(${y})`)};
data[i + 1] = ${g===p?e.getByIndices("input_indices_copy"):"rowCubicInterpolation(input_indices_copy, output_indices)"};
}
return cubicInterpolation1D(data, coefs);
}`};return`
${f(p)};
${f(c)};
fn getCubicInterpolationCoefs(s: ${h}) -> array<${h}, 4> {
var absS = abs(s);
var coeffs: array<${h}, 4> = array<${h}, 4>(0.0, 0.0, 0.0, 0.0);
var oneMinusAbsS: ${h} = 1.0 - absS;
var twoMinusAbsS: ${h} = 2.0 - absS;
var onePlusAbsS: ${h} = 1.0 + absS;
coeffs[0] = ((${s} * onePlusAbsS - 5 * ${s}) * onePlusAbsS + 8 * ${s}) * onePlusAbsS - 4 * ${s};
coeffs[1] = ((${s} + 2) * absS - (${s} + 3)) * absS * absS + 1;
coeffs[2] = ((${s} + 2) * oneMinusAbsS - (${s} + 3)) * oneMinusAbsS * oneMinusAbsS + 1;
coeffs[3] = ((${s} * twoMinusAbsS - 5 * ${s}) * twoMinusAbsS + 8 * ${s}) * twoMinusAbsS - 4 * ${s};
return coeffs;
}

fn cubicInterpolation1D(x: array<${h}, 4>, coefs: array<${h}, 4>) -> ${h} {
var coefsSum: ${h} = coefs[0] + coefs[1] + coefs[2] + coefs[3];
return (x[0] * coefs[0] + x[1] * coefs[1]+ x[2] * coefs[2]+ x[3] * coefs[3]) / coefsSum;
}

fn bicubicInterpolation(output_indices: ${t.type.indices}) -> ${h} {
var input_indices: ${e.type.indices} = output_indices;
return colCubicInterpolation(input_indices, output_indices);
}
`},id=(e,t,i,r,a)=>{let[n,s,o,u,l]=i.length===3?[-1,0,1,2,-1]:[0,2,3,4,1],d=e.type.value;return`
fn getInputValue(batch: u32, channel: u32, depth:u32, height: u32, width: u32) -> ${d} {
var input_indices: ${e.type.indices};
${e.indicesSet("input_indices",s,`max(0, min(depth, ${i[s]} - 1))`)};
${e.indicesSet("input_indices",o,`max(0, min(height, ${i[o]} - 1))`)};
${e.indicesSet("input_indices",u,`max(0, min(width, ${i[u]} - 1))`)};
${zr(e,l,n,3)}
return ${e.getByIndices("input_indices")};
}

fn trilinearInterpolation(output_indices: ${t.type.indices}) -> ${d} {
var originalIndices = calculateOriginalIndicesFromOutputIndices(output_indices);
var depth:${d} = originalIndices[${s}];
var height:${d} = originalIndices[${o}];
var width:${d} = originalIndices[${u}];
${r?`if (depth < 0 || depth > (${i[s]} - 1) || height < 0 || height > (${i[o]} - 1) || width < 0 || (width > ${i[u]} - 1)) {
return ${a};
}`:""};

depth = max(0, min(depth, ${i[s]} - 1));
height = max(0, min(height, ${i[o]} - 1));
width = max(0, min(width, ${i[u]} - 1));
var depth1: u32 = u32(depth);
var height1: u32 = u32(height);
var width1: u32 = u32(width);
var depth2: u32 = u32(depth + 1);
var height2: u32 = u32(height + 1);
var width2: u32 = u32(width + 1);
var channel: u32 = ${i.length>3?`u32(originalIndices[${l}])`:"0"};
var batch: u32 =  ${i.length>3?`u32(originalIndices[${n}])`:"0"};

var x111: ${d} = getInputValue(batch, channel, depth1, height1, width1);
var x112: ${d} = getInputValue(batch, channel, depth1, height1, width2);
var x121: ${d} = getInputValue(batch, channel, depth1, height2, width1);
var x122: ${d} = getInputValue(batch, channel, depth1, height2, width2);
var x211: ${d} = getInputValue(batch, channel, depth2, height1, width1);
var x212: ${d} = getInputValue(batch, channel, depth2, height1, width2);
var x221: ${d} = getInputValue(batch, channel, depth2, height2, width1);
var x222: ${d} = getInputValue(batch, channel, depth2, height2, width2);
var dx1: ${d} = abs(depth - ${d}(depth1));
var dx2: ${d} = abs(${d}(depth2) - depth);
var dy1: ${d} = abs(height - ${d}(height1));
var dy2: ${d} = abs(${d}(height2) - height);
var dz1: ${d} = abs(width - ${d}(width1));
var dz2: ${d} = abs(${d}(width2) - width);
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
}`},rd=(e,t,i,r,a,n)=>{let s=e.dims,o=Kl(n,t.axes,s.length),u=Zl(s,r,a,t.axes),l=r.slice();r.length===0&&(l=s.map((m,w)=>m===0?1:u[w]/m),t.keepAspectRatioPolicy!=="stretch"&&(u=Ql(s,l,t)));let d=B("output",e.dataType,u.length),p=S("input",e.dataType,s.length),c=k.size(u),h=s.length===u.length&&s.every((m,w)=>m===u[w]),f=t.coordinateTransformMode==="tf_crop_and_resize",g=t.extrapolationValue,y=p.type.value,_=m=>`
${h?"":`
${Fl(t.coordinateTransformMode,y)};
${(()=>{switch(t.mode){case"nearest":return`
   ${Jl(p,s)};
   ${jl(t.nearestMode,i,y)};
   ${Yl(p,d,s,u,l.length,o.length,f)};
   `;case"linear":return`
   ${Xl(d,s,u,l.length,o.length)};
   ${(()=>{if(s.length===2||s.length===4)return`${ed(p,d,s,f,g)}`;if(s.length===3||s.length===5)return`${id(p,d,s,f,g)}`;throw Error("Linear mode only supports input dims 2, 3, 4 and 5 are supported in linear mode.")})()};
 `;case"cubic":return`
 ${(()=>{if(s.length===2||s.length===4)return`${td(p,d,s,u,l,o,t.cubicCoeffA,f,t.extrapolationValue,t.excludeOutside)}`;throw Error("Cubic mode only supports input dims 2 and 4 are supported in linear mode.")})()};
 `;default:throw Error("Invalid resize mode")}})()};
`}
${m.registerUniform("output_size","u32").registerUniform("scales","f32",l.length).registerUniform("roi","f32",o.length).declareVariables(p,d)}
${m.mainStart()}
${m.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
${h?"output[global_idx] = input[global_idx];":`
let output_indices = ${d.offsetToIndices("global_idx")};
var input_indices: ${p.type.indices};
${(()=>{switch(t.mode){case"nearest":return`input_indices = calculateInputIndicesFromOutputIndices(output_indices);
     if (checkInputIndices(input_indices)) {
       output[global_idx] = ${p.getByIndices("input_indices")};
     } else {
       output[global_idx] = ${t.extrapolationValue};
     }`;case"linear":return`output[global_idx] = ${s.length===2||s.length===4?"bilinearInterpolation":"trilinearInterpolation"}(output_indices);`;case"cubic":return"output[global_idx] = bicubicInterpolation(output_indices);";default:throw Error(`Unsupported resize mode: ${t.mode}`)}})()};
`}
}`;return{name:"Resize",shaderCache:{hint:`${t.cacheKey}|${i}|${l.length>0?t.mode==="cubic"?l:l.length:""}|${a.length>0?a:""}|${o.length>0?o:""}|${h}|${t.mode==="nearest"?s.length:s}`,inputDependencies:["rank"]},getShaderSource:_,getRunData:()=>({outputs:[{dims:u,dataType:e.dataType}],dispatchGroup:{x:Math.ceil(c/64)},programUniforms:[{type:12,data:c},{type:1,data:l},{type:1,data:o},...M(s,u)]})}},ad=e=>{let t=e.customDataBuffer;return new Uint32Array(t,t.byteOffset,1)[0]},nd=(e,t)=>{let i=[],r=[],a=[],n=ad(e);if(t.antialias!==0)throw Error("Only default value (0) for Antialias attribute is supported");Hl(e.inputs,t,n,i,r,a),e.compute(rd(e.inputs[0],t,n,i,r,a),{inputs:[0]})},sd=e=>{let t=e.antialias,i=e.axes,r=e.coordinateTransformMode,a=e.cubicCoeffA,n=e.excludeOutside!==0,s=e.extrapolationValue,o=e.keepAspectRatioPolicy,u=e.mode,l=e.nearestMode===""?"simple":e.nearestMode;return Q({antialias:t,axes:i,coordinateTransformMode:r,cubicCoeffA:a,excludeOutside:n,extrapolationValue:s,keepAspectRatioPolicy:o,mode:u,nearestMode:l})}}),od,ud,ld,rc=T(()=>{N(),W(),G(),od=e=>{if(!e||e.length<3)throw new Error("layerNorm requires at least 3 inputs.");let t=e[0],i=e[1],r=e[2];if(t.dataType!==i.dataType||t.dataType!==r.dataType)throw new Error("All inputs must have the same data type");if(t.dims.length!==3&&t.dims.length!==2)throw new Error("Input must be 2D or 3D");if(i.dims.length!==3&&i.dims.length!==2)throw new Error("Skip must be 2D or 3D");let a=t.dims[t.dims.length-1],n=t.dims[t.dims.length-2];if(i.dims[i.dims.length-1]!==a)throw new Error("Skip must have the same hidden size as input");if(i.dims[i.dims.length-2]!==n)throw new Error("Skip must have the same sequence length as input");if(r.dims.length!==1)throw new Error("Gamma must be 1D");if(r.dims[r.dims.length-1]!==a)throw new Error("Gamma must have the same hidden size as input");if(e.length>3){let s=e[3];if(s.dims.length!==1)throw new Error("Beta must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Beta must have the same hidden size as input")}if(e.length>4){let s=e[4];if(s.dims.length!==1)throw new Error("Bias must be 1D");if(s.dims[s.dims.length-1]!==a)throw new Error("Bias must have the same hidden size as input")}},ud=(e,t,i,r)=>{let a=t.simplified,n=e[0].dims,s=k.size(n),o=n,u=s,l=n.slice(-1)[0],d=r?n.slice(0,-1).concat(1):[],p=!a&&e.length>3,c=e.length>4,h=r&&i>1,f=r&&i>2,g=i>3,y=64,_=ie(l),m=[{type:12,data:u},{type:12,data:_},{type:12,data:l},{type:1,data:t.epsilon}],w=b=>{let x=[{name:"output_size",type:"u32"},{name:"components",type:"u32"},{name:"hidden_size",type:"u32"},{name:"epsilon",type:"f32"}],v=[S("x",e[0].dataType,e[0].dims,_),S("skip",e[1].dataType,e[1].dims,_),S("gamma",e[2].dataType,e[2].dims,_)];p&&v.push(S("beta",e[3].dataType,e[3].dims,_)),c&&v.push(S("bias",e[4].dataType,e[4].dims,_)),v.push(B("output",e[0].dataType,o,_)),h&&v.push(B("mean_output",1,d)),f&&v.push(B("inv_std_output",1,d)),g&&v.push(B("input_skip_bias_sum",e[0].dataType,o,_));let I=se(e[0].dataType),z=se(1,_);return`

${b.registerUniforms(x).declareVariables(...v)}
var<workgroup> sum_shared : array<${z}, ${y}>;
var<workgroup> sum_squared_shared : array<${z}, ${y}>;

${b.mainStart([y,1,1])}
let ix = local_id.x;
let iy = global_id.x / ${y};

let hidden_size_vectorized: u32 = uniforms.hidden_size / uniforms.components;
var stride = hidden_size_vectorized / ${y};
let offset = ix * stride + iy * hidden_size_vectorized;
let offset1d = stride * ix;
if (ix == ${y-1}) {
stride = hidden_size_vectorized - stride * ix;
}
for (var i: u32 = 0; i < stride; i++) {
let skip_value = skip[offset + i];
let bias_value = ${c?"bias[offset1d + i]":I+"(0.0)"};
let input_value = x[offset + i];
let value = input_value + skip_value + bias_value;
${g?"input_skip_bias_sum[offset + i] = value;":""}
output[offset + i] = value;
let f32_value = ${ot(I,_,"value")};
sum_shared[ix] += f32_value;
sum_squared_shared[ix] += f32_value * f32_value;
}
workgroupBarrier();

var reduce_size : u32 = ${y};
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
let mean = ${Le("sum",_)} / f32(uniforms.hidden_size);
let inv_std_dev = inverseSqrt(${Le("square_sum",_)} / f32(uniforms.hidden_size) ${a?"":"- mean * mean"} + uniforms.epsilon);
${h?"mean_output[global_idx] = mean;":""}
${f?"inv_std_output[global_idx] = inv_std_dev;":""}

for (var i: u32 = 0; i < stride; i++) {
output[offset + i] = (output[offset + i] ${a?"":`- ${I}(mean)`}) *
 ${I}(inv_std_dev) * gamma[offset1d + i]
 ${p?"+ beta[offset1d + i]":""};
}
}`},$=[{dims:o,dataType:e[0].dataType}];return i>1&&$.push({dims:d,dataType:1}),i>2&&$.push({dims:d,dataType:1}),i>3&&$.push({dims:n,dataType:e[0].dataType}),{name:"SkipLayerNormalization",shaderCache:{hint:`${_};${h};${f};${g}`,inputDependencies:e.map((b,x)=>"type")},getShaderSource:w,getRunData:()=>({outputs:$,dispatchGroup:{x:Math.ceil(u/l)},programUniforms:m})}},ld=(e,t)=>{od(e.inputs);let i=[0];e.outputCount>1&&i.push(-3),e.outputCount>2&&i.push(-3),e.outputCount>3&&i.push(3),e.compute(ud(e.inputs,t,e.outputCount,!1),{outputs:i})}}),dd,xt,pd,Er,cd,hd,fd,md,ac=T(()=>{N(),W(),re(),G(),dd=(e,t)=>{if(!e||e.length<1)throw new Error("too few inputs");if(t.axes.length!==0){if(t.axes.length!==t.starts.length||t.axes.length!==t.ends.length)throw new Error("axes, starts and ends must have the same length")}else if(t.starts.length!==t.ends.length)throw new Error("starts and ends must have the same length");e.slice(1).forEach((i,r)=>{if(e[r+1].dataType!==6&&e[r+1].dataType!==7)throw new Error(`Input ${r} must be an array of int32 or int64`)})},xt=(e,t)=>{let i=[];if(e.length>t)if(e[t].dataType===7)e[t].getBigInt64Array().forEach(r=>i.push(Number(r)));else if(e[t].dataType===6)e[t].getInt32Array().forEach(r=>i.push(Number(r)));else throw new Error(`Input ${t} must be an array of int32 or int64`);return i},pd=(e,t)=>{if(e.length>1){let i=xt(e,1),r=xt(e,2),a=xt(e,3);return a.length===0&&(a=[...Array(e[0].dims.length).keys()]),Q({starts:i,ends:r,axes:a})}else return t},Er=(e,t,i,r,a)=>{let n=e;return e<0&&(n+=i[r[t]]),a[t]<0?Math.max(0,Math.min(n,i[r[t]]-1)):Math.max(0,Math.min(n,i[r[t]]))},cd=(e,t,i)=>`fn calculateInputIndices(output_indices: ${t.type.indices}) -> ${e.type.indices} {
var input_indices: ${e.type.indices};
var carry = 0u;
for (var i = ${i.length}; i >= 0; i--) {
 let input_shape_i = ${R("uniforms.input_shape","i",i.length)};
 let steps_i = ${R("uniforms.steps","i",i.length)};
 let signs_i = ${R("uniforms.signs","i",i.length)};
 let starts_i = ${R("uniforms.starts","i",i.length)};
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
}`,hd=(e,t)=>{let i=e[0].dims,r=k.size(i),a=t.axes.length>0?k.normalizeAxes(t.axes,i.length):[...Array(i.length).keys()],n=xt(e,4);n.forEach(_=>_!==0||(()=>{throw new Error("step cannot be 0")})),n.length===0&&(n=Array(a.length).fill(1));let s=t.starts.map((_,m)=>Er(_,m,i,a,n)),o=t.ends.map((_,m)=>Er(_,m,i,a,n));if(a.length!==s.length||a.length!==o.length)throw new Error("start, ends and axes should have the same number of elements");if(a.length!==i.length)for(let _=0;_<i.length;++_)a.includes(_)||(s.splice(_,0,0),o.splice(_,0,i[_]),n.splice(_,0,1));let u=n.map(_=>Math.sign(_));n.forEach((_,m,w)=>{if(_<0){let $=(o[m]-s[m])/_,b=s[m],x=b+$*n[m];s[m]=x,o[m]=b,w[m]=-_}});let l=i.slice(0);a.forEach((_,m)=>{l[_]=Math.ceil((o[_]-s[_])/n[_])});let d={dims:l,dataType:e[0].dataType},p=B("output",e[0].dataType,l.length),c=S("input",e[0].dataType,e[0].dims.length),h=k.size(l),f=[{name:"outputSize",type:"u32"},{name:"starts",type:"u32",length:s.length},{name:"signs",type:"i32",length:u.length},{name:"steps",type:"u32",length:n.length}],g=[{type:12,data:h},{type:12,data:s},{type:6,data:u},{type:12,data:n},...M(e[0].dims,l)],y=_=>`
${_.registerUniforms(f).declareVariables(c,p)}
${cd(c,p,i)}
${_.mainStart()}
${_.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.outputSize")}
let output_indices = ${p.offsetToIndices("global_idx")};
let input_indices = calculateInputIndices(output_indices);
${p.setByOffset("global_idx",c.getByIndices("input_indices"))}
}`;return{name:"Slice",shaderCache:{hint:`${u.length}_${s.length}_${n.length}`,inputDependencies:["rank"]},getShaderSource:y,getRunData:()=>({outputs:[d],dispatchGroup:{x:Math.ceil(r/64)},programUniforms:g})}},fd=(e,t)=>{dd(e.inputs,t);let i=pd(e.inputs,t);e.compute(hd(e.inputs,i),{inputs:[0]})},md=e=>{let t=e.starts,i=e.ends,r=e.axes;return Q({starts:t,ends:i,axes:r})}}),gd,_d,yd,$d,nc=T(()=>{N(),W(),re(),We(),G(),gd=e=>{if(!e||e.length!==1)throw new Error("Softmax op requires 1 input.")},_d=(e,t)=>{let i=e.inputs[0],r=i.dims,a=k.size(r),n=r.length,s=k.normalizeAxis(t.axis,n),o=s<r.length-1,u,l=[];o?(l=Array.from({length:n},(v,I)=>I),l[s]=n-1,l[n-1]=s,u=e.compute(we(i,l),{inputs:[i],outputs:[-1]})[0]):u=i;let d=u.dims,p=d[n-1],c=a/p,h=ie(p),f=p/h,g=64;c===1&&(g=256);let y=(v,I)=>I===4?`max(max(${v}.x, ${v}.y), max(${v}.z, ${v}.w))`:I===2?`max(${v}.x, ${v}.y)`:I===3?`max(max(${v}.x, ${v}.y), ${v}.z)`:v,_=S("x",u.dataType,u.dims,h),m=B("result",u.dataType,u.dims,h),w=_.type.value,$=se(u.dataType)==="f32"?`var threadMax = ${w}(-3.402823e+38f);`:`var threadMax = ${w}(-65504.0h);`,b=v=>`
var<workgroup> rowMaxShared : ${w};
var<workgroup> rowSumShared : ${w};
var<workgroup> threadShared : array<${w}, ${g}>;

fn getValue(row: i32, col: i32, row_stride: i32) -> ${w} {
let index = row * row_stride + col;
return x[index];
}

fn setValue(row: i32, col: i32, row_stride: i32, value: ${w}) {
let index = row * row_stride + col;
result[index] = value;
}
${v.registerUniform("packedCols","i32").declareVariables(_,m)}
${v.mainStart(g)}
let gindex = i32(global_idx);
let lindex = i32(local_idx);
const wg = ${g};
let row = gindex / wg;
let cols = uniforms.packedCols;
let row_stride : i32 = uniforms.packedCols;

// find the rows max
${$}
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
rowMaxShared = ${w}(${y("threadShared[0]",h)});
}
workgroupBarrier();

// find the rows sum
var threadSum = ${w}(0.0);
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
rowSumShared = ${w}(${Le("threadShared[0]",h)});
}
workgroupBarrier();

// calculate final value for each element in the row
for (var col = lindex; col < cols; col += wg) {
let value = exp(getValue(row, col, row_stride) - rowMaxShared) / rowSumShared;
setValue(row, col, row_stride, value);
}
}`,x=e.compute({name:"Softmax",shaderCache:{hint:`${h};${g}`,inputDependencies:["type"]},getRunData:()=>({outputs:[{dims:d,dataType:u.dataType}],dispatchGroup:{x:c},programUniforms:[{type:6,data:f}]}),getShaderSource:b},{inputs:[u],outputs:[o?-1:0]})[0];o&&e.compute(we(x,l),{inputs:[x]})},yd=(e,t)=>{gd(e.inputs),_d(e,t)},$d=e=>Q({axis:e.axis})}),Cr,wd,bd,vd,xd,sc=T(()=>{N(),W(),G(),Cr=e=>Array.from(e.getBigInt64Array(),Number),wd=e=>{if(!e||e.length!==2)throw new Error("Tile requires 2 inputs.");if(e[0].dataType!==1&&e[0].dataType!==10&&e[0].dataType!==6&&e[0].dataType!==12)throw new Error("Tile only support float, float16, int32, and uint32 data types");if(e[1].dataType!==7)throw new Error("Tile `repeats` input should be of int64 data type");if(e[1].dims.length!==1)throw new Error("Tile `repeats` input should be 1-D");if(Cr(e[1]).length!==e[0].dims.length)throw new Error("Tile `repeats` input should have same number of elements as rank of input data tensor")},bd=(e,t)=>{let i=[];for(let r=0;r<e.length;++r)i.push(e[r]*t[r]);return i},vd=(e,t)=>{let i=e[0].dims,r=t??Cr(e[1]),a=bd(i,r),n=k.size(a),s=e[0].dataType,o=S("input",s,i.length),u=B("output",s,a.length),l=d=>`
const inputShape = ${o.indices(...i)};
${d.registerUniform("output_size","u32").declareVariables(o,u)}
${d.mainStart()}
${d.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.output_size")}
let output_indices = ${u.offsetToIndices("global_idx")};
var input_indices: ${o.type.indices};
for (var i = 0; i < ${i.length}; i++) {
let input_dim_i = ${o.indicesGet("uniforms.input_shape","i")};
let input_dim_value = ${u.indicesGet("output_indices","i")}  % input_dim_i;

${o.indicesSet("input_indices","i","input_dim_value")}
}
${u.setByOffset("global_idx",o.getByIndices("input_indices"))}
}`;return{name:"Tile",shaderCache:{hint:`${r}`,inputDependencies:["rank"]},getRunData:()=>({outputs:[{dims:a,dataType:e[0].dataType}],dispatchGroup:{x:Math.ceil(n/64)},programUniforms:[{type:12,data:n},...M(e[0].dims,a)]}),getShaderSource:l}},xd=e=>{wd(e.inputs),e.compute(vd(e.inputs),{inputs:[0]})}}),kd,Sd,Id,oc=T(()=>{N(),W(),G(),kd=(e,t,i,r,a)=>{let n=B("output_data",a,i.length,4),s=S("a_data",t[1].dataType,t[1].dims.length,4),o=S("b_data",t[2].dataType,t[2].dims.length,4),u=S("c_data",t[0].dataType,t[0].dims.length,4),l,d=(p,c,h)=>`select(${c}, ${p}, ${h})`;if(!r)l=n.setByOffset("global_idx",d(s.getByOffset("global_idx"),o.getByOffset("global_idx"),u.getByOffset("global_idx")));else{let p=(c,h,f="")=>{let g=`a_data[index_a${h}][component_a${h}]`,y=`b_data[index_b${h}][component_b${h}]`,_=`bool(c_data[index_c${h}] & (0xffu << (component_c${h} * 8)))`;return`
 let output_indices${h} = ${n.offsetToIndices(`global_idx * 4u + ${h}u`)};
 let offset_a${h} = ${s.broadcastedIndicesToOffset(`output_indices${h}`,n)};
 let offset_b${h} = ${o.broadcastedIndicesToOffset(`output_indices${h}`,n)};
 let offset_c${h} = ${u.broadcastedIndicesToOffset(`output_indices${h}`,n)};
 let index_a${h} = offset_a${h} / 4u;
 let index_b${h} = offset_b${h} / 4u;
 let index_c${h} = offset_c${h} / 4u;
 let component_a${h} = offset_a${h} % 4u;
 let component_b${h} = offset_b${h} % 4u;
 let component_c${h} = offset_c${h} % 4u;
 ${c}[${h}] = ${f}(${d(g,y,_)});
`};a===9?l=`
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
${e.registerUniform("vec_size","u32").declareVariables(u,s,o,n)}
${e.mainStart()}
${e.guardAgainstOutOfBoundsWorkgroupSizes("uniforms.vec_size")}
${l}
}`},Sd=e=>{let t=e[1].dims,i=e[2].dims,r=e[0].dims,a=e[1].dataType,n=!(k.areEqual(t,i)&&k.areEqual(i,r)),s=t,o=k.size(t);if(n){let l=nt.calcShape(nt.calcShape(t,i,!1),r,!1);if(!l)throw new Error("Can't perform where op on the given tensors");s=l,o=k.size(s)}let u=Math.ceil(o/4);return{name:"Where",shaderCache:{inputDependencies:["rank","rank","rank"]},getShaderSource:l=>kd(l,e,s,n,a),getRunData:()=>({outputs:[{dims:s,dataType:a}],dispatchGroup:{x:Math.ceil(o/64/4)},programUniforms:[{type:12,data:u},...M(r,t,i,s)]})}},Id=e=>{e.compute(Sd(e.inputs))}}),Td,uc=T(()=>{vp(),Gi(),xp(),kp(),Sp(),Ip(),Tp(),Ap(),Rp(),Dp(),Mp(),Up(),Pp(),qp(),Np(),Vp(),Lp(),Wp(),Gp(),Hp(),Fp(),jp(),Kp(),Zp(),Qp(),qu(),Xp(),Yp(),Jp(),ec(),tc(),Vi(),ic(),Zu(),rc(),ac(),nc(),Fu(),sc(),We(),Ki(),oc(),Td=new Map([["Abs",[ss]],["Acos",[os]],["Acosh",[us]],["Add",[Zs]],["ArgMax",[Hn,Wi]],["ArgMin",[Gn,Wi]],["Asin",[ls]],["Asinh",[ds]],["Atan",[ps]],["Atanh",[cs]],["Attention",[Xn]],["AveragePool",[Sl,kl]],["BatchNormalization",[ts]],["BiasAdd",[as]],["BiasSplitGelu",[Fs]],["Cast",[fs,hs]],["Ceil",[_s]],["Clip",[gs]],["Concat",[lo,po]],["Conv",[or,nr]],["ConvTranspose",[Po,Do]],["Cos",[ys]],["Cosh",[$s]],["CumSum",[No,Vo]],["DepthToSpace",[Ho,Fo]],["DequantizeLinear",[Rl,Dl]],["Div",[Qs]],["Einsum",[Yo,Jo]],["Elu",[ws,_t]],["Equal",[Xs]],["Erf",[bs]],["Exp",[vs]],["Expand",[ru]],["FastGelu",[nu]],["Floor",[xs]],["FusedConv",[or,nr]],["Gather",[lu,uu]],["GatherElements",[wu,$u]],["GatherBlockQuantized",[mu,gu]],["GatherND",[pu,cu]],["Gelu",[ks]],["Gemm",[ku,xu]],["GlobalAveragePool",[Tl,Il]],["GlobalMaxPool",[Ol,Cl]],["Greater",[to]],["GreaterOrEqual",[ro]],["GridSample",[Bu,Ru]],["GroupQueryAttention",[Ju]],["HardSigmoid",[As,Os]],["InstanceNormalization",[il]],["LayerNormalization",[nl]],["LeakyRelu",[Ss,_t]],["Less",[io]],["LessOrEqual",[ao]],["Log",[Ns]],["MatMul",[ol]],["MatMulNBits",[pl,cl]],["MaxPool",[zl,El]],["Mul",[Ys]],["MultiHeadAttention",[Pu,Mu]],["Neg",[Ts]],["Not",[Is]],["Pad",[bl]],["Pow",[Js]],["QuickGelu",[Ws,_t]],["Range",[Pl]],["Reciprocal",[zs]],["ReduceMin",[qn]],["ReduceMean",[Rn]],["ReduceMax",[Pn]],["ReduceSum",[Vn]],["ReduceProd",[Nn]],["ReduceL1",[Dn]],["ReduceL2",[Mn]],["ReduceLogSum",[Wn]],["ReduceLogSumExp",[Un]],["ReduceSumSquare",[Ln]],["Relu",[Es]],["Resize",[nd,sd]],["RotaryEmbedding",[Ku]],["ScatterND",[Ll,Vl]],["Sigmoid",[Cs]],["Sin",[Bs]],["Sinh",[Rs]],["Slice",[fd,md]],["SkipLayerNormalization",[ld]],["Split",[Gu,Hu]],["Sqrt",[Ds]],["Softmax",[yd,$d]],["Sub",[eo]],["Tan",[Ms]],["Tanh",[Us]],["ThresholdedRelu",[qs,_t]],["Tile",[xd]],["Transpose",[en,tn]],["Where",[Id]]])}),zd,lc=T(()=>{ze(),qe(),G(),zd=class{constructor(e){this.backend=e,this.repo=new Map,this.attributesBound=!1}getArtifact(e){return this.repo.get(e)}setArtifact(e,t){this.repo.set(e,t)}run(e,t,i,r,a){Te(e.programInfo.name);let n=this.backend.device,s=this.backend.getComputePassEncoder();this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2);let o=[];for(let l of t)o.push({binding:o.length,resource:{buffer:l.buffer}});for(let l of i)o.push({binding:o.length,resource:{buffer:l.buffer}});a&&o.push({binding:o.length,resource:a});let u=n.createBindGroup({layout:e.computePipeline.getBindGroupLayout(0),entries:o,label:e.programInfo.name});if(this.backend.sessionStatus==="capturing"){let l={kernelId:this.backend.currentKernelId,computePipeline:e.computePipeline,bindGroup:u,dispatchGroup:r};this.backend.capturedCommandList.get(this.backend.currentSessionId).push(l)}s.setPipeline(e.computePipeline),s.setBindGroup(0,u),s.dispatchWorkgroups(...r),this.backend.writeTimestamp(this.backend.pendingDispatchNumber*2+1),this.backend.pendingDispatchNumber++,(this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber||this.backend.queryType==="at-passes")&&this.backend.endComputePass(),this.backend.pendingDispatchNumber>=this.backend.maxDispatchNumber&&this.backend.flush(),xe(e.programInfo.name)}dispose(){}build(e,t){Te(e.name);let i=this.backend.device,r=[];[{feature:"shader-f16",extension:"f16"},{feature:"subgroups",extension:"subgroups"}].forEach(l=>{i.features.has(l.feature)&&r.push(`enable ${l.extension};`)});let a=Ka(t,this.backend.device.limits),n=e.getShaderSource(a),s=`${r.join(`
`)}
${a.additionalImplementations}
${n}`,o=i.createShaderModule({code:s,label:e.name});j("verbose",()=>`[WebGPU] ${e.name} shader code: ${s}`);let u=i.createComputePipeline({compute:{module:o,entryPoint:"main"},layout:"auto",label:e.name});return xe(e.name),{programInfo:e,computePipeline:u,uniformVariablesInfo:a.variablesInfo}}normalizeDispatchGroupSize(e){let t=typeof e=="number"?e:e.x,i=typeof e=="number"?1:e.y||1,r=typeof e=="number"?1:e.z||1,a=this.backend.device.limits.maxComputeWorkgroupsPerDimension;if(t<=a&&i<=a&&r<=a)return[t,i,r];let n=t*i*r,s=Math.ceil(Math.sqrt(n));if(s>a){if(s=Math.ceil(Math.cbrt(n)),s>a)throw new Error("Total dispatch size exceeds WebGPU maximum.");return[s,s,s]}else return[s,s,1]}}}),Ed={};me(Ed,{WebGpuBackend:()=>Bd});var Cd,Od,Ad,Bd,dc=T(()=>{ze(),N(),qe(),Ra(),wp(),uc(),lc(),Cd=(e,t)=>{if(t.length!==e.length)throw new Error(`inputDependencies length ${t.length} is not equal to inputTensors length ${e.length}.`);let i=[];for(let r=0;r<e.length;++r){let a=e[r].dataType;switch(t[r]){case"none":{i.push("");break}case"type":{i.push(`${a}`);break}case"rank":{let n=e[r].dims.length;i.push(`${a};${n}`);break}case"dims":{let n=e[r].dims.join(",");i.push(`${a};${n}`);break}default:throw new Error(`unsupported input dependency: ${t[r]}`)}}return i.join("|")},Od=(e,t,i)=>{let r=e.name;return e.shaderCache?.hint&&(r+="["+e.shaderCache.hint+"]"),r+=":"+i+`:${Cd(t,e.shaderCache?.inputDependencies??new Array(t.length).fill("dims"))}`,r},Ad=class{constructor(e){e&&(this.architecture=e.architecture,this.vendor=e.vendor)}isArchitecture(e){return this.architecture===e}isVendor(e){return this.vendor===e}},Bd=class{constructor(){this.currentSessionId=null,this.currentKernelId=null,this.commandEncoder=null,this.computePassEncoder=null,this.maxDispatchNumber=16,this.pendingDispatchNumber=0,this.pendingKernels=[],this.pendingQueries=new Map,this.sessionStatus="default",this.capturedCommandList=new Map,this.capturedPendingKernels=new Map,this.sessionExternalDataMapping=new Map}get currentKernelCustomData(){if(this.currentKernelId===null)throw new Error("currentKernelCustomData(): currentKernelId is null. (should not happen)");let e=this.kernelCustomData.get(this.currentKernelId);return e||(e={},this.kernelCustomData.set(this.currentKernelId,e)),e}async initialize(e,t){this.env=e;let i=[],r={requiredLimits:{maxComputeWorkgroupStorageSize:t.limits.maxComputeWorkgroupStorageSize,maxComputeWorkgroupsPerDimension:t.limits.maxComputeWorkgroupsPerDimension,maxStorageBufferBindingSize:t.limits.maxStorageBufferBindingSize,maxBufferSize:t.limits.maxBufferSize,maxComputeInvocationsPerWorkgroup:t.limits.maxComputeInvocationsPerWorkgroup,maxComputeWorkgroupSizeX:t.limits.maxComputeWorkgroupSizeX,maxComputeWorkgroupSizeY:t.limits.maxComputeWorkgroupSizeY,maxComputeWorkgroupSizeZ:t.limits.maxComputeWorkgroupSizeZ},requiredFeatures:i},a=n=>t.features.has(n)&&i.push(n)&&!0;a("chromium-experimental-timestamp-query-inside-passes")||a("timestamp-query"),a("shader-f16"),a("subgroups"),this.device=await t.requestDevice(r),this.adapterInfo=new Ad(t.info||await t.requestAdapterInfo()),this.gpuDataManager=Ga(this),this.programManager=new zd(this),this.kernels=new Map,this.kernelPersistentData=new Map,this.kernelCustomData=new Map,ki(e.logLevel,!!e.debug),this.device.onuncapturederror=n=>{n.error instanceof GPUValidationError&&console.error(`An uncaught WebGPU validation error was raised: ${n.error.message}`)},Object.defineProperty(this.env.webgpu,"device",{value:this.device,writable:!1,enumerable:!0,configurable:!1}),Object.defineProperty(this.env.webgpu,"adapter",{value:t,writable:!1,enumerable:!0,configurable:!1}),this.setQueryType()}dispose(){typeof this.querySet<"u"&&this.querySet.destroy(),this.gpuDataManager.dispose()}getCommandEncoder(){return this.commandEncoder||(this.commandEncoder=this.device.createCommandEncoder()),this.commandEncoder}getComputePassEncoder(){if(!this.computePassEncoder){let e=this.getCommandEncoder(),t={};this.queryType==="at-passes"&&(t.timestampWrites={querySet:this.querySet,beginningOfPassWriteIndex:this.pendingDispatchNumber*2,endOfPassWriteIndex:this.pendingDispatchNumber*2+1}),this.computePassEncoder=e.beginComputePass(t)}return this.computePassEncoder}endComputePass(){this.computePassEncoder&&(this.computePassEncoder.end(),this.computePassEncoder=null)}flush(){if(!this.commandEncoder)return;Te(),this.endComputePass();let e;this.queryType!=="none"&&(this.commandEncoder.resolveQuerySet(this.querySet,0,this.pendingDispatchNumber*2,this.queryResolveBuffer,0),e=this.device.createBuffer({size:this.pendingDispatchNumber*2*8,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),this.pendingQueries.set(e,this.pendingKernels),this.pendingKernels=[],this.commandEncoder.copyBufferToBuffer(this.queryResolveBuffer,0,e,0,this.pendingDispatchNumber*2*8)),this.device.queue.submit([this.commandEncoder.finish()]),this.gpuDataManager.refreshPendingBuffers(),this.commandEncoder=null,this.pendingDispatchNumber=0,this.queryType!=="none"&&e.mapAsync(GPUMapMode.READ).then(()=>{let t=new BigUint64Array(e.getMappedRange()),i=this.pendingQueries.get(e);for(let r=0;r<t.length/2;r++){let a=i[r],n=a.kernelId,s=this.kernels.get(n),o=s.kernelType,u=s.kernelName,l=a.programName,d=a.inputTensorViews,p=a.outputTensorViews,c=t[r*2],h=t[r*2+1];typeof this.queryTimeBase>"u"&&(this.queryTimeBase=c);let f=Number(c-this.queryTimeBase),g=Number(h-this.queryTimeBase);if(!Number.isSafeInteger(f)||!Number.isSafeInteger(g))throw new RangeError("incorrect timestamp range");if(this.env.webgpu.profiling?.ondata)this.env.webgpu.profiling.ondata({version:1,inputsMetadata:d.map(y=>({dims:y.dims,dataType:Pe(y.dataType)})),outputsMetadata:p.map(y=>({dims:y.dims,dataType:Pe(y.dataType)})),kernelId:n,kernelType:o,kernelName:u,programName:l,startTime:f,endTime:g});else{let y="";d.forEach((m,w)=>{y+=`input[${w}]: [${m.dims}] | ${Pe(m.dataType)}, `});let _="";p.forEach((m,w)=>{_+=`output[${w}]: [${m.dims}] | ${Pe(m.dataType)}, `}),console.log(`[profiling] kernel "${n}|${o}|${u}|${l}" ${y}${_}execution time: ${g-f} ns`)}pt("GPU",`${l}::${c}::${h}`)}e.unmap(),this.pendingQueries.delete(e)}),xe()}run(e,t,i,r,a,n){Te(e.name);let s=[];for(let m=0;m<t.length;++m){let w=t[m].data;if(w===0)continue;let $=this.gpuDataManager.get(w);if(!$)throw new Error(`no GPU data for input: ${w}`);s.push($)}let{outputs:o,dispatchGroup:u,programUniforms:l}=e.getRunData(t),d=i.length===0?o.map((m,w)=>w):i;if(d.length!==o.length)throw new Error(`Output size ${d.length} must be equal to ${o.length}.`);let p=[],c=[];for(let m=0;m<o.length;++m){if(!Number.isInteger(d[m])||d[m]<-3||d[m]>=n)throw new Error(`Invalid output index: ${d[m]}`);if(d[m]===-3)continue;let w=d[m]===-1,$=d[m]===-2,b=w||$?a(o[m].dataType,o[m].dims):r(d[m],o[m].dataType,o[m].dims);if(p.push(b),b.data===0)continue;let x=this.gpuDataManager.get(b.data);if(!x)throw new Error(`no GPU data for output: ${b.data}`);if(w&&this.temporaryData.push(x),$){let v=this.kernelPersistentData.get(this.currentKernelId);v||(v=[],this.kernelPersistentData.set(this.currentKernelId,v)),v.push(x)}c.push(x)}if(s.length!==t.length||c.length!==p.length){if(c.length===0)return xe(e.name),p;throw new Error(`Program ${e.name} has zero-sized tensor(s) in inputs or outputs. This is not supported now.`)}let h;if(l){let m=0,w=[];l.forEach(v=>{let I=typeof v.data=="number"?[v.data]:v.data;if(I.length===0)return;let z=v.type===10?2:4,O,V;v.type===10?(V=I.length>4?16:I.length>2?8:I.length*z,O=I.length>4?16:z*I.length):(V=I.length<=2?I.length*z:16,O=16),m=Math.ceil(m/V)*V,w.push(m);let U=v.type===10?8:4;m+=I.length>4?Math.ceil(I.length/U)*O:I.length*z});let $=16;m=Math.ceil(m/$)*$;let b=new ArrayBuffer(m);l.forEach((v,I)=>{let z=w[I],O=typeof v.data=="number"?[v.data]:v.data;if(v.type===6)new Int32Array(b,z,O.length).set(O);else if(v.type===12)new Uint32Array(b,z,O.length).set(O);else if(v.type===10)new Uint16Array(b,z,O.length).set(O);else if(v.type===1)new Float32Array(b,z,O.length).set(O);else throw new Error(`Unsupported uniform type: ${Pe(v.type)}`)});let x=this.gpuDataManager.create(m,GPUBufferUsage.COPY_DST|GPUBufferUsage.UNIFORM);this.device.queue.writeBuffer(x.buffer,0,b,0,m),this.gpuDataManager.release(x.id),h={offset:0,size:m,buffer:x.buffer}}let f=this.programManager.normalizeDispatchGroupSize(u),g=f[1]===1&&f[2]===1,y=Od(e,t,g),_=this.programManager.getArtifact(y);if(_||(_=this.programManager.build(e,f),this.programManager.setArtifact(y,_),j("info",()=>`[artifact] key: ${y}, programName: ${e.name}`)),l&&_.uniformVariablesInfo){if(l.length!==_.uniformVariablesInfo.length)throw new Error(`Uniform variables count mismatch: expect ${_.uniformVariablesInfo.length}, got ${l.length} in program "${_.programInfo.name}".`);for(let m=0;m<l.length;m++){let w=l[m],$=w.type,b=typeof w.data=="number"?1:w.data.length,[x,v]=_.uniformVariablesInfo[m];if($!==x||b!==v)throw new Error(`Uniform variable ${m} mismatch: expect type ${x} with size ${v}, got type ${$} with size ${b} in program "${_.programInfo.name}".`)}}if(j("info",()=>`[ProgramManager] run "${e.name}" (key=${y}) with ${f[0]}x${f[1]}x${f[2]}`),this.queryType!=="none"||this.sessionStatus==="capturing"){let m={kernelId:this.currentKernelId,programName:_.programInfo.name,inputTensorViews:t,outputTensorViews:p};this.pendingKernels.push(m),this.sessionStatus==="capturing"&&this.capturedPendingKernels.get(this.currentSessionId).push(m)}return this.programManager.run(_,s,c,f,h),xe(e.name),p}upload(e,t){this.gpuDataManager.upload(e,t)}memcpy(e,t){this.gpuDataManager.memcpy(e,t)}async download(e,t){await this.gpuDataManager.download(e,t)}alloc(e){return this.gpuDataManager.create(e).id}free(e){return this.gpuDataManager.release(e)}createKernel(e,t,i,r){let a=Td.get(e);if(!a)throw new Error(`kernel not implemented: ${e}`);let n={kernelType:e,kernelName:r,kernelEntry:a[0],attributes:[a[1],i]};this.kernels.set(t,n)}releaseKernel(e){let t=this.kernelPersistentData.get(e);if(t){for(let i of t)this.gpuDataManager.release(i.id);this.kernelPersistentData.delete(e)}this.kernelCustomData.delete(e),this.kernels.delete(e)}computeKernel(e,t,i){let r=this.kernels.get(e);if(!r)throw new Error(`kernel not created: ${e}`);let a=r.kernelType,n=r.kernelName,s=r.kernelEntry,o=r.attributes;if(this.currentKernelId!==null)throw new Error(`kernel "[${a}] ${n}" is not allowed to be called recursively`);this.currentKernelId=e,o[0]&&(o[1]=o[0](o[1]),o[0]=void 0),j("info",()=>`[WebGPU] Start to run kernel "[${a}] ${n}"...`);let u=this.env.debug;this.temporaryData=[];try{return u&&this.device.pushErrorScope("validation"),s(t,o[1]),0}catch(l){return i.push(Promise.resolve(`[WebGPU] Kernel "[${a}] ${n}" failed. ${l}`)),1}finally{u&&i.push(this.device.popErrorScope().then(l=>l?`GPU validation error for kernel "[${a}] ${n}": ${l.message}`:null));for(let l of this.temporaryData)this.gpuDataManager.release(l.id);this.temporaryData=[],this.currentKernelId=null}}registerBuffer(e,t,i,r){let a=this.sessionExternalDataMapping.get(e);a||(a=new Map,this.sessionExternalDataMapping.set(e,a));let n=a.get(t),s=this.gpuDataManager.registerExternalBuffer(i,r,n);return a.set(t,[s,i]),s}unregisterBuffers(e){let t=this.sessionExternalDataMapping.get(e);t&&(t.forEach(i=>this.gpuDataManager.unregisterExternalBuffer(i[0])),this.sessionExternalDataMapping.delete(e))}getBuffer(e){let t=this.gpuDataManager.get(e);if(!t)throw new Error(`no GPU data for buffer: ${e}`);return t.buffer}createDownloader(e,t,i){return async()=>{let r=await Mi(this,e,t);return Si(r.buffer,i)}}writeTimestamp(e){this.queryType==="inside-passes"&&this.computePassEncoder.writeTimestamp(this.querySet,e)}setQueryType(){this.queryType="none",(this.env.webgpu.profiling?.mode==="default"||(typeof this.env.trace>"u"?this.env.wasm.trace:this.env.trace))&&(this.device.features.has("chromium-experimental-timestamp-query-inside-passes")?this.queryType="inside-passes":this.device.features.has("timestamp-query")&&(this.queryType="at-passes"),this.queryType!=="none"&&typeof this.querySet>"u"&&(this.querySet=this.device.createQuerySet({type:"timestamp",count:this.maxDispatchNumber*2}),this.queryResolveBuffer=this.device.createBuffer({size:this.maxDispatchNumber*2*8,usage:GPUBufferUsage.COPY_SRC|GPUBufferUsage.QUERY_RESOLVE})))}captureBegin(){j("info","captureBegin"),this.capturedCommandList.get(this.currentSessionId)||this.capturedCommandList.set(this.currentSessionId,[]),this.capturedPendingKernels.get(this.currentSessionId)||this.capturedPendingKernels.set(this.currentSessionId,[]),this.flush(),this.sessionStatus="capturing"}captureEnd(){j("info","captureEnd"),this.flush(),this.sessionStatus="default"}replay(){j("info","replay"),this.sessionStatus="replaying";let e=this.capturedCommandList.get(this.currentSessionId),t=this.capturedPendingKernels.get(this.currentSessionId),i=e.length;this.pendingKernels=[];for(let r=0;r<i;r++){let a=this.getComputePassEncoder(),n=e[r];this.writeTimestamp(this.pendingDispatchNumber*2),a.setPipeline(n.computePipeline),a.setBindGroup(0,n.bindGroup),a.dispatchWorkgroups(...n.dispatchGroup),this.writeTimestamp(this.pendingDispatchNumber*2+1),this.pendingDispatchNumber++,this.queryType!=="none"&&this.pendingKernels.push(t[r]),(this.pendingDispatchNumber>=this.maxDispatchNumber||this.queryType==="at-passes")&&this.endComputePass(),this.pendingDispatchNumber>=this.maxDispatchNumber&&this.flush()}this.flush(),this.sessionStatus="default"}onCreateSession(){this.gpuDataManager.onCreateSession()}onReleaseSession(e){this.unregisterBuffers(e),this.capturedCommandList.has(e)&&this.capturedCommandList.delete(e),this.capturedPendingKernels.has(e)&&this.capturedPendingKernels.delete(e),this.gpuDataManager.onReleaseSession(e)}onRunStart(e){this.currentSessionId=e,this.setQueryType()}}}),Rd={};me(Rd,{init:()=>Md});var Zt,Dd,Md,pc=T(()=>{N(),qe(),W(),$p(),Zt=class ip{constructor(t,i,r,a){this.module=t,this.dataType=i,this.data=r,this.dims=a}getFloat32Array(){if(this.dataType!==1)throw new Error("Invalid data type");let t=k.size(this.dims);return t===0?new Float32Array:new Float32Array(this.module.HEAP8.buffer,this.data,t)}getBigInt64Array(){if(this.dataType!==7)throw new Error("Invalid data type");let t=k.size(this.dims);return t===0?new BigInt64Array:new BigInt64Array(this.module.HEAP8.buffer,this.data,t)}getInt32Array(){if(this.dataType!==6)throw new Error("Invalid data type");let t=k.size(this.dims);return t===0?new Int32Array:new Int32Array(this.module.HEAP8.buffer,this.data,t)}getUint16Array(){if(this.dataType!==10&&this.dataType!==4)throw new Error("Invalid data type");let t=k.size(this.dims);return t===0?new Uint16Array:new Uint16Array(this.module.HEAP8.buffer,this.data,t)}reshape(t){if(k.size(t)!==k.size(this.dims))throw new Error("Invalid new shape");return new ip(this.module,this.dataType,this.data,t)}},Dd=class{constructor(e,t,i){this.module=e,this.backend=t,this.customDataOffset=0,this.customDataSize=0,this.adapterInfo=t.adapterInfo;let r=e.PTR_SIZE,a=i/e.PTR_SIZE,n=r===4?"i32":"i64";this.opKernelContext=Number(e.getValue(r*a++,n));let s=Number(e.getValue(r*a++,n));this.outputCount=Number(e.getValue(r*a++,n)),this.customDataOffset=Number(e.getValue(r*a++,"*")),this.customDataSize=Number(e.getValue(r*a++,n));let o=[];for(let u=0;u<s;u++){let l=Number(e.getValue(r*a++,n)),d=Number(e.getValue(r*a++,"*")),p=Number(e.getValue(r*a++,n)),c=[];for(let h=0;h<p;h++)c.push(Number(e.getValue(r*a++,n)));o.push(new Zt(e,l,d,c))}this.inputs=o}get kernelCustomData(){return this.backend.currentKernelCustomData}get customDataBuffer(){return this.module.HEAPU8.subarray(this.customDataOffset,this.customDataOffset+this.customDataSize)}compute(e,t){let i=t?.inputs?.map(s=>typeof s=="number"?this.inputs[s]:s)??this.inputs,r=t?.outputs??[],a=(s,o,u)=>new Zt(this.module,o,this.output(s,u),u),n=(s,o)=>{let u=Ze(s,o);if(!u)throw new Error(`Unsupported data type: ${s}`);let l=u>0?this.backend.gpuDataManager.create(u).id:0;return new Zt(this.module,s,l,o)};return this.backend.run(e,i,r,a,n,this.outputCount)}output(e,t){let i=this.module.stackSave();try{let r=this.module.PTR_SIZE,a=r===4?"i32":"i64",n=this.module.stackAlloc((1+t.length)*r);this.module.setValue(n,t.length,a);for(let s=0;s<t.length;s++)this.module.setValue(n+r*(s+1),t[s],a);return this.module._JsepOutput(this.opKernelContext,e,n)}catch(r){throw new Error(`Failed to generate kernel's output[${e}] with dims [${t}]. If you are running with pre-allocated output, please make sure the output type/dims are correct. Error: ${r}`)}finally{this.module.stackRestore(i)}}},Md=async(e,t,i,r)=>{let a=t.jsepInit;if(!a)throw new Error("Failed to initialize JSEP. The WebAssembly module is not built with JSEP support.");if(e==="webgpu"){let n=(dc(),ce(Ed)).WebGpuBackend,s=new n;await s.initialize(i,r),a("webgpu",[s,o=>s.alloc(Number(o)),o=>s.free(o),(o,u,l,d=!1)=>{if(d)j("verbose",()=>`[WebGPU] jsepCopyGpuToGpu: src=${Number(o)}, dst=${Number(u)}, size=${Number(l)}`),s.memcpy(Number(o),Number(u));else{j("verbose",()=>`[WebGPU] jsepCopyCpuToGpu: dataOffset=${Number(o)}, gpuDataId=${Number(u)}, size=${Number(l)}`);let p=t.HEAPU8.subarray(Number(o>>>0),Number(o>>>0)+Number(l));s.upload(Number(u),p)}},async(o,u,l)=>{j("verbose",()=>`[WebGPU] jsepCopyGpuToCpu: gpuDataId=${o}, dataOffset=${u}, size=${l}`),await s.download(Number(o),()=>t.HEAPU8.subarray(Number(u)>>>0,Number(u+l)>>>0))},(o,u,l)=>s.createKernel(o,Number(u),l,t.UTF8ToString(t._JsepGetNodeName(Number(u)))),o=>s.releaseKernel(o),(o,u,l,d)=>{j("verbose",()=>`[WebGPU] jsepRun: sessionHandle=${l}, kernel=${o}, contextDataOffset=${u}`);let p=new Dd(t,s,Number(u));return s.computeKernel(Number(o),p,d)},()=>s.captureBegin(),()=>s.captureEnd(),()=>s.replay()])}else{let n=new Na(i);a("webnn",[n,()=>n.reserveTensorId(),s=>n.releaseTensorId(s),async(s,o,u,l,d)=>n.ensureTensor(s,o,u,l,d),(s,o)=>{n.uploadTensor(s,o)},async(s,o)=>n.downloadTensor(s,o)])}}}),Ud,Or,Ar,Ge,Pd,Br,Qt,Rr,Dr,Mr,Ur,Pr,qr,qd=T(()=>{gp(),_p(),N(),je(),$i(),ka(),Ud=(e,t)=>{J()._OrtInit(e,t)!==0&&X("Can't initialize onnxruntime.")},Or=async e=>{Ud(e.wasm.numThreads,Mt(e.logLevel))},Ar=async(e,t)=>{J().asyncInit?.();{let i=(pc(),ce(Rd)).init;if(t==="webgpu"){if(typeof navigator>"u"||!navigator.gpu)throw new Error("WebGPU is not supported in current environment");let r=e.webgpu.adapter;if(r){if(typeof r.limits!="object"||typeof r.features!="object"||typeof r.requestDevice!="function")throw new Error("Invalid GPU adapter set in `env.webgpu.adapter`. It must be a GPUAdapter object.")}else{let a=e.webgpu.powerPreference;if(a!==void 0&&a!=="low-power"&&a!=="high-performance")throw new Error(`Invalid powerPreference setting: "${a}"`);let n=e.webgpu.forceFallbackAdapter;if(n!==void 0&&typeof n!="boolean")throw new Error(`Invalid forceFallbackAdapter setting: "${n}"`);if(r=await navigator.gpu.requestAdapter({powerPreference:a,forceFallbackAdapter:n}),!r)throw new Error('Failed to get GPU adapter. You may need to enable flag "--enable-unsafe-webgpu" if you are using Chrome.')}await i("webgpu",J(),e,r)}if(t==="webnn"){if(typeof navigator>"u"||!navigator.ml)throw new Error("WebNN is not supported in current environment");await i("webnn",J(),e)}}},Ge=new Map,Pd=e=>{let t=J(),i=t.stackSave();try{let r=t.PTR_SIZE,a=t.stackAlloc(2*r);t._OrtGetInputOutputCount(e,a,a+r)!==0&&X("Can't get session input/output count.");let n=r===4?"i32":"i64";return[Number(t.getValue(a,n)),Number(t.getValue(a+r,n))]}finally{t.stackRestore(i)}},Br=(e,t)=>{let i=J(),r=i.stackSave(),a=0;try{let n=i.PTR_SIZE,s=i.stackAlloc(2*n);i._OrtGetInputOutputMetadata(e,t,s,s+n)!==0&&X("Can't get session input/output metadata.");let o=Number(i.getValue(s,"*"));a=Number(i.getValue(s+n,"*"));let u=i.HEAP32[a/4];if(u===0)return[o,0];let l=i.HEAPU32[a/4+1],d=[];for(let p=0;p<l;p++){let c=Number(i.getValue(a+8+p*n,"*"));d.push(c!==0?i.UTF8ToString(c):Number(i.getValue(a+8+(p+l)*n,"*")))}return[o,u,d]}finally{i.stackRestore(r),a!==0&&i._OrtFree(a)}},Qt=e=>{let t=J(),i=t._malloc(e.byteLength);if(i===0)throw new Error(`Can't create a session. failed to allocate a buffer of size ${e.byteLength}.`);return t.HEAPU8.set(e,i),[i,e.byteLength]},Rr=async(e,t)=>{let i,r,a=J();Array.isArray(e)?[i,r]=e:e.buffer===a.HEAPU8.buffer?[i,r]=[e.byteOffset,e.byteLength]:[i,r]=Qt(e);let n=0,s=0,o=0,u=[],l=[],d=[];try{if([s,u]=await xa(t),t?.externalData&&a.mountExternalData){let $=[];for(let b of t.externalData){let x=typeof b=="string"?b:b.path;$.push(xi(typeof b=="string"?b:b.data).then(v=>{a.mountExternalData(x,v)}))}await Promise.all($)}for(let $ of t?.executionProviders??[])if((typeof $=="string"?$:$.name)==="webnn"){if(a.shouldTransferToMLTensor=!1,typeof $!="string"){let b=$,x=b?.context,v=b?.gpuDevice,I=b?.deviceType,z=b?.powerPreference;x?a.currentContext=x:v?a.currentContext=await a.webnnCreateMLContext(v):a.currentContext=await a.webnnCreateMLContext({deviceType:I,powerPreference:z})}else a.currentContext=await a.webnnCreateMLContext();break}n=await a._OrtCreateSession(i,r,s),a.webgpuOnCreateSession?.(n),n===0&&X("Can't create a session."),a.jsepOnCreateSession?.(),a.currentContext&&(a.webnnRegisterMLContext(n,a.currentContext),a.currentContext=void 0,a.shouldTransferToMLTensor=!0);let[p,c]=Pd(n),h=!!t?.enableGraphCapture,f=[],g=[],y=[],_=[],m=[];for(let $=0;$<p;$++){let[b,x,v]=Br(n,$);b===0&&X("Can't get an input name."),l.push(b);let I=a.UTF8ToString(b);f.push(I),y.push(x===0?{name:I,isTensor:!1}:{name:I,isTensor:!0,type:Pe(x),shape:v})}for(let $=0;$<c;$++){let[b,x,v]=Br(n,$+p);b===0&&X("Can't get an output name."),d.push(b);let I=a.UTF8ToString(b);g.push(I),_.push(x===0?{name:I,isTensor:!1}:{name:I,isTensor:!0,type:Pe(x),shape:v});{if(h&&t?.preferredOutputLocation===void 0){m.push("gpu-buffer");continue}let z=typeof t?.preferredOutputLocation=="string"?t.preferredOutputLocation:t?.preferredOutputLocation?.[I]??"cpu",O=a.webnnIsGraphOutput;if(z==="cpu"&&O&&O(n,I)){m.push("ml-tensor-cpu-output");continue}if(z!=="cpu"&&z!=="cpu-pinned"&&z!=="gpu-buffer"&&z!=="ml-tensor")throw new Error(`Not supported preferred output location: ${z}.`);if(h&&z!=="gpu-buffer")throw new Error(`Not supported preferred output location: ${z}. Only 'gpu-buffer' location is supported when enableGraphCapture is true.`);m.push(z)}}let w=null;return m.some($=>$==="gpu-buffer"||$==="ml-tensor"||$==="ml-tensor-cpu-output")&&(o=a._OrtCreateBinding(n),o===0&&X("Can't create IO binding."),w={handle:o,outputPreferredLocations:m,outputPreferredLocationsEncoded:m.map($=>$==="ml-tensor-cpu-output"?"ml-tensor":$).map($=>vi($))}),Ge.set(n,[n,l,d,w,h,!1]),[n,f,g,y,_]}catch(p){throw l.forEach(c=>a._OrtFree(c)),d.forEach(c=>a._OrtFree(c)),o!==0&&a._OrtReleaseBinding(o)!==0&&X("Can't release IO binding."),n!==0&&a._OrtReleaseSession(n)!==0&&X("Can't release session."),p}finally{a._free(i),s!==0&&a._OrtReleaseSessionOptions(s)!==0&&X("Can't release session options."),u.forEach(p=>a._free(p)),a.unmountExternalData?.()}},Dr=e=>{let t=J(),i=Ge.get(e);if(!i)throw new Error(`cannot release session. invalid session id: ${e}`);let[r,a,n,s,o]=i;s&&(o&&t._OrtClearBoundOutputs(s.handle)!==0&&X("Can't clear bound outputs."),t._OrtReleaseBinding(s.handle)!==0&&X("Can't release IO binding.")),t.jsepOnReleaseSession?.(e),t.webnnOnReleaseSession?.(e),t.webgpuOnReleaseSession?.(e),a.forEach(u=>t._OrtFree(u)),n.forEach(u=>t._OrtFree(u)),t._OrtReleaseSession(r)!==0&&X("Can't release session."),Ge.delete(e)},Mr=async(e,t,i,r,a,n,s=!1)=>{if(!e){t.push(0);return}let o=J(),u=o.PTR_SIZE,l=e[0],d=e[1],p=e[3],c=p,h,f;if(l==="string"&&(p==="gpu-buffer"||p==="ml-tensor"))throw new Error("String tensor is not supported on GPU.");if(s&&p!=="gpu-buffer")throw new Error(`External buffer must be provided for input/output index ${n} when enableGraphCapture is true.`);if(p==="gpu-buffer"){let _=e[2].gpuBuffer;f=Ze(Ke(l),d);{let m=o.jsepRegisterBuffer;if(!m)throw new Error('Tensor location "gpu-buffer" is not supported without using WebGPU.');h=m(r,n,_,f)}}else if(p==="ml-tensor"){let _=e[2].mlTensor;f=Ze(Ke(l),d);let m=o.webnnRegisterMLTensor;if(!m)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');h=m(r,_,Ke(l),d)}else{let _=e[2];if(Array.isArray(_)){f=u*_.length,h=o._malloc(f),i.push(h);for(let m=0;m<_.length;m++){if(typeof _[m]!="string")throw new TypeError(`tensor data at index ${m} is not a string`);o.setValue(h+m*u,Ee(_[m],i),"*")}}else{let m=o.webnnIsGraphInput,w=o.webnnIsGraphOutput;if(l!=="string"&&m&&w){let $=o.UTF8ToString(a);if(m(r,$)||w(r,$)){let b=Ke(l);f=Ze(b,d),c="ml-tensor";let x=o.webnnCreateTemporaryTensor,v=o.webnnUploadTensor;if(!x||!v)throw new Error('Tensor location "ml-tensor" is not supported without using WebNN.');let I=await x(r,b,d);v(I,new Uint8Array(_.buffer,_.byteOffset,_.byteLength)),h=I}else f=_.byteLength,h=o._malloc(f),i.push(h),o.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,f),h)}else f=_.byteLength,h=o._malloc(f),i.push(h),o.HEAPU8.set(new Uint8Array(_.buffer,_.byteOffset,f),h)}}let g=o.stackSave(),y=o.stackAlloc(4*d.length);try{d.forEach((m,w)=>o.setValue(y+w*u,m,u===4?"i32":"i64"));let _=o._OrtCreateTensor(Ke(l),h,f,y,d.length,vi(c));_===0&&X(`Can't create tensor for input/output. session=${r}, index=${n}.`),t.push(_)}finally{o.stackRestore(g)}},Ur=async(e,t,i,r,a,n)=>{let s=J(),o=s.PTR_SIZE,u=Ge.get(e);if(!u)throw new Error(`cannot run inference. invalid session id: ${e}`);let l=u[0],d=u[1],p=u[2],c=u[3],h=u[4],f=u[5],g=t.length,y=r.length,_=0,m=[],w=[],$=[],b=[],x=s.stackSave(),v=s.stackAlloc(g*o),I=s.stackAlloc(g*o),z=s.stackAlloc(y*o),O=s.stackAlloc(y*o);try{[_,m]=ya(n);for(let A=0;A<g;A++)await Mr(i[A],w,b,e,d[t[A]],t[A],h);for(let A=0;A<y;A++)await Mr(a[A],$,b,e,p[r[A]],g+r[A],h);for(let A=0;A<g;A++)s.setValue(v+A*o,w[A],"*"),s.setValue(I+A*o,d[t[A]],"*");for(let A=0;A<y;A++)s.setValue(z+A*o,$[A],"*"),s.setValue(O+A*o,p[r[A]],"*");if(c&&!f){let{handle:A,outputPreferredLocations:F,outputPreferredLocationsEncoded:q}=c;if(d.length!==g)throw new Error(`input count from feeds (${g}) is expected to be always equal to model's input count (${d.length}).`);for(let D=0;D<g;D++){let Z=t[D];await s._OrtBindInput(A,d[Z],w[D])!==0&&X(`Can't bind input[${D}] for session=${e}.`)}for(let D=0;D<y;D++){let Z=r[D];a[D]?.[3]?s._OrtBindOutput(A,p[Z],$[D],0)!==0&&X(`Can't bind pre-allocated output[${D}] for session=${e}.`):s._OrtBindOutput(A,p[Z],0,q[Z])!==0&&X(`Can't bind output[${D}] to ${F[D]} for session=${e}.`)}Ge.set(e,[l,d,p,c,h,!0])}s.jsepOnRunStart?.(l),s.webnnOnRunStart?.(l);let V;c?V=await s._OrtRunWithBinding(l,c.handle,y,z,_):V=await s._OrtRun(l,I,v,g,O,y,z,_),V!==0&&X("failed to call OrtRun().");let U=[],L=[];for(let A=0;A<y;A++){let F=Number(s.getValue(z+A*o,"*"));if(F===$[A]){U.push(a[A]);continue}let q=s.stackSave(),D=s.stackAlloc(4*o),Z=!1,P,te=0;try{s._OrtGetTensorData(F,D,D+o,D+2*o,D+3*o)!==0&&X(`Can't access output tensor data on index ${A}.`);let E=o===4?"i32":"i64",C=Number(s.getValue(D,E));te=s.getValue(D+o,"*");let H=s.getValue(D+o*2,"*"),Y=Number(s.getValue(D+o*3,E)),ue=[];for(let le=0;le<Y;le++)ue.push(Number(s.getValue(H+le*o,E)));s._OrtFree(H)!==0&&X("Can't free memory for tensor dims.");let Ue=ue.reduce((le,ae)=>le*ae,1);P=Pe(C);let It=c?.outputPreferredLocations[r[A]];if(P==="string"){if(It==="gpu-buffer"||It==="ml-tensor")throw new Error("String tensor is not supported on GPU.");let le=[];for(let ae=0;ae<Ue;ae++){let Ve=s.getValue(te+ae*o,"*"),gc=s.getValue(te+(ae+1)*o,"*"),_c=ae===Ue-1?void 0:gc-Ve;le.push(s.UTF8ToString(Ve,_c))}U.push([P,ue,le,"cpu"])}else if(It==="gpu-buffer"&&Ue>0){let le=s.jsepGetBuffer;if(!le)throw new Error('preferredLocation "gpu-buffer" is not supported without using WebGPU.');let ae=le(te),Ve=Ze(C,Ue);if(Ve===void 0||!wi(P))throw new Error(`Unsupported data type: ${P}`);Z=!0,U.push([P,ue,{gpuBuffer:ae,download:s.jsepCreateDownloader(ae,Ve,P),dispose:()=>{s._OrtReleaseTensor(F)!==0&&X("Can't release tensor.")}},"gpu-buffer"])}else if(It==="ml-tensor"&&Ue>0){let le=s.webnnEnsureTensor,ae=s.webnnIsGraphInputOutputTypeSupported;if(!le||!ae)throw new Error('preferredLocation "ml-tensor" is not supported without using WebNN.');if(Ze(C,Ue)===void 0||!bi(P))throw new Error(`Unsupported data type: ${P}`);if(!ae(e,P,!1))throw new Error(`preferredLocation "ml-tensor" for ${P} output is not supported by current WebNN Context.`);let Ve=await le(e,te,C,ue,!1);Z=!0,U.push([P,ue,{mlTensor:Ve,download:s.webnnCreateMLTensorDownloader(te,P),dispose:()=>{s.webnnReleaseTensorId(te),s._OrtReleaseTensor(F)}},"ml-tensor"])}else if(It==="ml-tensor-cpu-output"&&Ue>0){let le=s.webnnCreateMLTensorDownloader(te,P)(),ae=U.length;Z=!0,L.push((async()=>{let Ve=[ae,await le];return s.webnnReleaseTensorId(te),s._OrtReleaseTensor(F),Ve})()),U.push([P,ue,[],"cpu"])}else{let le=Dt(P),ae=new le(Ue);new Uint8Array(ae.buffer,ae.byteOffset,ae.byteLength).set(s.HEAPU8.subarray(te,te+ae.byteLength)),U.push([P,ue,ae,"cpu"])}}finally{s.stackRestore(q),P==="string"&&te&&s._free(te),Z||s._OrtReleaseTensor(F)}}c&&!h&&(s._OrtClearBoundOutputs(c.handle)!==0&&X("Can't clear bound outputs."),Ge.set(e,[l,d,p,c,h,!1]));for(let[A,F]of await Promise.all(L))U[A][2]=F;return U}finally{s.webnnOnRunEnd?.(l),s.stackRestore(x),w.forEach(V=>s._OrtReleaseTensor(V)),$.forEach(V=>s._OrtReleaseTensor(V)),b.forEach(V=>s._free(V)),_!==0&&s._OrtReleaseRunOptions(_),m.forEach(V=>s._free(V))}},Pr=e=>{let t=J(),i=Ge.get(e);if(!i)throw new Error("invalid session id");let r=i[0],a=t._OrtEndProfiling(r);a===0&&X("Can't get an profile file name."),t._OrtFree(a)},qr=e=>{let t=[];for(let i of e){let r=i[2];!Array.isArray(r)&&"buffer"in r&&t.push(r.buffer)}return t}}),He,ke,ut,kt,St,Xt,Nr,Yt,it,rt,Nd,Vd,Ld,Wd,Gd,Hd,Fd,jd,Kd=T(()=>{ze(),qd(),je(),mi(),He=()=>!!ee.wasm.proxy&&typeof document<"u",ut=!1,kt=!1,St=!1,Yt=new Map,it=(e,t)=>{let i=Yt.get(e);i?i.push(t):Yt.set(e,[t])},rt=()=>{if(ut||!kt||St||!ke)throw new Error("worker not ready")},Nd=e=>{switch(e.data.type){case"init-wasm":ut=!1,e.data.err?(St=!0,Nr[1](e.data.err)):(kt=!0,Nr[0]()),Xt&&(URL.revokeObjectURL(Xt),Xt=void 0);break;case"init-ep":case"copy-from":case"create":case"release":case"run":case"end-profiling":{let t=Yt.get(e.data.type);e.data.err?t.shift()[1](e.data.err):t.shift()[0](e.data.out);break}}},Vd=async()=>{if(!kt){if(ut)throw new Error("multiple calls to 'initWasm()' detected.");if(St)throw new Error("previous call to 'initWasm()' failed.");if(ut=!0,He())return new Promise((e,t)=>{ke?.terminate(),ha().then(([i,r])=>{try{ke=r,ke.onerror=n=>t(n),ke.onmessage=Nd,Nr=[e,t];let a={type:"init-wasm",in:ee};if(!a.in.wasm.wasmPaths&&i){let n=pi();n&&(a.in.wasm.wasmPaths=n)}ke.postMessage(a),Xt=i}catch(a){t(a)}},t)});try{await yi(ee.wasm),await Or(ee),kt=!0}catch(e){throw St=!0,e}finally{ut=!1}}},Ld=async e=>{if(He())return rt(),new Promise((t,i)=>{it("init-ep",[t,i]);let r={type:"init-ep",in:{epName:e,env:ee}};ke.postMessage(r)});await Ar(ee,e)},Wd=async e=>He()?(rt(),new Promise((t,i)=>{it("copy-from",[t,i]);let r={type:"copy-from",in:{buffer:e}};ke.postMessage(r,[e.buffer])})):Qt(e),Gd=async(e,t)=>{if(He()){if(t?.preferredOutputLocation)throw new Error('session option "preferredOutputLocation" is not supported for proxy.');return rt(),new Promise((i,r)=>{it("create",[i,r]);let a={type:"create",in:{model:e,options:{...t}}},n=[];e instanceof Uint8Array&&n.push(e.buffer),ke.postMessage(a,n)})}else return Rr(e,t)},Hd=async e=>{if(He())return rt(),new Promise((t,i)=>{it("release",[t,i]);let r={type:"release",in:e};ke.postMessage(r)});Dr(e)},Fd=async(e,t,i,r,a,n)=>{if(He()){if(i.some(s=>s[3]!=="cpu"))throw new Error("input tensor on GPU is not supported for proxy.");if(a.some(s=>s))throw new Error("pre-allocated output tensor is not supported for proxy.");return rt(),new Promise((s,o)=>{it("run",[s,o]);let u=i,l={type:"run",in:{sessionId:e,inputIndices:t,inputs:u,outputIndices:r,options:n}};ke.postMessage(l,qr(u))})}else return Ur(e,t,i,r,a,n)},jd=async e=>{if(He())return rt(),new Promise((t,i)=>{it("end-profiling",[t,i]);let r={type:"end-profiling",in:e};ke.postMessage(r)});Pr(e)}}),Vr,Zd,Qd,cc=T(()=>{ze(),Kd(),N(),ui(),ka(),Vr=(e,t)=>{switch(e.location){case"cpu":return[e.type,e.dims,e.data,"cpu"];case"gpu-buffer":return[e.type,e.dims,{gpuBuffer:e.gpuBuffer},"gpu-buffer"];case"ml-tensor":return[e.type,e.dims,{mlTensor:e.mlTensor},"ml-tensor"];default:throw new Error(`invalid data location: ${e.location} for ${t()}`)}},Zd=e=>{switch(e[3]){case"cpu":return new Ie(e[0],e[2],e[1]);case"gpu-buffer":{let t=e[0];if(!wi(t))throw new Error(`not supported data type: ${t} for deserializing GPU tensor`);let{gpuBuffer:i,download:r,dispose:a}=e[2];return Ie.fromGpuBuffer(i,{dataType:t,dims:e[1],download:r,dispose:a})}case"ml-tensor":{let t=e[0];if(!bi(t))throw new Error(`not supported data type: ${t} for deserializing MLTensor tensor`);let{mlTensor:i,download:r,dispose:a}=e[2];return Ie.fromMLTensor(i,{dataType:t,dims:e[1],download:r,dispose:a})}default:throw new Error(`invalid data location: ${e[3]}`)}},Qd=class{async fetchModelAndCopyToWasmMemory(e){return Wd(await xi(e))}async loadModel(e,t){Te();let i;typeof e=="string"?i=await this.fetchModelAndCopyToWasmMemory(e):i=e,[this.sessionId,this.inputNames,this.outputNames,this.inputMetadata,this.outputMetadata]=await Gd(i,t),xe()}async dispose(){return Hd(this.sessionId)}async run(e,t,i){Te();let r=[],a=[];Object.entries(e).forEach(p=>{let c=p[0],h=p[1],f=this.inputNames.indexOf(c);if(f===-1)throw new Error(`invalid input '${c}'`);r.push(h),a.push(f)});let n=[],s=[];Object.entries(t).forEach(p=>{let c=p[0],h=p[1],f=this.outputNames.indexOf(c);if(f===-1)throw new Error(`invalid output '${c}'`);n.push(h),s.push(f)});let o=r.map((p,c)=>Vr(p,()=>`input "${this.inputNames[a[c]]}"`)),u=n.map((p,c)=>p?Vr(p,()=>`output "${this.outputNames[s[c]]}"`):null),l=await Fd(this.sessionId,a,o,s,u,i),d={};for(let p=0;p<l.length;p++)d[this.outputNames[s[p]]]=n[p]??Zd(l[p]);return xe(),d}startProfiling(){}endProfiling(){jd(this.sessionId)}}}),Xd={};me(Xd,{OnnxruntimeWebAssemblyBackend:()=>Wr,initializeFlags:()=>Lr,wasmBackend:()=>Yd});var Lr,Wr,Yd,hc=T(()=>{ze(),Kd(),cc(),Lr=()=>{(typeof ee.wasm.initTimeout!="number"||ee.wasm.initTimeout<0)&&(ee.wasm.initTimeout=0);let e=ee.wasm.simd;if(typeof e!="boolean"&&e!==void 0&&e!=="fixed"&&e!=="relaxed"&&(console.warn(`Property "env.wasm.simd" is set to unknown value "${e}". Reset it to \`false\` and ignore SIMD feature checking.`),ee.wasm.simd=!1),typeof ee.wasm.proxy!="boolean"&&(ee.wasm.proxy=!1),typeof ee.wasm.trace!="boolean"&&(ee.wasm.trace=!1),typeof ee.wasm.numThreads!="number"||!Number.isInteger(ee.wasm.numThreads)||ee.wasm.numThreads<=0)if(typeof self<"u"&&!self.crossOriginIsolated)ee.wasm.numThreads=1;else{let t=typeof navigator>"u"?fe("node:os").cpus().length:navigator.hardwareConcurrency;ee.wasm.numThreads=Math.min(4,Math.ceil((t||1)/2))}},Wr=class{async init(e){Lr(),await Vd(),await Ld(e)}async createInferenceSessionHandler(e,t){let i=new Qd;return await i.loadModel(e,t),i}},Yd=new Wr}),Jd={};me(Jd,{InferenceSession:()=>oi,TRACE:()=>pt,TRACE_FUNC_BEGIN:()=>Te,TRACE_FUNC_END:()=>xe,Tensor:()=>Ie,default:()=>mc,env:()=>ee,registerBackend:()=>ve}),ze(),ze(),ze();var fc="1.22.0",mc=na;{let e=(hc(),ce(Xd)).wasmBackend;ve("webgpu",e,5),ve("webnn",e,5),ve("cpu",e,10),ve("wasm",e,10)}return Object.defineProperty(ee.versions,"web",{value:fc,enumerable:!0}),ce(Jd)})();/**
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
 */typeof rp=="object"&&typeof Gr=="object"&&(Gr.exports=ei);console.log("wow3");ei.env.wasm.numThreads=4;self.onmessage=async be=>{const{type:ne,userImageBuffer:pe,topoImageBuffer:De}=be.data;if(ne==="createSession"){console.log("createSession in worker");try{const fe=performance.now(),T=await ei.InferenceSession.create("../../superpoint_lightglue_pipeline.ort.onnx"),me=performance.now();self.session=T,self.postMessage({type:"sessionCreated",data:{sessionTime:me-fe}})}catch(fe){self.postMessage({type:"error",data:{message:fe.message}})}}if(ne==="runInference"){if(!self.session){self.postMessage({type:"error",data:{message:"Session is not initialized."}});return}try{if(!pe||!De){console.log("wwwww"),self.postMessage({type:"error",data:{message:"Both user and topo images must be provided."}});return}const fe=new Blob([pe]),T=await createImageBitmap(fe),me=new Blob([De]),at=await createImageBitmap(me),ce=[T,at],Se=256,ge=256,ve=ce.map((lt,_e)=>wc(lt,Se,ge,_e)),zt=new Float32Array([...ve[0],...ve[1]]),Et={images:new ei.Tensor("float32",zt,[2,1,ge,Se])},ii=performance.now(),Ct=await self.session.run(Et),ri=performance.now();self.postMessage({type:"inferenceComplete",data:{inferenceTime:ri-ii,results:Ct,images:ce,imgWidth:Se,imgHeight:ge}})}catch(fe){self.postMessage({type:"error",data:{message:fe.message}})}}};function wc(be,ne,pe,De){const T=new OffscreenCanvas(ne,pe).getContext("2d");T.drawImage(be,0,0,ne,pe);const me=T.getImageData(0,0,ne,pe).data,at=new Float32Array(ne*pe);for(let ce=0;ce<ne*pe;ce++){const Se=me[ce*4]/255,ge=me[ce*4+1]/255,ve=me[ce*4+2]/255;at[ce]=.299*Se+.587*ge+.114*ve}return at}});export default bc();
