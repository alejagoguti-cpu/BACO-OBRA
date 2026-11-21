var aa=Object.defineProperty;var ia=(e,o,t)=>o in e?aa(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var V=(e,o,t)=>ia(e,typeof o!="symbol"?o+"":o,t);import{C as x,a as wt,T as Xt,M as $,b as ze,d as ct,H as Oo,P as Qt,e as Xe,L as Do,U as _,V as he,f as Qe,h as tt,i as It,j as _t,k as kt,l as na,S as be,I as Bo,m as sa,n as U,o as ra,p as Mt,R as la,q as ft,r as ht,A as Ee,s as vo,t as ca,u as da,v as ua,w as mt,x as yo,y as $t,G as fa,B as ha,J as Uo,z as ma,D as pa,E as ga,F as va,K as ya,N as ba,O as xa,Q as Bt,W as wa}from"./cesium-Bp63Zc9F.js";const Ut="/BACO-OBRA/",Ca=Ut.endsWith("/")?Ut:Ut+"/",ka=Ca+"cesium/";window.CESIUM_BASE_URL=ka;const At={longitude:-74.04145021,latitude:4.70207636,height:2572},Vt={hotel:{name:"Hotel La Fontana",e:-236,n:330,u:18},unicentro:{name:"Unicentro",e:10,n:0,u:14}},Ma={general:{place:"hotel",range:1250,pitch:-.52,heading:.55},aerial:{place:"hotel",range:420,pitch:-.62,heading:2.35},arch:{place:"hotel",range:210,pitch:-.2,heading:3.35}},Ve={secciones:"secciones/",googleTiles:"",ionToken:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6InpqazdNNTMycTI4aVVpV1UiLCJqdGkiOiJmNjYwOTgwYS02OTFjLTQ0NzEtODZjYS0xNjM0OTk3ODE5YTYiLCJpZCI6NTE4MTQ4LCJzdWIiOiJhbGVqYW5kcmFnb21lemciLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoiVW50aXRsZWQiLCJpYXQiOjE3OTUxMzc4NjR9.0nysUQdrzpmCv5RLHMTp1ad7rY2Ps8goLgDkKuctMtM",imageryAssetId:2},Ta=e=>e<.5?4*e*e*e:1-Math.pow(-2*e+2,3)/2,bo=-1.5533,xo=-.012,Sa=4200,Ea=6,wo=1.7;class za{constructor(o){V(this,"viewer");V(this,"canvas");V(this,"pivot",new x);V(this,"heading",.5);V(this,"pitch",-.6);V(this,"range",1200);V(this,"targetPivot",new x);V(this,"targetHeading",.5);V(this,"targetPitch",-.6);V(this,"targetRange",1200);V(this,"damping",9);V(this,"drag",null);V(this,"pointers",new Map);V(this,"pinch",null);V(this,"lastTap",0);V(this,"keys",new Set);V(this,"tween",null);V(this,"fov",wt.toRadians(48));V(this,"walking",!1);V(this,"eye",new x);V(this,"eyeTarget",new x);V(this,"wHeading",0);V(this,"wPitch",0);V(this,"wHeadingT",0);V(this,"wPitchT",0);V(this,"active",!0);V(this,"onPick",null);V(this,"onModeChange",null);V(this,"groundHeight",null);this.viewer=o,this.canvas=o.scene.canvas,o.scene.screenSpaceCameraController.enableInputs=!1,this.bind()}get isWalking(){return this.walking}get state(){return{heading:this.targetHeading,pitch:this.targetPitch,range:this.targetRange,pivot:x.clone(this.targetPivot)}}setPivot(o,t=!0){if(t){const a=x.clone(this.viewer.camera.positionWC),n=x.subtract(a,o,new x),s=x.magnitude(n),c=Xt.eastNorthUpToFixedFrame(o),h=$.inverseTransformation(c,new $),d=$.multiplyByPointAsVector(h,n,new x);if(s>1){const u=-Math.asin(Math.max(-1,Math.min(1,d.z/s)));if(u<xo&&u>bo){let m=Math.atan2(-d.x,-d.y);for(;m-this.heading>Math.PI;)m-=Math.PI*2;for(;m-this.heading<-Math.PI;)m+=Math.PI*2;this.heading=this.targetHeading=m,this.pitch=this.targetPitch=u,this.range=this.targetRange=this.clamp(s),x.clone(o,this.pivot)}}}this.targetPivot=x.clone(o),this.tween=null}bind(){const o=this.canvas;o.style.touchAction="none",o.addEventListener("pointerdown",a=>{if(this.active){if(o.setPointerCapture(a.pointerId),this.pointers.set(a.pointerId,{x:a.offsetX,y:a.offsetY}),this.pointers.size===2){const[n,s]=[...this.pointers.values()];this.pinch={distance:Math.hypot(n.x-s.x,n.y-s.y),range:this.targetRange,cx:(n.x+s.x)/2,cy:(n.y+s.y)/2},this.drag=null;return}a.button===2||a.button===1||a.shiftKey?this.drag={id:a.pointerId,x:a.offsetX,y:a.offsetY,mode:"pan",moved:!1}:a.button===0&&(this.drag={id:a.pointerId,x:a.offsetX,y:a.offsetY,mode:"orbit",moved:!1}),this.tween=null}}),o.addEventListener("pointermove",a=>{if(!this.active||!this.pointers.has(a.pointerId))return;if(this.pointers.set(a.pointerId,{x:a.offsetX,y:a.offsetY}),this.pointers.size===2&&this.pinch){const[c,h]=[...this.pointers.values()],d=Math.hypot(c.x-h.x,c.y-h.y),u=(c.x+h.x)/2,m=(c.y+h.y)/2;this.walking?this.walk((this.pinch.cy-m)*.06,0):(d>0&&this.pinch.distance>0&&(this.targetRange=this.clamp(this.pinch.range*this.pinch.distance/d)),this.pan(this.pinch.cx-u,m-this.pinch.cy)),this.pinch.cx=u,this.pinch.cy=m;return}if(!this.drag||a.pointerId!==this.drag.id)return;const n=a.offsetX-this.drag.x,s=a.offsetY-this.drag.y;this.drag.x=a.offsetX,this.drag.y=a.offsetY,Math.abs(n)+Math.abs(s)>1.5&&(this.drag.moved=!0),this.tween=null,this.walking?this.drag.mode==="orbit"?(this.wHeadingT-=n*.0032,this.wPitchT=Math.max(-1.2,Math.min(1.2,this.wPitchT+s*.0028))):this.walk(s*.05,-n*.05):this.drag.mode==="orbit"?(this.targetHeading-=n*.0042,this.targetPitch=this.clampPitch(this.targetPitch-s*.0034)):this.pan(-n,s)});const t=a=>{if(this.pointers.delete(a.pointerId),this.pointers.size<2&&(this.pinch=null),this.drag&&a.pointerId===this.drag.id){const n=!this.drag.moved&&this.drag.mode==="orbit";if(this.drag=null,n&&a.type==="pointerup"){const s=new ze(a.offsetX,a.offsetY),c=performance.now();if(a.pointerType!=="mouse"&&c-this.lastTap<320){this.lastTap=0,this.focusAt(s);return}this.lastTap=c;const h=this.pickWorld(s);h&&!this.walking&&this.setPivot(h,!0),this.onPick?.(h)}}};o.addEventListener("pointerup",t),o.addEventListener("pointercancel",t),o.addEventListener("contextmenu",a=>a.preventDefault()),o.addEventListener("wheel",a=>{if(!this.active)return;a.preventDefault(),this.tween=null;const n=a.deltaMode===1?16:a.deltaMode===2?100:1,s=a.deltaY*n;if(this.walking){this.walk(-s*.02,0);return}const c=Math.exp(Math.max(-.45,Math.min(.45,s*.0016))),h=this.pickWorld(new ze(a.offsetX,a.offsetY)),d=this.clamp(this.targetRange*c);if(h&&c<1){const u=Math.min(.45,(this.targetRange-d)/this.targetRange)*.8,m=x.subtract(h,this.targetPivot,new x),w=x.magnitude(m);if(w>1){const C=Math.min(w,this.targetRange)*u/w;x.add(this.targetPivot,x.multiplyByScalar(m,C,m),this.targetPivot)}}this.targetRange=d},{passive:!1}),o.addEventListener("dblclick",a=>{this.active&&(a.preventDefault(),this.focusAt(new ze(a.offsetX,a.offsetY)))}),addEventListener("keydown",a=>{a.target instanceof HTMLInputElement||(this.keys.add(a.code),["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","PageUp","PageDown"].includes(a.code)&&a.preventDefault())}),addEventListener("keyup",a=>this.keys.delete(a.code)),addEventListener("blur",()=>this.keys.clear())}clamp(o,t=Ea,a=Sa){return Math.max(t,Math.min(a,o))}clampPitch(o){return Math.max(bo,Math.min(xo,o))}moveHorizontal(o,t,a,n){const s=Xt.eastNorthUpToFixedFrame(o),c=new x(Math.sin(t)*a+Math.cos(t)*n,Math.cos(t)*a-Math.sin(t)*n,0);$.multiplyByPoint(s,c,o)}pan(o,t){const a=this.canvas.clientHeight||1,n=2*this.range*Math.tan(this.fov/2)/a,s=Math.max(.35,Math.sin(-this.pitch));this.moveHorizontal(this.targetPivot,this.heading,t*n/s,o*n),this.tween=null}walk(o,t){this.moveHorizontal(this.eyeTarget,this.wHeading,o,t),this.snapEye()}snapEye(){const o=ct.fromCartesian(this.eyeTarget),t=this.groundHeight?.(o);t!==void 0&&Number.isFinite(t)&&(o.height=t+wo,ct.toCartesian(o,void 0,this.eyeTarget))}pickWorld(o){const t=this.viewer.scene;let a;if(t.pickPositionSupported&&t.pick(o,4,4)&&(a=t.pickPosition(o)),!a){const n=t.camera.getPickRay(o);n&&(a=t.globe.pick(n,t)??void 0)}return a??null}focusAt(o){const t=this.pickWorld(o);if(t){if(this.walking){x.clone(t,this.eyeTarget),this.snapEye();return}this.flyTo({pivot:t,heading:this.targetHeading,pitch:Math.min(this.targetPitch,-.3),range:this.clamp(Math.max(70,this.targetRange*.42),50,420)},1.6)}}flyTo(o,t=2){this.walking&&this.exitWalk(!1);const a={pivot:o.pivot??x.clone(this.targetPivot),heading:o.heading??this.targetHeading,pitch:o.pitch??this.targetPitch,range:o.range??this.targetRange};let n=a.heading;for(;n-this.targetHeading>Math.PI;)n-=Math.PI*2;for(;n-this.targetHeading<-Math.PI;)n+=Math.PI*2;if(a.heading=n,t<=.02){this.tween=null,this.targetPivot=x.clone(a.pivot),this.pivot=x.clone(a.pivot),this.heading=this.targetHeading=a.heading,this.pitch=this.targetPitch=a.pitch,this.range=this.targetRange=a.range;return}this.tween={from:{pivot:x.clone(this.targetPivot),heading:this.targetHeading,pitch:this.targetPitch,range:this.targetRange},to:a,start:performance.now(),duration:t*1e3}}enterWalk(o){x.clone(o??this.targetPivot,this.eyeTarget),this.snapEye(),x.clone(this.viewer.camera.positionWC,this.eye),this.wHeading=this.wHeadingT=this.heading,this.wPitch=this.pitch,this.wPitchT=0,this.walking=!0,this.tween=null,this.onModeChange?.(!0)}exitWalk(o=!0){if(!this.walking)return;this.walking=!1;const t=ct.fromCartesian(this.eyeTarget);t.height-=wo-1;const a=ct.toCartesian(t);this.pivot=x.clone(a),this.targetPivot=a,this.heading=this.targetHeading=this.wHeading,this.pitch=-.05,this.range=8,o?this.onModeChange?.(!1):this.onModeChange?.(!1)}updateKeys(o){if(!this.keys.size)return;const t=this.keys,a=t.has("ShiftLeft")||t.has("ShiftRight")?3:1;let n=0,s=0;(t.has("KeyW")||t.has("ArrowUp"))&&(n+=1),(t.has("KeyS")||t.has("ArrowDown"))&&(n-=1),(t.has("KeyD")||t.has("ArrowRight"))&&(s+=1),(t.has("KeyA")||t.has("ArrowLeft"))&&(s-=1);let c=0;if(t.has("KeyQ")&&(c+=1),t.has("KeyE")&&(c-=1),this.walking){c&&(this.wHeadingT-=c*1.2*o),(n||s)&&this.walk(n*4.2*a*o,s*3.4*a*o);return}if(c&&(this.targetHeading+=c*.9*o,this.tween=null),(t.has("PageUp")||t.has("Equal")||t.has("NumpadAdd"))&&(this.targetRange=this.clamp(this.targetRange*(1-.9*o))),(t.has("PageDown")||t.has("Minus")||t.has("NumpadSubtract"))&&(this.targetRange=this.clamp(this.targetRange*(1+.9*o))),t.has("KeyR")&&(this.targetPitch=this.clampPitch(this.targetPitch-.7*o)),t.has("KeyF")&&(this.targetPitch=this.clampPitch(this.targetPitch+.7*o)),!n&&!s)return;const h=Math.max(8,this.range*.6)*a*o;this.moveHorizontal(this.targetPivot,this.heading,n*h,s*h),this.tween=null}update(o){if(!this.active)return;this.updateKeys(o);const t=1-Math.exp(-this.damping*o);if(this.walking){x.lerp(this.eye,this.eyeTarget,1-Math.exp(-5*o),this.eye),this.wHeading+=(this.wHeadingT-this.wHeading)*t,this.wPitch+=(this.wPitchT-this.wPitch)*t,this.viewer.camera.setView({destination:this.eye,orientation:{heading:this.wHeading,pitch:this.wPitch,roll:0}});return}if(this.tween){const a=Math.min(1,(performance.now()-this.tween.start)/this.tween.duration),n=Ta(a),{from:s,to:c}=this.tween;x.lerp(s.pivot,c.pivot,n,this.targetPivot),this.targetHeading=s.heading+(c.heading-s.heading)*n,this.targetPitch=s.pitch+(c.pitch-s.pitch)*n,this.targetRange=Math.exp(Math.log(s.range)+(Math.log(c.range)-Math.log(s.range))*n),a>=1&&(this.tween=null)}this.heading+=(this.targetHeading-this.heading)*t,this.pitch+=(this.targetPitch-this.pitch)*t,this.range=Math.exp(Math.log(this.range)+(Math.log(this.targetRange)-Math.log(this.range))*t),x.lerp(this.pivot,this.targetPivot,t,this.pivot),this.viewer.camera.lookAt(this.pivot,new Oo(this.heading,this.pitch,this.range)),this.viewer.camera.lookAtTransform($.IDENTITY)}}function Aa(){return new tt({typedArray:new Uint8Array([128,128,128,255]),width:1,height:1})}const Vo=()=>({uAerial:{type:_.SAMPLER_2D,value:Aa()},uAerialRect:{type:_.VEC4,value:new Qe(-1e3,-1e3,1e3,1e3)},uAerialOn:{type:_.FLOAT,value:0}}),jo=`
  vec3 hlfAerial(vec2 en) {
    vec2 uv = (en - uAerialRect.xy) / (uAerialRect.zw - uAerialRect.xy);
    return czm_srgbToLinear(texture(uAerial, clamp(uv, 0.001, 0.999)).rgb);
  }
`,Ct=`
  vec3 hlfHazeColor(float night, float tarde) {
    vec3 day = vec3(0.66, 0.75, 0.86);
    // tarde bogotana: bruma andina limpia, ligeramente fría en la distancia
    vec3 sunset = vec3(0.66, 0.69, 0.76);
    vec3 nite = vec3(0.03, 0.05, 0.10);
    return mix(mix(day, sunset, tarde), nite, night);
  }
  float hlfHaze(float d, float startD, float amt) {
    return (1.0 - exp(-max(0.0, d - startD) * 0.00015)) * amt;
  }
  // Luz indirecta hemisférica (estilo Lumen SkyLight): cielo frío arriba, rebote cálido abajo
  vec3 hlfSkyFill(vec3 nEC, vec3 upEC, float night, float tarde) {
    float hemi = dot(normalize(nEC), normalize(upEC)) * 0.5 + 0.5;
    vec3 groundDay = vec3(0.46, 0.41, 0.36);
    vec3 skyDay = vec3(0.56, 0.74, 0.98);
    // en la tarde de Bogotá las sombras conservan el azul frío del cielo de montaña
    vec3 groundSunset = vec3(0.44, 0.40, 0.38);
    vec3 skySunset = vec3(0.54, 0.68, 0.90);
    vec3 dayFill = mix(mix(groundDay, skyDay, hemi), mix(groundSunset, skySunset, hemi), tarde);
    vec3 nightFill = mix(vec3(0.04, 0.05, 0.09), vec3(0.08, 0.12, 0.22), hemi);
    return mix(dayFill, nightFill, night);
  }
`;function Pa(){return new Xe({uniforms:{uNight:{type:_.FLOAT,value:0},uTarde:{type:_.FLOAT,value:0},uSkyFill:{type:_.FLOAT,value:.24},uHazeAmount:{type:_.FLOAT,value:.08},uHazeStart:{type:_.FLOAT,value:1200},uHotelPisos:{type:_.FLOAT,value:99},uRevitBox:{type:_.VEC4,value:new Qe(0,0,0,0)},uLean:{type:_.VEC2,value:new ze(0,0)},...Vo()},varyings:{vPosM:he.VEC3,vUpEC:he.VEC3},vertexShaderText:`
      void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        vPosM = vsInput.attributes.positionMC;
        vUpEC = normalize((czm_modelView * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
      }
    `,fragmentShaderText:Ct+jo+`
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float box(vec2 f, vec2 lo, vec2 hi, vec2 aa) {
        vec2 a = smoothstep(lo - aa, lo + aa, f);
        vec2 b = 1.0 - smoothstep(hi - aa, hi + aa, f);
        return a.x * a.y * b.x * b.y;
      }

      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec4 vc = fsInput.attributes.color_0;
        vec2 uv = fsInput.attributes.texCoord_0;
        float rnd = vc.r;
        float rnd2 = vc.a;
        float pisos = max(1.0, floor(vc.g * 32.0 + 0.5));
        float tipo = vc.b;
        float dist = length(fsInput.attributes.positionEC);
        float near = 1.0 - smoothstep(120.0, 420.0, dist);     // 1 cerca, 0 lejos

        vec3 col;
        float rough = 0.88;
        vec3 spec = vec3(0.04);
        vec3 emis = vec3(0.0);
        float occ = 1.0;

        // hotel en construcción: cubiertas y aleros solo cuando ya subieron todos los pisos
        if (uHotelPisos < 98.0 && tipo > 0.3 && tipo < 0.95) discard;
        if (uRevitBox.z > uRevitBox.x && tipo > 0.06 && tipo < 0.95) {
          vec2 enR = vec2(vPosM.x, -vPosM.z);
          if (enR.x > uRevitBox.x && enR.x < uRevitBox.z && enR.y > uRevitBox.y && enR.y < uRevitBox.w) discard;
        }

        if (tipo > 0.9) {
          /* ---------- cubierta plana: gris claro, como la losa real vista desde el aire ---------- */
          vec3 losa = mix(vec3(0.66, 0.64, 0.59), vec3(0.78, 0.76, 0.71), rnd2);
          vec3 manto = mix(vec3(0.56, 0.55, 0.52), vec3(0.66, 0.64, 0.60), rnd);
          vec3 barro = mix(vec3(0.62, 0.42, 0.33), vec3(0.70, 0.49, 0.38), rnd2);
          col = mix(losa, manto, step(0.62, fract(rnd * 7.31)));
          float esTeja = step(pisos, 2.5) * step(0.55, fract(rnd * 3.17));
          col = mix(col, barro, esTeja);
          col *= 0.90 + 0.16 * vnoise(uv * 0.3);
          if (near > 0.0) {
            float junta = smoothstep(0.03, 0.0, abs(fract(uv.x / 6.0 + rnd) - 0.5) - 0.47) * (1.0 - esTeja);
            float hilada = smoothstep(0.0, 0.5, abs(fract((uv.x * (0.3 + rnd2) + uv.y) * 3.2) - 0.5));
            col *= 1.0 - near * (0.10 * junta + 0.14 * esTeja * (1.0 - hilada));
            col *= 1.0 - near * 0.06 * (vnoise(uv * 3.1) - 0.5);
          }
          if (uAerialOn > 0.5) {
            vec3 foto = hlfAerial(uv + uLean * pisos * 3.0);
            float fotoLum = dot(foto, vec3(0.3333));
            if (fotoLum < 0.80 && fotoLum > 0.06) {
              col = mix(col, foto * 1.04, 0.45);
            }
          }
        } else if (tipo > 0.65) {
          /* ---------- alero ---------- */
          col = vec3(0.74, 0.71, 0.66);
        } else if (tipo > 0.3) {
          /* ---------- teja de barro del hotel ---------- */
          vec2 t = uv * vec2(3.0, 2.6);                 // ~33 cm de canal, ~38 cm de hilada
          vec3 a = vec3(0.63, 0.40, 0.30), b = vec3(0.72, 0.49, 0.37), c = vec3(0.54, 0.34, 0.27);
          col = mix(a, b, vnoise(vPosM.xz * 0.35));
          if (near > 0.0) {
            float canal = abs(fract(t.x) - 0.5) * 2.0;
            float id = h21(floor(t));
            vec3 fino = mix(a, b, id);
            fino = mix(fino, c, smoothstep(0.78, 1.0, h21(floor(t) + 7.3)));
            fino *= 0.70 + 0.30 * (1.0 - canal * canal);
            fino *= 0.88 + 0.12 * smoothstep(0.0, 0.12, fract(t.y));
            col = mix(col * 0.9, fino, near);
          } else col *= 0.9;
          if (uAerialOn > 0.5) {
            // el color lo pone la cubierta real fotografiada; la teja modelada aporta el relieve
            vec3 foto = hlfAerial(vec2(vPosM.x, -vPosM.z) + uLean * 21.0);
            float lum = dot(col, vec3(0.3333)) / 0.42;
            col = mix(col, foto * mix(1.0, lum, 0.55 * near), 0.9);
          }
          rough = 0.86;
        } else {
          /* ---------- muro ---------- */
          float torre = step(8.5, pisos);
          float sel = fract(rnd * 5.37);
          float hotel = step(0.06, tipo);
          vec3 ladrillo = mix(vec3(0.56, 0.31, 0.22), vec3(0.65, 0.39, 0.28), rnd2);
          vec3 ladrOsc = mix(vec3(0.44, 0.26, 0.20), vec3(0.51, 0.31, 0.24), rnd2);
          vec3 panete = mix(vec3(0.80, 0.79, 0.75), vec3(0.89, 0.88, 0.85), rnd2);
          vec3 concreto = mix(vec3(0.62, 0.62, 0.60), vec3(0.72, 0.71, 0.69), rnd2);
          vec3 arena = mix(vec3(0.74, 0.69, 0.60), vec3(0.80, 0.76, 0.68), rnd2);
          vec3 wall = ladrillo;
          float esLadrillo = 1.0;
          if (sel > 0.46) { wall = panete; esLadrillo = 0.0; }
          if (sel > 0.74) { wall = concreto; esLadrillo = 0.0; }
          if (sel > 0.86) { wall = arena; esLadrillo = 0.0; }
          if (sel > 0.94) { wall = ladrOsc; esLadrillo = 1.0; }
          if (hotel > 0.5) { wall = vec3(0.60, 0.34, 0.24); esLadrillo = 1.0; }   // Hotel La Fontana: ladrillo a la vista
          float cortina = torre * step(0.72, rnd2) * (1.0 - hotel);     // algunas torres con muro cortina

          float v = uv.y;
          if (hotel > 0.5 && v > uHotelPisos) discard;          // pisos que aún no se han apilado
          vec2 f = vec2(fract(uv.x), fract(v));
          vec2 aa = clamp(fwidth(vec2(uv.x, v)) * 1.2, vec2(0.004), vec2(0.5));

          float enCuerpo = step(0.0, v) * (1.0 - step(pisos, v));
          float bajo = step(0.0, v) * (1.0 - step(1.0, v));
          float zocalo = 1.0 - step(0.0, v);
          float remate = step(pisos, v);

          float ww = mix(0.46, 0.72, fract(rnd * 9.7));
          float wh0 = mix(0.28, 0.38, fract(rnd * 3.3));
          float wh1 = mix(0.80, 0.90, fract(rnd * 6.1));
          ww = mix(ww, 0.92, cortina); wh0 = mix(wh0, 0.08, cortina); wh1 = mix(wh1, 0.96, cortina);
          float hotelUltimo = hotel * step(pisos - 1.05, v) * enCuerpo;
          if (hotel > 0.5) {
            ww = mix(0.50, 0.96, hotelUltimo);
            wh0 = mix(0.32, 0.24, hotelUltimo);
            wh1 = mix(0.86, 0.88, hotelUltimo);
          }
          float local = bajo * step(3.5, pisos);
          ww = mix(ww, 0.78, local * (1.0 - hotel) + local * hotel * 0.85);
          wh0 = mix(wh0, 0.06, local);
          wh1 = mix(wh1, 0.84, local);

          vec2 lo = vec2(0.5 - ww * 0.5, wh0), hi = vec2(0.5 + ww * 0.5, wh1);
          float vano = box(f, lo, hi, aa) * enCuerpo;

          col = wall * (0.93 + 0.12 * vnoise(vec2(uv.x * 1.7, v * 1.5) + rnd * 40.0));
          // placa de entrepiso
          float placa = (1.0 - smoothstep(0.0, 0.035 + aa.y, f.y)) * enCuerpo * step(0.5, v);
          col = mix(col, mix(concreto, panete, 0.5), placa * mix(0.7, mix(0.2, 0.42, hotel), esLadrillo * (1.0 - torre)));
          col = mix(col, vec3(0.46, 0.46, 0.45), zocalo);
          col = mix(col, mix(wall, concreto, 0.5) * 1.03, remate * 0.7);
          // Franja blanca característica bajo la teja en el último piso del Hotel La Fontana
          col = mix(col, vec3(0.90, 0.90, 0.88), hotelUltimo);

          vec3 cMarco = mix(vec3(0.30, 0.31, 0.32), vec3(0.88, 0.88, 0.86), max(hotel, step(0.5, fract(rnd * 13.7))));
          // vidrio: gris azulado suave, sin contraste duro
          vec3 tinte = mix(vec3(0.30, 0.32, 0.33), vec3(0.27, 0.30, 0.30), fract(rnd * 2.9));
          tinte = mix(tinte, vec3(0.40, 0.44, 0.47), cortina);
          vec3 vidrio = tinte;
          vec2 celda = vec2(floor(uv.x), floor(v));
          float wid = h21(celda + rnd * 91.0);
          float parte = 0.0;
          float tela = 0.0;

          // sombra de dintel / nicho dentro del vano para dar profundidad 3D
          float dintel = smoothstep(hi.y - 0.15, hi.y, f.y) * vano * (1.0 - cortina * 0.5);
          float jamba = smoothstep(lo.x + 0.08, lo.x, f.x) * vano * (1.0 - cortina * 0.5);
          float nicho = max(dintel * 0.55, jamba * 0.35);

          if (near > 0.0) {
            vec3 viewDir = normalize(-fsInput.attributes.positionEC);
            vec3 nEC = normalize(material.normalEC);
            float fres = pow(1.0 - clamp(abs(dot(nEC, viewDir)), 0.0, 1.0), 4.0);
            // hiladas de ladrillo
            vec2 wp = vec2(uv.x * 3.3, v * 3.0);
            float cerca = (1.0 - smoothstep(0.004, 0.022, fwidth(wp.y))) * esLadrillo;
            if (cerca > 0.0) {
              float hil = fract(wp.y / 0.075);
              float trab = fract(wp.x / 0.25 + step(1.0, mod(floor(wp.y / 0.075), 2.0)) * 0.5);
              float junta = max(1.0 - smoothstep(0.0, 0.16, hil), 1.0 - smoothstep(0.0, 0.06, trab));
              col = mix(col, col * vec3(0.84, 0.83, 0.82), junta * cerca * 0.85);
              col *= mix(1.0, 0.92 + 0.16 * h21(floor(vec2(wp.x / 0.25, wp.y / 0.075))), cerca);
            }
            // marco y parteluces
            float marco = box(f, lo - vec2(0.024, 0.032), hi + vec2(0.024, 0.032), aa) * enCuerpo - vano;
            col = mix(col, cMarco, clamp(marco, 0.0, 1.0) * near * (1.0 - cortina * 0.6));
            parte = (1.0 - smoothstep(0.0, 0.012 + aa.x, abs(f.x - 0.5))) * step(0.6, ww);
            parte = max(parte, (1.0 - smoothstep(0.0, 0.012 + aa.y, abs(f.y - mix(wh0, wh1, 0.68)))) * (1.0 - cortina));
            // Parteluces verticales tupidos en la franja superior del hotel
            if (hotelUltimo > 0.5) {
              float m3 = 1.0 - smoothstep(0.0, 0.025 + aa.x, abs(fract(f.x * 3.0) - 0.5));
              parte = max(parte, m3 * 0.9);
            }
            parte *= near;
            // cortinas distintas por ventana, vitrinas en los locales
            float baja = mix(0.25, 0.95, h21(celda + 3.1));
            tela = step(0.55, wid) * (1.0 - cortina) * (1.0 - local) * step((f.y - wh0) / max(0.01, wh1 - wh0), baja);
            vec3 interior = mix(tinte * 0.72, mix(vec3(0.58, 0.56, 0.52), vec3(0.74, 0.72, 0.68), h21(celda + 9.4)), tela * 0.82 * near);
            interior = mix(interior, vec3(0.52, 0.46, 0.38), local * 0.65);
            float reflY = clamp(dot(reflect(-viewDir, nEC), normalize(vUpEC)) * 0.5 + 0.5, 0.0, 1.0);
            vec3 cieloDia = mix(vec3(0.72, 0.78, 0.84), vec3(0.42, 0.60, 0.85), reflY);
            vec3 cieloTarde = mix(vec3(0.76, 0.74, 0.76), vec3(0.40, 0.54, 0.78), reflY);
            vec3 cielo = mix(mix(cieloDia, cieloTarde, uTarde), vec3(0.03, 0.05, 0.10), uNight);
            vidrio = mix(tinte, mix(interior, cielo, clamp(0.22 + 0.72 * fres, 0.0, 1.0)), near);
            vidrio *= 1.0 - nicho * 0.55;
            vidrio = mix(vidrio, cMarco, parte);
          } else {
            vidrio *= 1.0 - nicho * 0.45;
          }
          float esVidrio = vano * (1.0 - parte);
          rough = mix(rough, 0.06, esVidrio);
          spec = mix(spec, vec3(0.44), esVidrio);
          // Jardineras verdes en los antepechos de las ventanas medias del hotel
          if (hotel > 0.5 && enCuerpo > 0.5 && hotelUltimo < 0.5 && bajo < 0.5) {
            float jard = box(f, vec2(lo.x - 0.03, wh0 - 0.13), vec2(hi.x + 0.03, wh0 + 0.01), aa);
            float hoja = 0.72 + 0.48 * vnoise(vec2(uv.x * 9.0, v * 9.0) + rnd * 17.0);
            vec3 verdeJard = vec3(0.13, 0.27, 0.10) * hoja;
            col = mix(col, verdeJard, jard * 0.92);
          }
          // suciedad y contacto en la base
          col *= mix(1.0, 0.84, smoothstep(0.95, 0.0, v) * (1.0 - zocalo) * near);
          col = mix(col, vidrio, vano);

          // Bañado cálido arquitectónico en la base del hotel (estilo fachada real)
          if (hotel > 0.5 && v > -0.1 && v < 1.35) {
            float wash = smoothstep(1.35, 0.05, v) * (1.0 - vano * 0.65);
            float foco = 0.65 + 0.35 * cos(f.x * 6.2831853);
            emis += vec3(1.0, 0.58, 0.22) * wash * foco * (0.20 + 0.75 * max(uTarde * 0.55, uNight));
          }

          // noche: ventanas encendidas con calidez ámbar para bloom sutil
          if (uNight > 0.01) {
            float on = step(0.52, h21(celda + 17.0 + rnd * 53.0));
            on = mix(on, step(0.25, wid), local);
            vec3 luz = mix(vec3(1.0, 0.56, 0.22), vec3(1.0, 0.78, 0.45), h21(celda + 5.5));
            emis = luz * on * esVidrio * (0.55 + 0.5 * (1.0 - tela)) * uNight * 1.05;
          }
          float bajoPlaca = (1.0 - smoothstep(0.86, 1.0, f.y)) * enCuerpo;
          occ = mix(0.58, 1.0, smoothstep(-0.35, 0.85, v)) * mix(0.84, 1.0, bajoPlaca) * (1.0 - nicho * 0.35);
          // el piso que está entrando se enciende un momento
          if (hotel > 0.5 && uHotelPisos < 98.0) emis += vec3(0.55, 0.75, 1.0) * smoothstep(1.0, 0.0, uHotelPisos - v) * 0.65;
        }

        float hz = hlfHaze(dist, uHazeStart, uHazeAmount);
        vec3 skyFill = hlfSkyFill(material.normalEC, vUpEC, uNight, uTarde);
        material.diffuse = col * mix(1.0, 0.32, uNight) * (1.0 - hz);
        material.roughness = rough;
        material.specular = spec * (1.0 - hz);
        material.occlusion = occ;
        material.emissive = (emis + col * skyFill * occ * uSkyFill) * (1.0 - hz) + hlfHazeColor(uNight, uTarde) * hz;
      }
    `})}function La(e,o,t){return new Xe({uniforms:{uNight:{type:_.FLOAT,value:0},uTarde:{type:_.FLOAT,value:0},uSkyFill:{type:_.FLOAT,value:.22},uHazeAmount:{type:_.FLOAT,value:.08},uHazeStart:{type:_.FLOAT,value:1200},uTime:{type:_.FLOAT,value:0},uFrame:{type:_.FLOAT,value:o},uTop:{type:_.FLOAT,value:t},uAtlas:{type:_.SAMPLER_2D,value:new tt({url:e,repeat:!1,minificationFilter:_t.LINEAR_MIPMAP_LINEAR,magnificationFilter:It.LINEAR})}},varyings:{vUV:he.VEC2,vView:he.VEC3,vRightT:he.VEC2,vUpT:he.VEC2,vUpEC:he.VEC3},vertexShaderText:`
      void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        vec3 base = vsInput.attributes.positionMC;
        vec2 corner = vsInput.attributes.texCoord_0;
        vec2 sc = vsInput.attributes.texCoord_1;
        vec4 col = vsInput.attributes.color_0;
        float W = uFrame * sc.x;
        float H = uFrame * sc.y;
        vec3 C = base + vec3(0.0, 0.5 * H, 0.0);
        vec3 cam = (czm_inverseModelView * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vec3 toCam = normalize(cam - C);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam) + vec3(1.0e-4, 0.0, 0.0));
        vec3 up = cross(toCam, right);
        // brisa natural en la copa (base fija en el suelo, ráfagas suaves por posición)
        float swayMask = smoothstep(0.08, 1.0, corner.y);
        swayMask *= swayMask;
        float phase = base.x * 0.07 + base.z * 0.05 + col.g * 6.2831853;
        float gust = sin(uTime * 1.15 + phase) * 0.65 + sin(uTime * 2.35 + phase * 1.7) * 0.35;
        float flutter = sin(uTime * 3.8 + base.z * 0.25 + col.r * 12.0) * 0.18;
        float sway = (gust + flutter) * swayMask * (0.042 * H);
        vsOutput.positionMC = C + right * (corner.x * 0.5 * W + sway) + up * ((corner.y - 0.5) * H);

        float yaw = col.r * 6.2831853;
        float cy = cos(yaw);
        float sy = sin(yaw);
        // al marco propio del árbol (deshace su giro alrededor de +Y)
        vec2 t = vec2(toCam.x * cy - toCam.z * sy, toCam.x * sy + toCam.z * cy);
        float ang = atan(-t.x, t.y);
        if (ang < 0.0) ang += 6.2831853;
        vView = vec3(ang / 0.78539816, toCam.y, col.g);
        vUV = vec2(corner.x * 0.5 + 0.5, corner.y);
        vRightT = vec2(right.x * cy - right.z * sy, right.x * sy + right.z * cy);
        vUpT = vec2(up.x * cy - up.z * sy, up.x * sy + up.z * cy);
        vUpEC = normalize((czm_modelView * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
      }
    `,fragmentShaderText:Ct+`
      vec4 lado(float i, vec2 uv) {
        float flip = step(3.5, i);
        float cell = i - 4.0 * flip;
        float u = clamp(mix(uv.x, 1.0 - uv.x, flip), 0.004, 0.996);
        float v = clamp(uv.y, 0.004, 0.996);
        return texture(uAtlas, vec2((cell + u) * 0.25, 0.5 + 0.5 * v));
      }
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        float a8 = mod(vView.x, 8.0);
        float i0 = floor(a8);
        float w = smoothstep(0.3, 0.7, a8 - i0);
        vec4 c = mix(lado(i0, vUV), lado(mod(i0 + 1.0, 8.0), vUV), w);

        float k = smoothstep(0.60, 0.90, vView.y);
        if (k > 0.0) {
          vec2 p = (vRightT * (vUV.x - 0.5) + vUpT * (vUV.y - 0.5)) * (uFrame / uTop);
          vec2 q = clamp(p + 0.5, 0.004, 0.996);
          float dentro = step(abs(p.x), 0.5) * step(abs(p.y), 0.5);
          vec4 sup = texture(uAtlas, vec2(q.x * 0.25, 0.5 - 0.5 * q.y)) * dentro;
          c = mix(c, sup, k);
        }

        vec3 rgb = czm_srgbToLinear(c.rgb);
        // follaje botánico natural y sobrio, sin saturación artificial
        rgb *= mix(vec3(0.96, 1.02, 0.94), vec3(1.02, 1.03, 0.98), vView.z);
        // sombra interior natural de la copa
        vec2 d = (vUV - vec2(0.5, 0.55)) * 2.0;
        float borde = clamp(length(d), 0.0, 1.0);
        rgb *= mix(0.78, 1.15, borde * borde) * mix(0.82, 1.08, smoothstep(0.05, 0.6, vUV.y));

        float hz = hlfHaze(length(fsInput.attributes.positionEC), uHazeStart, uHazeAmount);
        material.diffuse = rgb * mix(1.0, 0.24, uNight) * (1.0 - hz);
        material.alpha = clamp(c.a * 1.3, 0.0, 1.0);
        // normal abombada (en coordenadas de ojo): el sol modela la copa
        vec3 n = normalize(vec3(d.x * 0.9, d.y * 0.9 + 0.25, 0.85));
        material.normalEC = n;
        material.roughness = 0.92;
        material.specular = vec3(0.03);
        float occCopa = mix(0.68, 1.0, smoothstep(0.05, 0.7, vUV.y));
        material.occlusion = occCopa;
        vec3 skyFill = hlfSkyFill(n, vUpEC, uNight, uTarde);
        material.emissive = rgb * skyFill * occCopa * uSkyFill * (1.0 - hz) + hlfHazeColor(uNight, uTarde) * hz;
      }
    `})}function Ra(){return new Xe({uniforms:{uNight:{type:_.FLOAT,value:0},uTarde:{type:_.FLOAT,value:0},uHazeAmount:{type:_.FLOAT,value:.08},uHazeStart:{type:_.FLOAT,value:1200}},lightingModel:Do.UNLIT,fragmentShaderText:Ct+`
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 c = material.diffuse;
        // el verde y el rojo de la foto aérea se bajan un poco para que no compitan con el modelo
        c = mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, 0.78);
        c = mix(c, c * vec3(1.01, 0.99, 0.97), uTarde * 0.35);
        c = mix(c, c * vec3(0.11, 0.14, 0.22), uNight);
        material.diffuse = mix(c, hlfHazeColor(uNight, uTarde), hlfHaze(length(fsInput.attributes.positionEC), uHazeStart, uHazeAmount));
      }
    `})}function Ia(e,o,t){return new Qt({name:"hlf_sky",uniforms:{uNight:0,uTarde:0,uTime:0,uEast:e,uNorth:o,uUp:t,uSkyZenith:new x(.16,.42,.82),uSkyHorizon:new x(.72,.83,.94),uCloudDensity:.85,uCloudSpeed:1},fragmentShader:`
      uniform sampler2D colorTexture;
      uniform sampler2D depthTexture;
      uniform float uNight;
      uniform float uTarde;
      uniform float uTime;
      uniform vec3 uEast;
      uniform vec3 uNorth;
      uniform vec3 uUp;
      uniform vec3 uSkyZenith;
      uniform vec3 uSkyHorizon;
      uniform float uCloudDensity;
      uniform float uCloudSpeed;
      in vec2 v_textureCoordinates;

      float sh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float sn(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(sh(i), sh(i + vec2(1.0, 0.0)), f.x), mix(sh(i + vec2(0.0, 1.0)), sh(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
        for (int i = 0; i < 6; i++) {
          v += a * sn(p);
          p = rot * p * 2.03 + vec2(13.7, 7.3);
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec4 src = texture(colorTexture, v_textureCoordinates);
        float depth = czm_readDepth(depthTexture, v_textureCoordinates);
        if (depth < 0.999999) {
          out_FragColor = src;
          return;
        }

        vec4 ndc = vec4(v_textureCoordinates * 2.0 - 1.0, 1.0, 1.0);
        vec4 eye = czm_inverseProjection * ndc;
        vec3 dirEC = normalize(eye.xyz / eye.w);
        vec3 dirWC = normalize(czm_inverseViewRotation * dirEC);
        vec3 rd = normalize(vec3(dot(dirWC, uEast), dot(dirWC, uNorth), dot(dirWC, uUp)));
        float elev = max(0.0, rd.z);

        vec3 sunWC = normalize(czm_sunDirectionWC);
        vec3 sunENU = normalize(vec3(dot(sunWC, uEast), dot(sunWC, uNorth), dot(sunWC, uUp)));
        float sunDot = max(0.0, dot(rd, sunENU));

        // Dispersión atmosférica estilo Unreal SkyAtmosphere (Rayleigh + Mie)
        vec3 rayleigh = mix(uSkyHorizon, uSkyZenith, pow(elev, 0.48));
        float horizonBand = exp(-elev * 12.0);
        vec3 mieCol = mix(vec3(1.0, 0.95, 0.86), vec3(1.0, 0.78, 0.58), uTarde);
        vec3 sky = rayleigh + mieCol * (pow(sunDot, 6.0) * 0.34 + horizonBand * pow(sunDot, 2.0) * 0.25) * (1.0 - uNight);
        sky = mix(sky, uSkyHorizon * 1.08, horizonBand * 0.45 * (1.0 - uNight));
        sky += vec3(1.0, 0.98, 0.92) * smoothstep(0.99935, 0.99988, sunDot) * 1.8 * (1.0 - uNight);

        // Estrellas sutiles de noche
        if (uNight > 0.15 && elev > 0.05) {
          vec2 starUV = rd.xy / (elev + 0.35) * 180.0;
          float st = sh(floor(starUV));
          vec2 sf = fract(starUV) - 0.5;
          float star = smoothstep(0.992, 0.999, st) * smoothstep(0.32, 0.0, length(sf));
          sky += vec3(0.85, 0.90, 1.0) * star * uNight * smoothstep(0.05, 0.3, elev) * 1.4;
        }

        // Nubes con perspectiva de plano infinito (curvatura terrestre) + doble capa
        if (rd.z > 0.002 && uCloudDensity > 0.01) {
          float tCum = 1.0 / (rd.z + 0.065);
          vec2 p = rd.xy * tCum * 0.55;
          vec2 wind = vec2(uTime * 0.012, uTime * 0.004) * uCloudSpeed;

          vec2 warp = vec2(fbm(p * 0.65 + wind), fbm(p * 0.65 - wind + vec2(5.2, 1.3)));
          float nBase = fbm(p + warp * 0.42 + wind);
          float detail = fbm(p * 2.6 - wind * 0.8 + vec2(3.1, 7.4));
          float shape = nBase * 0.78 + detail * 0.26;
          float cov = mix(0.62, 0.36, clamp(uCloudDensity, 0.0, 1.0));
          float alpha = smoothstep(cov, cov + 0.24, shape);

          vec2 sunStep = sunENU.xy * 0.08;
          float nSun = fbm(p + sunStep + warp * 0.42 + wind);
          float directLit = clamp(0.52 + (nBase - nSun) * 4.5, 0.0, 1.0);
          float silver = pow(sunDot, 8.0) * (1.0 - alpha * 0.55) * 0.65;

          vec3 topDia = vec3(1.0, 0.99, 0.98);
          vec3 botDia = mix(uSkyHorizon * 0.72, vec3(0.46, 0.53, 0.64), 0.5);
          vec3 topTarde = vec3(1.0, 0.91, 0.82);
          vec3 botTarde = mix(uSkyHorizon * 0.65, vec3(0.38, 0.43, 0.54), 0.5);
          vec3 cNoche = vec3(0.05, 0.07, 0.13);

          vec3 cloudCol = mix(
            mix(mix(botDia, topDia, directLit), mix(botTarde, topTarde, directLit), uTarde),
            cNoche,
            uNight
          );
          cloudCol += mieCol * silver * (1.0 - uNight);

          vec2 pCir = rd.xy * (1.0 / (rd.z + 0.04)) * 0.28;
          float cir = smoothstep(0.56, 0.82, fbm(vec2(pCir.x * 0.7, pCir.y * 1.9) + wind * 0.45));
          vec3 cirCol = mix(mix(vec3(0.96, 0.98, 1.0), vec3(0.98, 0.88, 0.80), uTarde), cNoche * 1.2, uNight);

          float distFade = smoothstep(0.002, 0.075, rd.z);
          sky = mix(sky, cirCol, cir * 0.28 * distFade * uCloudDensity);
          sky = mix(sky, cloudCol, alpha * distFade * min(1.0, uCloudDensity * 0.96));
        }

        out_FragColor = vec4(sky, src.a);
      }
    `})}function _a(){return new Qt({name:"hlf_grade",uniforms:{uNight:0,uTarde:0,uExposure:1,uContrast:.22,uSaturation:1.06,uTint:new x(1,1,1),uVignette:.24},fragmentShader:`
      uniform sampler2D colorTexture;
      uniform float uNight;
      uniform float uTarde;
      uniform float uExposure;
      uniform float uContrast;
      uniform float uSaturation;
      uniform vec3 uTint;
      uniform float uVignette;
      in vec2 v_textureCoordinates;
      void main() {
        vec4 src = texture(colorTexture, v_textureCoordinates);
        vec3 c = src.rgb * uExposure;
        // contraste fílmico suave (curva en S en rango 0..1)
        vec3 s = c * c * (3.0 - 2.0 * c);
        c = mix(c, s, uContrast);
        c *= uTint;
        // saturación / vibrance
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, uSaturation);
        // viñeta muy sutil de visor Unreal
        vec2 q = v_textureCoordinates - 0.5;
        float vig = 1.0 - dot(q, q) * uVignette;
        c *= vig;
        out_FragColor = vec4(clamp(c, 0.0, 1.0), src.a);
      }
    `})}function Ha(e){const o=t=>({type:_.SAMPLER_2D,value:new tt({url:e+t,repeat:!0,minificationFilter:_t.LINEAR_MIPMAP_LINEAR,magnificationFilter:It.LINEAR})});return new Xe({uniforms:{uNight:{type:_.FLOAT,value:0},uTarde:{type:_.FLOAT,value:0},uGroundFill:{type:_.FLOAT,value:.12},uHazeAmount:{type:_.FLOAT,value:.08},uHazeStart:{type:_.FLOAT,value:1200},uAsfalto:o("tex_asfalto.webp"),uAnden:o("tex_anden.webp"),uPrado:o("tex_prado.webp"),uCiclo:o("tex_ciclo.webp"),...Vo()},varyings:{vG:he.VEC3,vUpEC:he.VEC3},vertexShaderText:`
      void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        vG = vsInput.attributes.positionMC;
        vUpEC = normalize((czm_modelView * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
      }
    `,fragmentShaderText:Ct+jo+`
      float gh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float gn(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(gh(i), gh(i + vec2(1.0, 0.0)), f.x), mix(gh(i + vec2(0.0, 1.0)), gh(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      // relieve y dibujo de la foto del material (su luminancia relativa a su promedio); el color lo da el tono real medido
      float detalle(sampler2D t, vec2 uv) {
        float l = dot(texture(t, uv).rgb, vec3(0.3333));
        float m = dot(textureLod(t, uv, 9.0).rgb, vec3(0.3333));
        return clamp(l / max(m, 0.02), 0.55, 1.6);
      }
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        float capa = floor(fsInput.attributes.color_0.r * 8.0 + 0.5);
        vec2 p = vG.xz;
        vec2 en = vec2(vG.x, -vG.z);
        float big = gn(p * 0.03);
        vec3 foto = uAerialOn > 0.5 ? hlfAerial(en) : vec3(0.36, 0.40, 0.30);
        vec3 col;
        float rough = 0.95;
        vec3 spec = vec3(0.03);
        if (capa < 0.5) {             // terreno: tal cual es en la realidad
          col = foto;
        } else if (capa < 1.5) {      // vía: asfalto real, con el desgaste que muestra la foto
          col = vec3(0.105, 0.105, 0.11) * detalle(uAsfalto, p / 5.0) * (0.86 + 0.28 * big);
          col = mix(col, foto, 0.25 * uAerialOn);
          rough = 0.58;
          spec = vec3(0.10);
        } else if (capa < 2.5) {      // andén: adoquín de concreto
          col = vec3(0.46, 0.45, 0.42) * detalle(uAnden, p / 2.4) * (0.92 + 0.16 * big);
          col = mix(col, foto, 0.15 * uAerialOn);
          rough = 0.85;
        } else if (capa < 3.5) {      // separador: prado
          col = vec3(0.115, 0.20, 0.07) * detalle(uPrado, p / 3.0) * (0.80 + 0.30 * big);
        } else if (capa < 4.5) {      // ciclorruta
          col = vec3(0.30, 0.10, 0.08) * detalle(uCiclo, p / 4.0) * (0.92 + 0.16 * big);
        } else if (capa < 5.5) {      // agua del canal
          col = mix(vec3(0.10, 0.15, 0.15), vec3(0.15, 0.20, 0.19), gn(p * 0.4));
          rough = 0.08;
          spec = vec3(0.35);
        } else {                      // canal y puentes: concreto
          col = mix(vec3(0.42, 0.41, 0.39), vec3(0.50, 0.49, 0.47), big);
        }
        float hz = hlfHaze(length(fsInput.attributes.positionEC), uHazeStart, uHazeAmount);
        vec3 skyFill = hlfSkyFill(material.normalEC, vUpEC, uNight, uTarde);
        material.diffuse = col * mix(1.0, 0.28, uNight) * (1.0 - hz);
        material.roughness = rough;
        material.specular = spec * (1.0 - hz);
        material.emissive = col * skyFill * uGroundFill * (1.0 - hz) + hlfHazeColor(uNight, uTarde) * hz;
      }
    `})}function Na(){return new Xe({uniforms:{uNight:{type:_.FLOAT,value:0},uTarde:{type:_.FLOAT,value:0},uSkyFill:{type:_.FLOAT,value:.24},uHazeAmount:{type:_.FLOAT,value:.08},uHazeStart:{type:_.FLOAT,value:1200}},varyings:{vPosM:he.VEC3,vUpEC:he.VEC3},vertexShaderText:`
      void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        vPosM = vsInput.attributes.positionMC;
        vUpEC = normalize((czm_modelView * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
      }
    `,fragmentShaderText:Ct+`
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        float dist = length(fsInput.attributes.positionEC);
        float hz = hlfHaze(dist, uHazeStart, uHazeAmount);
        vec3 col = material.diffuse;
        vec3 nEC = normalize(material.normalEC);
        vec3 upEC = normalize(vUpEC);
        vec3 skyFill = hlfSkyFill(nEC, upEC, uNight, uTarde);

        // Iluminación protagonista del Hotel Estelar La Fontana (destaca sobre todo el contexto):
        vec3 viewDirEC = normalize(-fsInput.attributes.positionEC);
        float fresnel = pow(1.0 - max(0.0, dot(nEC, viewDirEC)), 2.6);

        // 1. Luz clave arquitectónica + rim de silueta (realza ladrillo, molduras 3D y relieves PBR)
        vec3 keyDirEC = normalize(czm_viewRotation * vec3(0.45, -0.72, 0.52));
        float keyDiff = max(0.0, dot(nEC, keyDirEC)) * 0.60 + 0.40;
        vec3 heroFill = col * mix(vec3(1.14, 1.00, 0.88), vec3(0.24, 0.32, 0.48), uNight) * keyDiff * mix(0.78, 0.50, uNight);
        vec3 rimGlow = mix(vec3(1.0, 0.88, 0.72), vec3(0.32, 0.55, 0.95), uNight) * fresnel * mix(0.35, 0.55, uNight);

        // 2. Bañadores verticales cálidos (2900K) en machones + zócalo de plazoleta + cornisa/torre
        float pierWave = pow(0.5 + 0.5 * cos((vPosM.x + vPosM.z) * 1.45), 2.2);
        float heightFade = smoothstep(3.8, 5.2, vPosM.y) * smoothstep(24.5, 6.0, vPosM.y);
        float baseWash = smoothstep(9.5, 4.0, vPosM.y) * step(3.6, vPosM.y);
        float eaveGlow = (smoothstep(18.0, 21.5, vPosM.y) * smoothstep(25.5, 22.0, vPosM.y))
                       + smoothstep(26.0, 29.5, vPosM.y) * 0.9;
        float esOpaco = step(0.18, material.roughness);
        vec3 warmColor = vec3(1.0, 0.64, 0.26);
        vec3 warmBeam = warmColor * col * esOpaco * (
          pierWave * heightFade * mix(0.38, 1.45, uNight) +
          baseWash * mix(0.48, 1.55, uNight) +
          eaveGlow * mix(0.22, 1.10, uNight)
        );

        // 3. Calidez interior en habitaciones y ventanales
        float esVidrio = 1.0 - esOpaco;
        float winSeed = fract(sin(dot(floor(vec2(vPosM.x + vPosM.z, vPosM.y) * 0.32), vec2(12.9898, 78.233))) * 43758.5453);
        float winOn = step(0.38, winSeed);
        vec3 winGlow = vec3(1.0, 0.76, 0.42) * esVidrio * winOn * mix(0.18, 1.65, uNight);

        material.diffuse = col * mix(1.22, 0.54, uNight) * (1.0 - hz);
        material.emissive = (material.emissive + heroFill + rimGlow + col * skyFill * 0.26 + warmBeam + winGlow) * (1.0 - hz) + hlfHazeColor(uNight, uTarde) * hz;
      }
    `})}function eo(){return Xt.eastNorthUpToFixedFrame(x.fromDegrees(At.longitude,At.latitude,At.height))}function ee(e,o,t,a=eo()){return $.multiplyByPoint(a,new x(e,o,t),new x)}const Fa={island_tree_01:"Arbolado · copa media",island_tree_02:"Arbolado · copa ancha",island_tree_03:"Arbolado · copa baja",jacaranda_tree:"Arbolado · gran porte",tree_small_02:"Arbolado · joven",fir_sapling_medium:"Coníferas",shrub_02:"Arbustos"};function Oa(e,o,t){let a=!1;for(let n=0,s=t.length-1;n<t.length;s=n++){const[c,h]=t[n],[d,u]=t[s];h>o!=u>o&&e<(d-c)*(o-h)/(u-h)+c&&(a=!a)}return a}function Da(e,o,t){let a=1/0;for(let n=0,s=t.length-1;n<t.length;s=n++){const[c,h]=t[s],[d,u]=t[n],m=d-c,w=u-h,C=Math.max(0,Math.min(1,((e-c)*m+(o-h)*w)/(m*m+w*w||1)));a=Math.min(a,Math.hypot(e-c-C*m,o-h-C*w))}return a}async function Ba(e,o,t){const a=e.scene,n=eo(),s=$.inverseTransformation(n,new $),c=Ve.secciones;o("Contexto urbano",.08);const[h,d,u,m]=await Promise.all([fetch(c+"recorte.json").then(i=>i.json()),fetch(c+"edificios.json").then(i=>i.json()),fetch(c+"arboles.json").then(i=>i.json()),fetch(c+"suelo.json").then(i=>i.json())]),w=()=>h.clips.map(i=>{const g=new Mt({positions:x.fromDegreesArray(i.flat())}),B=g.computeRectangle();return g.computeRectangle=I=>la.clone(B,I),g});a.globe.clippingPolygons=new kt({polygons:w()});const C=Ra();let k=null;try{if(!Ve.googleTiles)throw new Error("sin clave de Google: se usa solo el modelo propio");k=await na.fromUrl(Ve.googleTiles,{maximumScreenSpaceError:10,shadows:be.DISABLED,dynamicScreenSpaceError:!0,dynamicScreenSpaceErrorDensity:.0022,dynamicScreenSpaceErrorFactor:4,showCreditsOnScreen:!0,cullWithChildrenBounds:!0,cacheBytes:384*1024*1024,maximumCacheOverflowBytes:256*1024*1024}),k.clippingPolygons=new kt({polygons:w()}),k.customShader=C,a.primitives.add(k)}catch(i){console.warn("Tiles de Google no disponibles",i)}const v=[-236,330],y=[];for(const i of d.secciones){const g=i.key==="Hotel";y.push({key:i.key,file:g?"hotel_fachadas.glb":i.file,kind:g?"cubierta_pbr":"edificios",label:g?"Hotel La Fontana 3D":`Edificaciones · sector ${i.key}`,dist:g?-2:Math.hypot(i.c[0]-v[0],i.c[1]-v[1])})}y.push({key:"hotel_cubiertas",file:"hotel_cubiertas.glb",kind:"cubierta",label:"Cubiertas del hotel",dist:-1}),y.push({key:"hotel_plazoleta",file:"hotel_plazoleta.glb",kind:"cubierta_pbr",label:"Plazoleta y acceso · Hotel",dist:-.8}),y.push({key:"torres_vecinas",file:"torres_vecinas.glb",kind:"cubierta_pbr",label:"Torres vecinas PBR",dist:-.6}),y.push({key:"esquina_ak15",file:"esquina_ak15.glb",kind:"cubierta_pbr",label:"Esquina Ak 15 PBR",dist:-.55}),y.push({key:"metro127",file:"metro127.glb",kind:"cubierta_pbr",label:"Metro 127 · Sonesta PBR",dist:-.52}),y.push({key:"clinica127",file:"clinica127.glb",kind:"cubierta_pbr",label:"Clínica 127 Colsubsidio PBR",dist:-.51}),y.push({key:"unicentro_cubierta",file:"unicentro_cubierta.glb",kind:"cubierta_pbr",label:"Cubierta · Unicentro",dist:-.5}),y.sort((i,g)=>i.dist-g.dist);const H={Terreno:[0,"Terreno"],Vias:[1,"Vías"],Andenes:[2,"Andenes"],Separadores:[3,"Separadores"],Ciclorrutas:[4,"Ciclorrutas"],Agua:[5,"Canal · agua"],Canal_Fondo:[6,"Canal"],Canal_Muros:[6,"Canal · muros"],Puentes:[7,"Puentes"]},p=m.secciones.map(i=>({key:i.key,file:i.file,kind:"suelo",capa:H[i.key]?.[0]??0,label:H[i.key]?.[1]??i.key,dist:-3})),A=u.secciones.map(i=>({key:i.key,file:i.file,kind:"arboles",atlas:i.atlas,marco:i.marco,marcoSup:i.marcoSup,label:Fa[i.key]??"Vegetación",dist:0}));let R=[];try{R=(await fetch(c+"arboles3d.json").then(i=>i.json())).secciones}catch{}const M=R.map(i=>({key:"3d_"+i.key,file:i.file,kind:"arbol3d",label:"Arbolado del hotel",dist:0})),T=[...p,...y.slice(0,4),...M,...A.slice(0,3),...y.slice(4,9),...A.slice(3),...y.slice(9)],N=Pa(),ae=new Xe({lightingModel:Do.UNLIT,uniforms:{uNight:{type:_.FLOAT,value:0}},fragmentShaderText:`
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 c = material.baseColor.rgb;
        if (dot(c, vec3(0.3333)) < 0.02) c = vec3(0.20, 0.30, 0.12);
        vec3 n = normalize(fsInput.attributes.normalEC);
        if (dot(n, -fsInput.attributes.positionEC) < 0.0) n = -n;
        vec3 pW = (czm_inverseView * vec4(fsInput.attributes.positionEC, 1.0)).xyz;
        vec3 up = normalize(czm_viewRotation * normalize(pW));
        vec3 sunDir = normalize(czm_lightDirectionEC);
        float hemi = dot(n, up) * 0.5 + 0.5;
        vec3 amb = mix(vec3(0.60, 0.57, 0.50), vec3(0.89, 0.93, 0.96), hemi) * 0.95;
        float nl = max(dot(n, sunDir), 0.0);
        float trans = max(dot(-n, sunDir), 0.0) * 0.35;
        vec3 sol = vec3(1.0, 0.94, 0.86) * (nl * 0.85 + trans);
        vec3 col = c * (amb + sol) * 1.04;
        if (any(isnan(col))) col = c;
        vec3 finalCol = mix(col, c * vec3(0.18, 0.22, 0.32), uNight);
        material.emissive = finalCol;
        material.diffuse = finalCol;
      }
    `}),te=Na(),Q=Ha(c),le=(async()=>{try{const i=await Bo.fromAssetId(Ve.imageryAssetId),g=18,B=i.tilingScheme,I=(ne,Te)=>ct.fromCartesian(ee(ne,Te,0,n)),S=B.positionToTileXY(I(-1010,930),g),q=B.positionToTileXY(I(1010,-940),g),G=q.x-S.x+1,J=q.y-S.y+1,X=i.tileWidth,ie=document.createElement("canvas");ie.width=G*X,ie.height=J*X;const oe=ie.getContext("2d"),_e=[];for(let ne=S.y;ne<=q.y;ne++)for(let Te=S.x;Te<=q.x;Te++)_e.push([Te,ne]);const Oe=async([ne,Te])=>{for(let ho=0;ho<40;ho++){const mo=i.requestImage(ne,Te,g);if(mo){try{const rt=await mo,po=(ne-S.x)*X,go=(Te-S.y)*X;typeof ImageBitmap<"u"&&rt instanceof ImageBitmap?(oe.save(),oe.translate(po,go+X),oe.scale(1,-1),oe.drawImage(rt,0,0,X,X),oe.restore()):oe.drawImage(rt,po,go,X,X)}catch{}return}await new Promise(rt=>setTimeout(rt,120))}};oe.fillStyle="#6a6f62",oe.fillRect(0,0,ie.width,ie.height);const st=Array.from({length:6},async()=>{for(;_e.length;)await Oe(_e.shift())});await Promise.all(st);const Me=document.createElement("canvas");Me.width=Me.height=4096,Me.getContext("2d").drawImage(ie,0,0,4096,4096);const no=await new Promise(ne=>Me.toBlob(ne,"image/jpeg",.92));if(!no)return;const so=URL.createObjectURL(no);window.__AERIAL_URL__=so;const ro=B.tileXYToRectangle(S.x,S.y,g),lo=B.tileXYToRectangle(q.x,q.y,g),co=(ne,Te)=>$.multiplyByPoint(s,x.fromRadians(ne,Te,At.height),new x),uo=co(ro.west,lo.south),fo=co(lo.east,ro.north),oa=new Qe(uo.x,uo.y,fo.x,fo.y);for(const ne of[N,Q])ne.setUniform("uAerial",new tt({url:so,repeat:!1,minificationFilter:_t.LINEAR_MIPMAP_LINEAR,magnificationFilter:It.LINEAR})),ne.setUniform("uAerialRect",oa),ne.setUniform("uAerialOn",1)}catch(i){console.warn("Foto aérea no disponible",i)}})(),ce=[],ve=[],Le=[];let Re=null;const Ie=new sa(new x(0,-1,0),1e3);let nt=0,We=0,qe=.22,ke=.08,ye=1200;const Ge={total:T.length,loaded:0,failed:[]},r=[];let f=0;const b=U.fromCssColorString("#d9d4cb"),l=(i,g)=>{const B=f;i.color=B>0?b.withAlpha(g?1:1-.55*B):U.WHITE,i.colorBlendMode=ft.MIX,i.colorBlendAmount=B*(g?.35:.7)},P=async i=>{try{const g=await ht.fromGltfAsync({url:c+i.file,modelMatrix:n,upAxis:Ee.Y,forwardAxis:Ee.X,shadows:i.kind==="arbol3d"?be.ENABLED:i.kind==="arboles"?be.CAST_ONLY:i.kind==="suelo"?be.RECEIVE_ONLY:be.ENABLED,backFaceCulling:!1,incrementallyLoadTextures:!1,cull:i.kind!=="arboles"});if(i.kind==="arbol3d")g.customShader=ae;else if(i.kind==="suelo")g.customShader=Q;else if(i.kind==="arboles"){const I=La(c+i.atlas,i.marco,i.marcoSup);I.setUniform("uNight",nt),I.setUniform("uTarde",We),I.setUniform("uSkyFill",qe),I.setUniform("uHazeAmount",ke),I.setUniform("uHazeStart",ye),ce.push(I),g.customShader=I}else i.key==="Hotel"||i.key==="hotel_plazoleta"||i.key==="hotel_cubiertas"?g.customShader=te:i.kind!=="cubierta_pbr"&&(g.customShader=N);const B=i.key==="Hotel"||i.key==="hotel_plazoleta"||i.key==="hotel_cubiertas";g.imageBasedLighting.imageBasedLightingFactor=B?new ze(1,.75):i.kind==="cubierta_pbr"?new ze(.85,.55):new ze(.68,.38),a.primitives.add(g),r.push({model:g,suelo:i.kind==="suelo"}),f>0&&l(g,i.kind==="suelo"),i.kind==="arboles"&&ve.push(g),(i.key==="Hotel"||i.key==="hotel_cubiertas")&&Le.push(g),await new Promise(I=>{if(g.ready)return I();const S=g.readyEvent.addEventListener(()=>{S(),I()});setTimeout(I,2e4)})}catch(g){console.error("Sección no cargada",i.file,g),Ge.failed.push(i.file)}Ge.loaded++,t?.(Ge.loaded,Ge.total,i.label)},F=p.length+7,W=async(i,g,B)=>{let I=0,S=0;await Promise.all(Array.from({length:Math.min(g,i.length)},async()=>{for(;I<i.length;){const q=i[I++];await P(q),B?.(++S)}}))},j=T.slice(0,F);await W(j,5,i=>o(j[Math.min(i,j.length-1)].label,.2+.75*i/j.length));let D=()=>{};const K=new Promise(i=>{D=i,setTimeout(i,16e3)}),se=(async()=>{await K,await W(T.slice(F),3),await le})();return{startBackground:()=>D(),matrix:n,inverse:s,tileset:k,buildings:d.edificios,treeCount:u.total,sections:Ge,done:se,setNight(i){C.setUniform("uNight",i),N.setUniform("uNight",i),te.setUniform("uNight",i),nt=i,Q.setUniform("uNight",i);for(const g of ce)g.setUniform("uNight",i)},setTarde(i){C.setUniform("uTarde",i),N.setUniform("uTarde",i),te.setUniform("uTarde",i),We=i,Q.setUniform("uTarde",i);for(const g of ce)g.setUniform("uTarde",i)},setTime(i){for(const g of ce)g.setUniform("uTime",i)},setLook(i){if(i.skyFill!==void 0){qe=i.skyFill,N.setUniform("uSkyFill",qe),te.setUniform("uSkyFill",qe);for(const g of ce)g.setUniform("uSkyFill",qe)}if(i.groundFill!==void 0&&Q.setUniform("uGroundFill",i.groundFill),i.hazeAmount!==void 0){ke=i.hazeAmount,N.setUniform("uHazeAmount",ke),te.setUniform("uHazeAmount",ke),Q.setUniform("uHazeAmount",ke),C.setUniform("uHazeAmount",ke);for(const g of ce)g.setUniform("uHazeAmount",ke)}if(i.hazeStart!==void 0){ye=i.hazeStart,N.setUniform("uHazeStart",ye),te.setUniform("uHazeStart",ye),Q.setUniform("uHazeStart",ye),C.setUniform("uHazeStart",ye);for(const g of ce)g.setUniform("uHazeStart",ye)}},setRevitBlocks(i,g=[]){const B=d.edificios.filter(I=>i.includes(I.id)).map(I=>{const S=I.r.reduce((G,J)=>G+J[0],0)/I.r.length,q=I.r.reduce((G,J)=>G+J[1],0)/I.r.length;return new Mt({positions:I.r.map(([G,J])=>{const X=G-S,ie=J-q,oe=Math.hypot(X,ie)||1;return ee(G+X/oe*1,J+ie/oe*1,0,n)})})});for(const I of g)B.push(new Mt({positions:I.map(([S,q])=>ee(S,q,0,n))}));for(const I of Le)I.clippingPolygons=B.length?new kt({polygons:B}):void 0},setRevitZone(i){if(!i){Re=i?[[i[0],i[1]],[i[2],i[1]],[i[2],i[3]],[i[0],i[3]]].map(([g,B])=>ee(g,B,0,n)):null;for(const g of Le)g.clippingPolygons=Re?new kt({polygons:[new Mt({positions:Re})]}):void 0;N.setUniform("uRevitBox",i?new Qe(i[0]-1,i[1]-1,i[2]+1,i[3]+1):new Qe(0,0,0,0))}},setHotelFloors(i){const g=i<98;Ie.distance=3.2+i*3.05;for(const B of Le)g&&!B.clippingPlanes&&(B.clippingPlanes=new ra({planes:[Ie],edgeWidth:2,edgeColor:U.fromCssColorString("#d7ebff")})),B.clippingPlanes&&(B.clippingPlanes.enabled=g);N.setUniform("uHotelPisos",i)},setAtenuado(i){f=i;for(const g of r)l(g.model,g.suelo)},setTreesVisible(i){for(const g of ve)g.show=i},buildingAt(i){const g=$.multiplyByPoint(s,i,new x);let B=null,I=1.2;for(const S of d.edificios){if(g.x<S.bb[0]-1.5||g.x>S.bb[2]+1.5||g.y<S.bb[1]-1.5||g.y>S.bb[3]+1.5||g.z>S.b+S.h+2.5)continue;if(Oa(g.x,g.y,S.r))return S;const q=Da(g.x,g.y,S.r);q<I&&(I=q,B=S)}return B}}}const Ua=U.fromCssColorString("#ff2b1a"),Va=U.fromCssColorString("#ffc400"),ja=U.fromCssColorString("#00e862"),$e=U.fromCssColorString("#1a1d22");function jt(e){const o=document.createElement("canvas");o.width=128,o.height=128;const t=o.getContext("2d");if(t.clearRect(0,0,128,128),e==="pare"){t.beginPath();for(let a=0;a<8;a++){const n=(a+.5)*Math.PI/4,s=64+Math.cos(n)*58,c=64+Math.sin(n)*58;a===0?t.moveTo(s,c):t.lineTo(s,c)}t.closePath(),t.fillStyle="#c81e1e",t.fill(),t.lineWidth=5,t.strokeStyle="#ffffff",t.stroke(),t.fillStyle="#ffffff",t.font="bold 31px sans-serif",t.textAlign="center",t.textBaseline="middle",t.fillText("PARE",64,66)}else e==="peaton"?(t.beginPath(),t.moveTo(64,6),t.lineTo(122,64),t.lineTo(64,122),t.lineTo(6,64),t.closePath(),t.fillStyle="#f5b800",t.fill(),t.lineWidth=4,t.strokeStyle="#18181b",t.stroke(),t.fillStyle="#18181b",t.beginPath(),t.arc(64,38,7,0,Math.PI*2),t.fill(),t.fillRect(59,47,10,22),t.fillRect(54,69,7,20),t.fillRect(67,69,7,20)):(t.beginPath(),t.arc(64,64,56,0,Math.PI*2),t.fillStyle="#ffffff",t.fill(),t.lineWidth=11,t.strokeStyle="#c81e1e",t.stroke(),t.fillStyle="#111827",t.font="bold 46px sans-serif",t.textAlign="center",t.textBaseline="middle",t.fillText("30",64,67));return o.toDataURL("image/png")}function Wa(e,o,t,a,n){const s=(p,A,R)=>$.multiplyByPoint(o,new x(p,A,R),new x),c=[],h=t+7.2,d=a+7.2,u=n(h,d),m=U.fromCssColorString("#2a303a"),w=U.fromCssColorString("#14171c"),C=U.fromCssColorString("#eab308"),k=(p,A,R,M)=>{const T=M?.42:.3,N=M?.3:.42;c.push(e.entities.add({position:s(p,A,R),box:{dimensions:new x(T,N,1.18),material:w}}));const ae=(ve,Le)=>{const Re=e.entities.add({position:s(p,A,R+ve),box:{dimensions:new x(M?.24:.33,M?.33:.24,.24),material:Le}});return c.push(Re),Re},te=ae(.36,$e),Q=ae(0,$e),le=ae(-.36,$e);return{red:te,yellow:Q,green:le,setState:ve=>{te.box.material=new mt(ve==="red"?Ua:$e),Q.box.material=new mt(ve==="yellow"?Va:$e),le.box.material=new mt(ve==="green"?ja:$e)}}};if(Math.abs(t+148.8)<12&&Math.abs(a-216.3)<12){const p=[{px:-159.5,py:232,dx:4.2,dy:0,isNS:!0},{px:-163.5,py:226.5,dx:0,dy:-4,isNS:!1},{px:-163,py:203,dx:0,dy:4,isNS:!1},{px:-133.5,py:231.5,dx:4.2,dy:0,isNS:!0},{px:-133,py:202.5,dx:0,dy:4,isNS:!1}],A=[],R=[];for(const T of p){const N=n(T.px,T.py);c.push(e.entities.add({position:s(T.px,T.py,N+2.9),cylinder:{length:5.8,topRadius:.09,bottomRadius:.13,material:m}}),e.entities.add({position:s(T.px,T.py,N+1.2),cylinder:{length:.45,topRadius:.132,bottomRadius:.132,material:C}}),e.entities.add({position:s(T.px+T.dx*.5,T.py+T.dy*.5,N+5.65),box:{dimensions:new x(Math.max(.14,Math.abs(T.dx)),Math.max(.14,Math.abs(T.dy)),.14),material:m}}));const ae=k(T.px+T.dx*.78,T.py+T.dy*.78,N+5.1,T.isNS);(T.isNS?A:R).push(ae)}const M=T=>({red:T[0].red,yellow:T[0].yellow,green:T[0].green,setState:N=>{for(const ae of T)ae.setState(N)}});return{ns:M(A),ew:M(R),setVisible(T){for(const N of c)N.show=T}}}c.push(e.entities.add({position:s(h,d,u+2.9),cylinder:{length:5.8,topRadius:.09,bottomRadius:.13,material:m}}),e.entities.add({position:s(h,d,u+1.2),cylinder:{length:.45,topRadius:.132,bottomRadius:.132,material:C}}));const v=4.6;c.push(e.entities.add({position:s(h-v*.5,d,u+5.65),box:{dimensions:new x(v,.14,.14),material:m}}),e.entities.add({position:s(h,d-v*.5,u+5.65),box:{dimensions:new x(.14,v,.14),material:m}}));const y=k(h-3.4,d,u+5.1,!0),H=k(h,d-3.4,u+5.1,!1);return{ns:y,ew:H,setVisible(p){for(const A of c)A.show=p}}}function qa(e,o,t,a,n){const s=(p,A,R)=>$.multiplyByPoint(o,new x(p,A,R),new x),c=[],h=vo.fromColor(U.fromCssColorString("#f3f4f6").withAlpha(.92)),d=vo.fromColor(U.fromCssColorString("#f5b800").withAlpha(.92)),u=(p,A,R,M,T,N)=>{if(a(p,A)<.8)return;const ae=n(p,A)+.07;s(p,A,ae);const te=$t.fromRotationZ(T),Q=$.fromRotationTranslation(te,new x(p,A,ae)),le=$.multiply(o,Q,new $);c.push(new fa({geometry:ha.fromDimensions({dimensions:new x(R,M,.04)}),modelMatrix:le,attributes:{color:N}}))},m=Math.atan2(-51,380);for(const p of t){if(Math.abs(p.e+148.8)<12&&Math.abs(p.n-216.3)<12){const R=[{bx:-154,by:230,horiz:!0,ang:0},{bx:-164.5,by:221.5,horiz:!1,ang:m},{bx:-164.5,by:210.5,horiz:!1,ang:m},{bx:-154,by:202.5,horiz:!0,ang:0},{bx:-129,by:229,horiz:!1,ang:m},{bx:-128.5,by:211.5,horiz:!1,ang:m},{bx:-136.5,by:202.5,horiz:!0,ang:0}];for(const M of R)for(let T=-3;T<=3;T++){const N=M.horiz?M.bx+T*1.1:M.bx,ae=M.horiz?M.by:M.by+T*1.05;u(N,ae,M.horiz?.52:2.8,M.horiz?2.8:.52,M.ang,h)}continue}const A=[{de:0,dn:9.5,horiz:!0},{de:0,dn:-9.5,horiz:!0},{de:9.5,dn:0,horiz:!1},{de:-9.5,dn:0,horiz:!1}];for(const R of A){const M=p.e+R.de,T=p.n+R.dn;if(a(M,T)<1.2)continue;for(let te=-3;te<=3;te++){const Q=R.horiz?M+te*1.15:M,le=R.horiz?T:T+te*1.15;u(Q,le,R.horiz?.52:2.8,R.horiz?2.8:.52,0,h)}const N=M+(R.de===0?0:Math.sign(R.de)*2.1),ae=T+(R.dn===0?0:Math.sign(R.dn)*2.1);u(N,ae,R.horiz?6.8:.42,R.horiz?.42:6.8,0,h)}}for(let p=-80;p<=440;p+=8)u(-154,p,.18,3.2,0,h),u(-132,p,.18,3.2,0,h);for(let p=-420;p<=160;p+=8){const A=263-(p+420)*.13421052631578947;u(p,A+7.5,3.2,.18,m,h),u(p,A-7.5,3.2,.18,m,h),u(p,A,4.5,.18,m,d)}for(let p=-160;p<=360;p+=8)u(158,p,.18,3.2,0,h);let w=null;c.length>0&&(w=new ca({geometryInstances:c,appearance:new da({flat:!0,translucent:!0}),asynchronous:!1}),e.scene.primitives.add(w));const C=[],k=jt("pare"),v=jt("peaton"),y=jt("vel30"),H=U.fromCssColorString("#9ca3af");return t.forEach((p,A)=>{const R=[{e:p.e-7.2,n:p.n-7.2,tex:k},{e:p.e+7.2,n:p.n-7.2,tex:A%2===0?v:y}];for(const M of R){const T=n(M.e,M.n);C.push(e.entities.add({position:s(M.e,M.n,T+1.15),cylinder:{length:2.3,topRadius:.035,bottomRadius:.035,material:H}}),e.entities.add({position:s(M.e,M.n,T+2.45),billboard:{image:M.tex,width:.72,height:.72,sizeInMeters:!0,verticalOrigin:ua.CENTER}}))}}),{setVisible(p){w&&(w.show=p);for(const A of C)A.show=p}}}function Ga(e,o){const t=(y,H,p)=>$.multiplyByPoint(o,new x(y,H,p),new x),a=[],h=U.fromCssColorString("#7a7771"),d=U.fromCssColorString("#3d3833"),u=U.fromCssColorString("#24471b"),m=U.fromCssColorString("#3d7f8f").withAlpha(.88),w=U.fromCssColorString("#ffbe55");a.push(e.entities.add({position:t(-225,263.5,4.17+.32),cylinder:{length:.64,topRadius:3.3,bottomRadius:3.6,material:h,slices:12}}),e.entities.add({position:t(-225,263.5,4.17+.56),cylinder:{length:.24,topRadius:3.45,bottomRadius:3.55,material:u,slices:12}}),e.entities.add({position:t(-225,263.5,4.17+.66),cylinder:{length:.08,topRadius:2.95,bottomRadius:2.95,material:m,slices:24}}),e.entities.add({position:t(-225,263.5,4.17+1.35),cylinder:{length:1.9,topRadius:.34,bottomRadius:.48,material:d}}),e.entities.add({position:t(-225,263.5,4.17+1.35),cylinder:{length:.18,topRadius:1.95,bottomRadius:1.55,material:d,slices:24}}),e.entities.add({position:t(-225,263.5,4.17+2.2),cylinder:{length:.16,topRadius:1.15,bottomRadius:.85,material:d,slices:24}}));let C=0;const k=new mt(new yo(()=>{const y=.62+.18*Math.sin(C*7);return U.fromCssColorString("#d9f4ff").withAlpha(y)},!1)),v=new mt(new yo(()=>{const y=.46+.16*Math.cos(C*5.5);return U.fromCssColorString("#bce8f7").withAlpha(y)},!1));a.push(e.entities.add({position:t(-225,263.5,4.17+2.85),cylinder:{length:1.25,topRadius:.08,bottomRadius:.36,material:k,slices:16}}),e.entities.add({position:t(-225,263.5,4.17+1.78),cylinder:{length:.85,topRadius:1.08,bottomRadius:1.22,material:v,slices:24}}),e.entities.add({position:t(-225,263.5,4.17+1.02),cylinder:{length:.72,topRadius:1.88,bottomRadius:2.08,material:v,slices:24}}));for(let y=-246;y<=-202;y+=8.5)a.push(e.entities.add({position:t(y,255.8,4.17+1.1),cylinder:{length:2.2,topRadius:.04,bottomRadius:.05,material:d}}),e.entities.add({position:t(y,255.8,4.17+2.3),ellipsoid:{radii:new x(.16,.16,.22),material:w}}));return{update(y){C=y},setVisible(y){for(const H of a)H.show=y}}}const Tt=["#e9e9e6","#d8d9db","#272a30","#4b5563","#8c9197","#b8bcc0","#7a1f1c","#27405f","#c9c2b4","#3b4a3f","#a33b2a"],Co=["#2b4c7e","#991b1b","#1f2937","#3f6212","#7c2d12","#475569","#d97706","#f3f4f6"],ko=3.2;async function Ya(e,o,t=110){const a=Ve.secciones;let n,s,c;try{n=await fetch(a+"vias_campo.json").then(f=>f.json());const r=new Uint8Array(await fetch(a+"vias_campo.bin").then(f=>f.arrayBuffer()));s=r.subarray(0,n.w*n.h),c=r.subarray(n.w*n.h)}catch{return null}const{cell:h,x0:d,y0:u,w:m,h:w}=n,C=(r,f)=>{const b=(r-d)/h-.5,l=(f-u)/h-.5,P=Math.floor(b),F=Math.floor(l);if(P<0||F<0||P>=m-1||F>=w-1)return 0;const W=b-P,j=l-F,D=F*m+P;return((s[D]*(1-W)+s[D+1]*W)*(1-j)+(s[D+m]*(1-W)+s[D+m+1]*W)*j)*.5},k=(r,f)=>{const b=Math.max(0,Math.min(m-1,Math.floor((r-d)/h))),l=Math.max(0,Math.min(w-1,Math.floor((f-u)/h))),P=l*m+b;if(s[P]>0)return c[P]*.1-2;let F=0,W=0;for(let j=-2;j<=2;j++){const D=l+j;if(!(D<0||D>=w))for(let K=-2;K<=2;K++){const se=b+K;if(se<0||se>=m)continue;const i=D*m+se;if(s[i]===0)continue;const g=1/(K*K+j*j+.5);F+=g,W+=(c[i]*.1-2)*g}}return F>0?W/F:1},v=[],y=[],H=[];for(let r=2;r<w-2;r++)for(let f=2;f<m-2;f++){const b=r*m+f,l=d+(f+.5)*h,P=u+(r+.5)*h,F=Math.hypot(l+180,P-250);if(F>520)continue;const W=s[b]*.5;if(W>=2.6&&W<=5&&v.push(b),W>=6&&F<460&&H.push({e:l,n:P,d:W}),s[b]===0&&F<430){let j=!1;for(let D=-2;D<=2&&!j;D++)for(let K=-2;K<=2;K++)if(s[(r+D)*m+(f+K)]>0){j=!0;break}j&&y.push(b)}}if(!v.length)return null;H.sort((r,f)=>f.d-r.d);const p=[];for(const r of H){if(p.length>=6)break;if(p.some(l=>Math.hypot(l.e-r.e,l.n-r.n)<90))continue;const f=k(r.e,r.n),b=Wa(e,o,r.e,r.n,k);b.ns.setState("green"),b.ew.setState("red"),p.push({e:r.e,n:r.n,u:f,faseOffset:p.length*4.5,rig:b,nsEstado:"green",ewEstado:"red"})}const A=qa(e,o,p,C,k),R=Ga(e,o),M=(()=>{let r=12345;return()=>(r=r*1664525+1013904223>>>0)/4294967296})(),T=(r,f,b)=>{const l=Math.cos(b),P=Math.sin(b);if(r>=-168&&r<=-118&&Math.abs(P)>.35)return r<-143?P<-.2?12:-1e6:P>.2?12:-1e6;const F=263-(r+420)*(51/380);return Math.abs(f-F)<26&&Math.abs(l)>.35?f>F?l>.2?12:-1e6:l<-.2?12:-1e6:r>=-255&&r<=-210&&f<222&&Math.abs(P)>.35?P<-.2?10:-1e6:f<175&&r<-215&&Math.abs(l)>.35?l>.2?10:-1e6:r<-385&&f<265&&Math.abs(P)>.35?P<-.2?10:-1e6:0},N=[],ae=(r,f,b)=>N.some(l=>l!==b&&Math.hypot(l.e-r,l.n-f)<8.5),te=r=>{for(let f=0;f<45;f++){const b=v[Math.floor(M()*v.length)],l=d+(b%m+.5)*h,P=u+(Math.floor(b/m)+.5)*h;if(ae(l,P,r))continue;let F=0,W=-1e9;for(let j=0;j<16;j++){const D=j/16*Math.PI*2,K=l+Math.cos(D)*10,se=P+Math.sin(D)*10,i=C(K,se),g=T(K,se,D);if(g<-1e4)continue;const B=C(l+Math.sin(D)*2.5,P-Math.cos(D)*2.5),I=C(l-Math.sin(D)*2.5,P+Math.cos(D)*2.5),S=-Math.abs(i-ko)+(I>B?1.5:0)+g;i>1.5&&S>W&&(W=S,F=D)}if(W>-1e8){r.e=l,r.n=P,r.th=F,r.vActual=r.v*.5;return}}};for(let r=0;r<t;r++){const f=M(),b=f<.12?"sitp_azul":f<.2?"sitp_amarillo":f<.38?"taxi":f<.54?"moto":f<.68?"hatch":f<.84?"suv":"sedan",F={e:0,n:0,th:0,v:b==="moto"?8+M()*4.5:b==="sitp_azul"||b==="sitp_amarillo"?5.2+M()*3:6.5+M()*5,vActual:0,model:null,u:0,tipo:b};te(F),N.push(F)}const Q=[];if(y.length>0)for(let r=0;r<42;r++){const f=y[Math.floor(M()*y.length)],b=d+(f%m+.5)*h,l=u+(Math.floor(f/m)+.5)*h;Q.push({e:b,n:l,th:M()*Math.PI*2,v:1.15+M()*.45,model:null,u:k(b,l)+.16,conPerro:r%3===0})}const le=[],ce=(r,f,b,l,P,F,W,j=.68)=>{for(let D=0;D<P;D++){const K=P===1?(r+f)*.5:r+D/(P-1)*(f-r);for(let se=0;se<F;se++){if(M()>j)continue;const i=F===1?(b+l)*.5:b+se/(F-1)*(l-b);if(C(K,i)>.3)continue;const g=M(),B=g<.08?"taxi":g<.42?"suv":"sedan",I=M()<.5?0:Math.PI,S=k(K,i);le.push({e:K+(M()-.5)*.25,n:i+(M()-.5)*.25,u:S>-1.5?S:3.55,th:W+I+(M()-.5)*.07,tipo:B,model:null})}}};ce(92,134,-22,62,4,15,.05,.7),ce(52,108,114,146,5,4,.12,.62),ce(58,106,-104,-56,4,6,.1,.65),ce(-132,-98,-46,32,3,12,.04,.68);const ve=new x,Le=new $t,Re=new $,Ie=(r,f=.08)=>{r.model&&(x.fromElements(r.e,r.n,r.u+f,ve),$t.fromRotationZ(r.th,Le),$.fromRotationTranslation(Le,ve,Re),r.model.modelMatrix=$.multiply(o,Re,new $))},nt={sedan:"carro.glb",suv:"carro_suv.glb",hatch:"carro_hatch.glb",taxi:"carro_taxi.glb",moto:"carro_moto.glb",sitp_azul:"sitp_azul.glb",sitp_amarillo:"sitp_amarillo.glb"},We=r=>r==="taxi"||r==="sitp_azul"||r==="sitp_amarillo",qe=(async()=>{for(let r=0;r<N.length;r++){const f=N[r],b=nt[f.tipo];try{const l=await ht.fromGltfAsync({url:a+b,upAxis:Ee.Y,forwardAxis:Ee.X,shadows:be.ENABLED,color:We(f.tipo)?U.WHITE:U.fromCssColorString(Tt[r%Tt.length]),colorBlendMode:ft.MIX,colorBlendAmount:We(f.tipo)?0:.32});e.scene.primitives.add(l),f.model=l,f.u=k(f.e,f.n),Ie(f)}catch{}r%6===5&&await new Promise(l=>setTimeout(l,35))}for(let r=0;r<Q.length;r++){const f=Q[r];try{const b=await ht.fromGltfAsync({url:a+(f.conPerro?"persona_perro.glb":"persona.glb"),upAxis:Ee.Y,forwardAxis:Ee.X,shadows:be.ENABLED,color:U.fromCssColorString(Co[r%Co.length]),colorBlendMode:ft.MIX,colorBlendAmount:.25});e.scene.primitives.add(b),f.model=b,Ie(f,0)}catch{}r%6===5&&await new Promise(b=>setTimeout(b,35))}for(let r=0;r<le.length;r++){const f=le[r],b=nt[f.tipo];try{const l=await ht.fromGltfAsync({url:a+b,upAxis:Ee.Y,forwardAxis:Ee.X,shadows:be.ENABLED,color:We(f.tipo)?U.WHITE:U.fromCssColorString(Tt[r*3%Tt.length]),colorBlendMode:ft.MIX,colorBlendAmount:We(f.tipo)?0:.32});e.scene.primitives.add(l),f.model=l,Ie(f)}catch{}r%8===7&&await new Promise(l=>setTimeout(l,30))}})();let ke=!0,ye=0;const Ge=(r,f)=>C(r,f)===0&&C(r+4,f)+C(r-4,f)+C(r,f+4)+C(r,f-4)>.5;return{ready:qe,count:t,debug:()=>N.map(r=>[Math.round(r.e),Math.round(r.n),+r.u.toFixed(1),r.model?1:0]),setVisible(r){ke=r;for(const f of N)f.model&&(f.model.show=r);for(const f of le)f.model&&(f.model.show=r);for(const f of Q)f.model&&(f.model.show=r);for(const f of p)f.rig.setVisible(r);A.setVisible(r),R.setVisible(r)},update(r){if(!ke)return;const f=Math.min(.08,Math.max(.001,r));ye+=f,R.update(ye);for(const b of p){const l=(ye+b.faseOffset)%24,P=l<10?"green":l<12?"yellow":"red",F=l>=12&&l<22?"green":l>=22?"yellow":"red";P!==b.nsEstado&&(b.nsEstado=P,b.rig.ns.setState(P)),F!==b.ewEstado&&(b.ewEstado=F,b.rig.ew.setState(F))}for(let b=0;b<N.length;b++){const l=N[b];if(!l.model)continue;let P=0,F=-1e9;for(let S=-4;S<=4;S++){const q=S*.13,G=l.th+q,J=l.e+Math.cos(G)*9,X=l.n+Math.sin(G)*9,ie=C(J,X);if(ie<1.1||C(l.e+Math.cos(G)*4.5,l.n+Math.sin(G)*4.5)<.9)continue;const _e=T(J,X,G);if(_e<-1e4)continue;const Oe=C(J+Math.sin(G)*2.5,X-Math.cos(G)*2.5),st=C(J-Math.sin(G)*2.5,X+Math.cos(G)*2.5),Me=-Math.abs(Math.min(ie,6)-ko)-Math.abs(q)*1.6+(st>=Oe?.6:0)+_e;Me>F&&(F=Me,P=q)}if(F<-1e8||Math.hypot(l.e+180,l.n-250)>580){te(l),l.u=k(l.e,l.n),Ie(l);continue}const W=Math.cos(l.th),j=Math.sin(l.th);let D=1;const K=l.tipo==="sitp_azul"||l.tipo==="sitp_amarillo",se=K?9.5:6.4,i=K?16.5:12.5;for(let S=0;S<N.length;S++){if(S===b||!N[S].model)continue;const q=N[S],G=q.e-l.e,J=q.n-l.n,X=G*G+J*J;if(X>320)continue;const ie=q.tipo==="sitp_azul"||q.tipo==="sitp_amarillo",oe=se+(ie?3:0),_e=i+(ie?3:0),Oe=G*W+J*j,st=Math.abs(-G*j+J*W);if(Oe>0&&Oe<_e&&st<2.45){const Me=Oe<oe?0:(Oe-oe)/(_e-oe);Me<D&&(D=Me)}else X<(K||ie?42:22)&&S<b&&(D=0)}const g=Math.abs(W)>Math.abs(j);for(const S of p){if((g?S.ewEstado:S.nsEstado)==="green")continue;const G=S.e-l.e,J=S.n-l.n,X=G*W+J*j,ie=Math.abs(-G*j+J*W);if(X>7&&X<21&&ie<9){const oe=X<10.5?0:(X-10.5)/10.5;oe<D&&(D=oe)}}const B=1-Math.min(.55,Math.abs(P)*1.4),I=l.v*B*D;if(l.vActual+=(I-l.vActual)*Math.min(1,f*4.5),l.vActual>.05){l.th+=Math.max(-1.4*f,Math.min(1.4*f,P));const S=l.e+Math.cos(l.th)*l.vActual*f,q=l.n+Math.sin(l.th)*l.vActual*f;C(S,q)>=.7?(l.e=S,l.n=q):l.th+=.6;const G=Math.max(k(l.e,l.n),k(l.e+Math.cos(l.th)*1.4,l.n+Math.sin(l.th)*1.4),k(l.e-Math.cos(l.th)*1.4,l.n-Math.sin(l.th)*1.4));l.u+=(G-l.u)*Math.min(1,f*8)}Ie(l)}for(const b of Q){if(!b.model)continue;const l=b.e+Math.cos(b.th)*b.v*f,P=b.n+Math.sin(b.th)*b.v*f;Ge(l,P)&&Math.hypot(l+180,P-250)<430?(b.e=l,b.n=P,b.u+=(k(b.e,b.n)+.16-b.u)*Math.min(1,f*4)):b.th+=.9+M()*1.2,Ie(b,0)}}}}async function Mo(e,o){try{const t=new Image;t.decoding="async",t.src=e,await t.decode();const a=document.createElement("canvas");a.width=t.naturalWidth,a.height=t.naturalHeight;const n=a.getContext("2d");n.drawImage(t,0,0);const s=n.getImageData(0,0,a.width,a.height);return new tt({typedArray:new Uint8Array(s.data.buffer),width:a.width,height:a.height,repeat:!0,minificationFilter:_t.LINEAR_MIPMAP_LINEAR,magnificationFilter:It.LINEAR})}catch{return new tt({typedArray:new Uint8Array([...o,255]),width:1,height:1})}}function Xa(e,o){return new Xe({uniforms:{uNight:{type:_.FLOAT,value:0},uHl:{type:_.FLOAT,value:0},uLadrillo:{type:_.SAMPLER_2D,value:e},uTeja:{type:_.SAMPLER_2D,value:o}},varyings:{vRP:he.VEC3,vRN:he.VEC3},vertexShaderText:`
      void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        vRP = vsInput.attributes.positionMC;
        vRN = vsInput.attributes.normalMC;
      }
    `,fragmentShaderText:`
      float rh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float rn(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(rh(i), rh(i + vec2(1.0, 0.0)), f.x), mix(rh(i + vec2(0.0, 1.0)), rh(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      // foto del material: se conserva su dibujo y parte de su color, llevada al tono real del hotel
      vec3 foto(sampler2D t, vec2 uv, vec3 tono, float croma) {
        vec3 c = czm_srgbToLinear(texture(t, uv).rgb);
        vec3 m = czm_srgbToLinear(textureLod(t, uv, 9.0).rgb);
        float lum = dot(c, vec3(0.3333)) / max(dot(m, vec3(0.3333)), 0.01);
        vec3 tinte = c / max(m, vec3(0.01));
        return tono * mix(vec3(lum), tinte, croma);
      }
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec4 c = fsInput.attributes.color_0;
        float cat = floor(c.a * 255.0 + 0.5);
        vec3 col = czm_srgbToLinear(c.rgb);
        float rough = 0.85;
        vec3 spec = vec3(0.04);
        vec3 n = normalize(vRN);
        float vertical = 1.0 - smoothstep(0.3, 0.7, abs(n.y));
        float big = rn(vRP.xz * 0.12 + vRP.y * 0.2);

        if (cat < 20.0) {
          // fachada: ladrillo a la vista real (foto), con variación de tono por paños
          float along = abs(n.x) > abs(n.z) ? vRP.z : vRP.x;
          // ladrillo real del hotel: la foto tal cual, a escala (≈5 piezas de 25 cm por 1,3 m)
          vec3 ladr = czm_srgbToLinear(texture(uLadrillo, vec2(along, vRP.y) / 1.28).rgb);
          ladr *= 0.9 + 0.18 * big;   // paños un poco más tostados o claros, como en la obra
          // coronación del muro cortado (planta): pañete claro
          col = mix(vec3(0.62, 0.60, 0.55), ladr, vertical);
          rough = 0.9;
        } else if (cat < 40.0) {
          col = vec3(0.50, 0.49, 0.46) * (0.92 + 0.14 * rn(vRP.xz * 1.2));     // losas: concreto pulido
          rough = 0.7;
        } else if (cat < 60.0) {
          // cubierta: teja de barro real (foto), con las hiladas siguiendo la pendiente
          vec2 baja = length(n.xz) > 0.05 ? normalize(n.xz) : vec2(0.0, 1.0);
          vec2 uv = vec2(dot(vRP.xz, vec2(-baja.y, baja.x)), dot(vRP.xz, baja) / max(abs(n.y), 0.35));
          col = foto(uTeja, uv / 0.75, vec3(0.30, 0.11, 0.055), 0.85) * (0.82 + 0.3 * big);
          // traslapo: cada hilada proyecta sombra sobre la siguiente
          float hil = fract(uv.y / 0.38);
          col *= 0.68 + 0.32 * smoothstep(0.0, 0.35, hil);
          float canalT = abs(fract(uv.x / 0.24) - 0.5) * 2.0;
          col *= 0.84 + 0.16 * (1.0 - canalT * canalT);
          rough = 0.88;
        } else if (cat > 71.0 && cat < 74.0) {
          // perfilería de ventanas: aluminio negro mate
          col = vec3(0.018, 0.018, 0.02);
          rough = 0.45; spec = vec3(0.25);
        } else if (cat < 80.0 || (cat > 100.0 && cat < 120.0)) {
          // vidrio: reflejo del cielo, de las fachadas de enfrente y del interior, con Fresnel real
          vec3 v = normalize(-fsInput.attributes.positionEC);
          vec3 nE = normalize(material.normalEC);
          float cosT = clamp(abs(dot(nE, v)), 0.0, 1.0);
          float fres = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);
          // dirección reflejada en coordenadas del mundo (y = arriba en el modelo)
          vec3 rEC = reflect(-v, nE);
          vec3 rW = normalize((czm_inverseViewRotation * rEC));
          vec3 up = normalize(czm_inverseViewRotation * (czm_view * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
          float alt = dot(rW, normalize(czm_viewerPositionWC));
          // cielo: horizonte claro, cenit azul, nubes suaves
          vec3 cielo = mix(vec3(0.78, 0.83, 0.88), vec3(0.36, 0.52, 0.74), smoothstep(0.0, 0.6, alt));
          float nube = smoothstep(0.55, 0.85, rn(rW.xz / max(alt, 0.08) * 1.6));
          cielo = mix(cielo, vec3(0.92), nube * 0.45 * smoothstep(0.02, 0.3, alt));
          // bajo el horizonte se refleja la ciudad: bandas oscuras de fachadas con ventanas
          float banda = step(0.5, rn(vec2(floor(atan(rW.z, rW.x) * 24.0), 3.0)));
          vec3 ciudad = mix(vec3(0.16, 0.15, 0.15), vec3(0.34, 0.30, 0.27), banda) * (0.8 + 0.4 * rn(floor(vRP.xy * 3.0)));
          vec3 refl = alt > 0.0 ? cielo : mix(ciudad, vec3(0.22, 0.24, 0.24), smoothstep(-0.05, -0.4, alt));
          refl = mix(refl, vec3(0.03, 0.04, 0.07), uNight);
          // interior: penumbra con cortinas claras al fondo
          vec3 interior = mix(vec3(0.035, 0.04, 0.045), vec3(0.20, 0.18, 0.15), rn(floor(vRP.xz * 0.9) + floor(vRP.y / 3.0)) * 0.6);
          interior += vec3(1.0, 0.72, 0.42) * uNight * step(0.45, rn(floor(vRP.xz * 0.7) + floor(vRP.y / 3.0) * 7.0)) * 0.9;
          // leve ondulación del vidrio flotado (los reflejos no son perfectamente planos)
          float onda = (rn(vec2(vRP.y * 2.0, vRP.x + vRP.z)) - 0.5) * 0.06;
          col = mix(interior, refl * (1.0 + onda), clamp(fres + 0.22, 0.0, 1.0));
          rough = 0.02;
          spec = vec3(0.9);
          material.emissive = vec3(0.0);
          material.diffuse = col * 0.35;
          material.roughness = rough;
          material.specular = spec;
          material.emissive = col * 0.65;
          return;
        } else if (cat < 100.0) {
          col = vec3(0.20, 0.11, 0.06) * (0.85 + 0.3 * rn(vec2(vRP.y * 14.0, vRP.x + vRP.z)));  // puertas: madera
          rough = 0.6;
        } else if (cat < 140.0) {
          col = vec3(0.045, 0.047, 0.05);                         // montantes: aluminio anodizado oscuro
          rough = 0.35; spec = vec3(0.35);
        } else if (cat < 160.0) {
          col = vec3(0.028, 0.028, 0.03);                         // barandas: hierro forjado negro, satinado
          rough = 0.3; spec = vec3(0.45);
        } else if (cat > 235.0 && cat < 245.0) {
          // matera de barro cocido, con manchas de humedad
          col = vec3(0.30, 0.12, 0.06) * (0.82 + 0.3 * rn(vRP.xz * 6.0 + vRP.y * 4.0)) * (0.85 + 0.15 * smoothstep(0.0, 0.25, fract(vRP.y)));
          rough = 0.92;
        } else if (cat > 245.0) {
          // hojas: tres tonos de verde con variación por hoja y algo de luz que las atraviesa
          col = czm_srgbToLinear(c.rgb) * (0.75 + 0.5 * rn(floor(vRP.xz * 18.0) + vRP.y * 11.0));
          rough = 0.6;
          spec = vec3(0.06);
          material.diffuse = col * mix(1.0, 0.35, uNight);
          material.roughness = rough;
          material.specular = spec;
          material.emissive = col * 0.28 * (1.0 - uNight);
          
          return;
        } else {
          col = vec3(0.52, 0.50, 0.47) * (0.92 + 0.14 * rn(vRP.xz * 1.5 + vRP.y)); // columnas, escaleras y vigas: concreto
        }
        material.diffuse = col * mix(1.0, 0.4, uNight);
        material.roughness = rough;
        material.specular = spec;
        material.emissive = col * 0.14 * (1.0 - uNight) + vec3(0.95, 0.70, 0.32) * uHl * 0.20;
        material.diffuse *= 1.0 + 0.12 * uHl;
      }
    `})}async function $a(e,o){const t=Ve.secciones;let a;try{a=await fetch(t+"revit.json").then(v=>v.json())}catch{return null}const[n,s]=await Promise.all([Mo(t+"tex_ladrillo_hlf.webp",[190,112,74]),Mo(t+"tex_teja.webp",[90,52,28])]),c=Xa(n,s),h=[];for(const v of a.niveles)try{const y=await ht.fromGltfAsync({url:t+v.file,modelMatrix:o,upAxis:Ee.Y,forwardAxis:Ee.X,shadows:be.ENABLED,backFaceCulling:!1,show:!1});y.customShader=c,y.imageBasedLighting.imageBasedLightingFactor=new ze(.45,.25),e.scene.primitives.add(y),h.push({...v,model:y,off:0,shown:!1,anim:null})}catch(y){console.warn("Nivel de Revit no cargado",v.file,y)}if(!h.length)return null;const d=new $,u=v=>{const y=$.fromTranslation(new x(0,0,v.off),d);v.model.modelMatrix=$.multiply(o,y,new $),v.model.show=v.shown},m=v=>1-Math.pow(1-v,3),w=9;let C=!1;const k={niveles:h.map(v=>({i:v.i,nombre:v.nombre})),caja:a.caja,bloques:a.bloques??[],huella:a.huella??[],ready:!0,visible:!1,abierto:-1,play(){k.visible=!0,k.abierto=-1;for(const v of h)v.off=0,v.shown=!0,v.anim=null,u(v)},openAt(v){k.visible=!0,k.abierto=v;const y=performance.now();let H=0;for(const p of[...h].reverse())if(p.i>v){const A=22+(p.i-v)*7.5;p.shown=!0,u(p),p.anim={o0:p.off,o1:A,start:y+H++*70,dur:900,hideAtEnd:!0}}for(const p of h)p.i<=v&&(p.shown=!0,p.off!==0&&(p.anim={o0:p.off,o1:0,start:y,dur:600}),u(p))},full(){k.visible=!0,k.abierto=-1,C=!1;const v=performance.now();let y=0;for(const H of h)H.shown=!0,H.off!==0?H.anim={o0:H.off,o1:0,start:v+y++*60,dur:800}:u(H)},hide(){k.visible=!1,k.abierto=-1;for(const v of h)v.anim=null,v.off=0,v.shown=!1,u(v)},setNight(v){c.setUniform("uNight",v)},setHighlight(v){c.setUniform("uHl",v)},get explotado(){return C},explode(){k.visible=!0,k.abierto=-1,C=!0;const v=performance.now();for(const y of h)y.shown=!0,u(y),y.anim={o0:y.off,o1:y.i*w,start:v+y.i*110,dur:1300}},nivelDe(v){return h.find(y=>y.model===v)?.i??-1},marcarNivel(v){for(const y of h)y.model.color=y.i===v?U.fromCssColorString("#E8B44A"):U.WHITE,y.model.colorBlendMode=ft.MIX,y.model.colorBlendAmount=y.i===v?.35:0},update(v,y){if(k.visible)for(const H of h){const p=H.anim;if(!p||y<p.start)continue;const A=Math.min(1,(y-p.start)/p.dur),R=m(A);H.off=p.o0+(p.o1-p.o0)*R,A>=1&&(p.hideAtEnd&&(H.shown=!1),H.anim=null),u(H)}}};return k}function Za(e,o){const t=document.createElement("style");t.textContent=`
    .pisos { position: fixed; left: 20px; top: 318px; z-index: 6; width: 244px; padding: 12px 10px 10px; border-radius: 14px;
      background: rgba(12,16,22,.72); border: 1px solid rgba(255,255,255,.13); backdrop-filter: blur(18px) saturate(140%);
      -webkit-backdrop-filter: blur(18px) saturate(140%); color: #eef2f7; font-family: ui-sans-serif,-apple-system,"Segoe UI",Inter,system-ui,sans-serif;
      display: grid; gap: 3px; }
    .pisos[hidden] { display: none; }
    .pisos button { all: unset; box-sizing: border-box; width: 100%; padding: 8px 10px; border-radius: 9px; font-size: 12.5px; cursor: pointer;
      display: flex; justify-content: space-between; color: rgba(238,242,247,.72); }
    .pisos button:hover { background: rgba(255,255,255,.08); color: #eef2f7; }
    .pisos button.on { background: #e8eef6; color: #0a0e14; font-weight: 600; }
    .pisos button span { opacity: .6; font-variant-numeric: tabular-nums; }
    @media (max-width: 720px) { .pisos { top: auto; bottom: 250px; left: 12px; right: 12px; width: auto; grid-template-columns: repeat(4, 1fr); }
      .pisos button span { display: none; } }
  `,document.head.appendChild(t);const a=document.createElement("aside");a.className="pisos",a.hidden=!0,a.innerHTML="";const n=new Map,s=(h,d,u)=>{const m=document.createElement("button");m.innerHTML=`${d}<span>${u}</span>`,m.addEventListener("click",()=>o(h)),n.set(h,m),a.appendChild(m)};s(-1,"Edificio completo",""),s(1,"Piso 2","N2"),document.body.appendChild(a);const c=h=>n.forEach((d,u)=>d.classList.toggle("on",u===h));return c(-1),{show:h=>{a.hidden=!h},mark:c}}const St={dia:{sunIntensity:5.75,sunColor:"#ffe3c4",shadowDarkness:.38,aoIntensity:4,skyFill:.22,groundFill:.12,exposure:1.08,contrast:.39,saturation:.52,tintColor:"#dedede",vignette:.5,bloomBrightness:-.8,skyZenith:"#74777b",skyHorizon:"#c2c2d1",cloudDensity:.85,cloudSpeed:1,hazeAmount:0,hazeStart:2500},tarde:{sunIntensity:5.75,sunColor:"#ffe3c4",shadowDarkness:.38,aoIntensity:4,skyFill:.22,groundFill:.12,exposure:1.08,contrast:.39,saturation:.52,tintColor:"#dedede",vignette:.5,bloomBrightness:-.8,skyZenith:"#74777b",skyHorizon:"#c2c2d1",cloudDensity:.85,cloudSpeed:1,hazeAmount:0,hazeStart:2500},noche:{sunIntensity:.6,sunColor:"#6b8fd4",shadowDarkness:.85,aoIntensity:2.7,skyFill:.38,groundFill:.1,exposure:1.08,contrast:.41,saturation:.5,tintColor:"#bec7d5",vignette:.05,bloomBrightness:-.6,skyZenith:"#040611",skyHorizon:"#0a0f1f",cloudDensity:.24,cloudSpeed:.8,hazeAmount:.33,hazeStart:450}};function Wt(e){const o=/^#?([0-9a-f]{6})$/i.exec(e.trim());if(!o)return[1,1,1];const t=parseInt(o[1],16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}const Ka=[{title:"Sol y Sombras",items:[{key:"sunIntensity",label:"Intensidad sol",min:.2,max:6,step:.05,type:"range"},{key:"sunColor",label:"Color sol",type:"color"},{key:"shadowDarkness",label:"Luz en sombra",min:.05,max:.85,step:.01,type:"range"},{key:"aoIntensity",label:"Oclusión (AO)",min:0,max:4,step:.05,type:"range"},{key:"skyFill",label:"Relleno fachadas",min:0,max:.6,step:.01,type:"range"},{key:"groundFill",label:"Relleno suelo",min:0,max:.4,step:.01,type:"range"}]},{title:"Color y Cámara",items:[{key:"exposure",label:"Exposición",min:.6,max:1.6,step:.02,type:"range"},{key:"contrast",label:"Contraste",min:0,max:.6,step:.01,type:"range"},{key:"saturation",label:"Saturación",min:.4,max:1.6,step:.02,type:"range"},{key:"tintColor",label:"Tinte color",type:"color"},{key:"vignette",label:"Viñeta",min:0,max:.5,step:.01,type:"range"},{key:"bloomBrightness",label:"Bloom",min:-.8,max:.2,step:.02,type:"range"}]},{title:"Cielo, Nubes y Neblina",items:[{key:"skyZenith",label:"Cielo cenit",type:"color"},{key:"skyHorizon",label:"Cielo horizonte",type:"color"},{key:"cloudDensity",label:"Densidad nubes",min:0,max:1,step:.02,type:"range"},{key:"cloudSpeed",label:"Velocidad nubes",min:0,max:3,step:.05,type:"range"},{key:"hazeAmount",label:"Neblina",min:0,max:.5,step:.01,type:"range"},{key:"hazeStart",label:"Inicio neblina (m)",min:200,max:2500,step:50,type:"range"}]}];function Ja(e){const o={dia:{...St.dia},tarde:{...St.tarde},noche:{...St.noche}};let t="dia";const a=document.createElement("button");a.id="btnLookStudio",a.className="look-toggle",a.textContent="⚙ Ajustar luz",a.title="Abrir editor de iluminación y color (L)",document.body.appendChild(a);const n=document.createElement("aside");n.id="lookPanel",n.className="look-panel",n.hidden=!0,n.innerHTML=`
    <div class="lp-head">
      <div>
        <small>Editor de escena</small>
        <strong id="lpPresetName">Día · 10:10</strong>
      </div>
      <button id="lpClose" aria-label="Cerrar">×</button>
    </div>
    <div class="lp-body" id="lpBody"></div>
    <div class="lp-foot">
      <button id="lpCopy" class="lp-primary">Copiar JSON</button>
      <button id="lpReset">Restablecer</button>
    </div>
  `,document.body.appendChild(n);const s=n.querySelector("#lpBody"),c=new Map;for(const w of Ka){const C=document.createElement("section");C.className="lp-sec";const k=document.createElement("h4");k.textContent=w.title,C.appendChild(k);for(const v of w.items){const y=document.createElement("label");y.className="lp-row";const H=document.createElement("span");H.className="lp-lbl",H.textContent=v.label,y.appendChild(H);const p=document.createElement("input");p.type=v.type,v.type==="range"&&(p.min=String(v.min),p.max=String(v.max),p.step=String(v.step));const A=v.type==="range"?document.createElement("span"):void 0;A&&(A.className="lp-val"),p.addEventListener("input",()=>{const M=o[t];if(v.type==="range"){const T=parseFloat(p.value);M[v.key]=T,A&&(A.textContent=v.step&&v.step>=1?String(Math.round(T)):T.toFixed(2))}else M[v.key]=p.value;e(t,M)});const R=document.createElement("div");R.className="lp-ctrl",R.appendChild(p),A&&R.appendChild(A),y.appendChild(R),C.appendChild(y),c.set(v.key,{input:p,val:A})}s.appendChild(C)}const h={dia:"Día · 10:10",tarde:"Tarde · 16:50",noche:"Noche · 19:35"};function d(){const w=o[t],C=n.querySelector("#lpPresetName");C&&(C.textContent=h[t]);for(const[k,{input:v,val:y}]of c){const H=w[k];if(v.value=String(H),y&&typeof H=="number"){const p=parseFloat(v.step||"0.01");y.textContent=p>=1?String(Math.round(H)):H.toFixed(2)}}}const u=()=>{n.hidden=!n.hidden,a.classList.toggle("on",!n.hidden)};a.addEventListener("click",u),n.querySelector("#lpClose")?.addEventListener("click",u);const m=n.querySelector("#lpCopy");return m.addEventListener("click",async()=>{const w=JSON.stringify({active:t,presets:o},null,2);try{await navigator.clipboard.writeText(w),m.textContent="¡JSON copiado!",setTimeout(()=>m.textContent="Copiar JSON",1800)}catch{prompt("Copia este JSON:",w)}}),n.querySelector("#lpReset")?.addEventListener("click",()=>{o[t]={...St[t]},d(),e(t,o[t])}),addEventListener("keydown",w=>{w.code==="KeyL"&&!w.ctrlKey&&!w.metaKey&&!w.altKey&&u()}),d(),{setActivePreset(w){t=w,d()},getPreset(w){return o[w]},toggle:u}}const Qa={planos:{nombre:"Planos finales",o:{exposure:1.06,contrast:.18,saturation:1.08,tintColor:"#fff8f0",vignette:.1,shadowDarkness:.36,bloomBrightness:-.65,skyFill:.34,groundFill:.18,skyZenith:"#5f86b3",skyHorizon:"#d9dee0",hazeAmount:.06,hazeStart:600},sol:1},natural:{nombre:"Natural",o:{exposure:1.04,contrast:.2,saturation:1.05,tintColor:"#ffffff",vignette:.18,shadowDarkness:.45,bloomBrightness:-.6}},calido:{nombre:"Cálido",o:{exposure:1.06,contrast:.24,saturation:1.14,tintColor:"#fff0dc",vignette:.25,shadowDarkness:.42,bloomBrightness:-.5},sol:1.05},claro:{nombre:"Render claro",o:{exposure:1.16,contrast:.1,saturation:.96,tintColor:"#fbfcff",vignette:.08,shadowDarkness:.28,bloomBrightness:-.7}},cine:{nombre:"Cinematográfico",o:{exposure:.98,contrast:.42,saturation:.86,tintColor:"#f3ece3",vignette:.55,shadowDarkness:.5,bloomBrightness:-.45}},dramatico:{nombre:"Dramático",o:{exposure:.94,contrast:.55,saturation:1.1,tintColor:"#fff6ec",vignette:.62,shadowDarkness:.62,bloomBrightness:-.4},sol:1.12}};function ei(e,o,t){if(o==="panel")return e;const a=Qa[o],n={...e,...a.o};return n.exposure=e.exposure+((a.o.exposure??e.exposure)-e.exposure)*(1-t),n.sunIntensity=e.sunIntensity*(a.sol??1),n}const To=4.7*Math.PI/180,ti="2026-11-16",So=-18.6*Math.PI/180,Wo=11.68;function oi(e){const o=(e-Wo)*15*Math.PI/180,t=Math.sin(To)*Math.sin(So)+Math.cos(To)*Math.cos(So)*Math.cos(o);return Math.asin(t)*180/Math.PI}const Eo=(e,o,t)=>{const a=Math.max(0,Math.min(1,(t-e)/(o-e)));return a*a*(3-2*a)},zo=e=>[1,3,5].map(o=>parseInt(e.slice(o,o+2),16)),ai=e=>"#"+e.map(o=>Math.round(Math.max(0,Math.min(255,o))).toString(16).padStart(2,"0")).join(""),dt=(e,o,t)=>{const a=zo(e),n=zo(o);return ai(a.map((s,c)=>s+(n[c]-s)*t))};function Ao(e,o,t){const a={...e};for(const n of Object.keys(e)){const s=e[n],c=o[n];a[n]=typeof s=="number"&&typeof c=="number"?s+(c-s)*t:typeof s=="string"&&typeof c=="string"&&s.startsWith("#")?dt(s,c,t):t<.5?s:c}return a}function ii(e,o,t,a,n){const s=oi(e),c=Eo(2,-7,s),h=Eo(26,6,s)*(1-c);let d=Ao(t,a,h);d=Ao(d,n,c),e<Wo&&(d={...d,sunColor:dt(d.sunColor,"#fff1e2",.35*(1-c))});const u=o==="nublado"?1:o==="lluvia"?1.35:0;if(u){const k=Math.min(1,u);d={...d,sunIntensity:d.sunIntensity*(1-.68*k-(o==="lluvia"?.12:0)),shadowDarkness:d.shadowDarkness*(1-.6*k),cloudDensity:Math.max(d.cloudDensity,o==="lluvia"?1:.96),saturation:d.saturation*(1-.22*k),exposure:d.exposure*(1-(o==="lluvia"?.14:.06)),contrast:d.contrast*(1-.35*k),skyZenith:dt(d.skyZenith,o==="lluvia"?"#5d636a":"#8a9097",.85*(1-c)),skyHorizon:dt(d.skyHorizon,o==="lluvia"?"#868c93":"#b3b7bd",.85*(1-c)),sunColor:dt(d.sunColor,"#dfe4ea",.6*k),hazeAmount:d.hazeAmount+(o==="lluvia"?.22:.1),hazeStart:d.hazeStart*(o==="lluvia"?.45:.7),bloomBrightness:d.bloomBrightness-.2}}const m=Math.floor(e),w=Math.floor((e-m)*60),C=Uo.fromIso8601(`${ti}T${String(m).padStart(2,"0")}:${String(w).padStart(2,"0")}:00-05:00`);return{look:d,night:c,tarde:h,fecha:C,lluvia:o==="lluvia"?1:0,etiqueta:`${String(m).padStart(2,"0")}:${String(w).padStart(2,"0")}`}}function ni(){return new Qt({name:"hlf_lluvia",uniforms:{uRain:0,uTime:0},fragmentShader:`
      uniform sampler2D colorTexture;
      uniform float uRain;
      uniform float uTime;
      in vec2 v_textureCoordinates;
      float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
      float capa(vec2 uv, float esc, float vel, float sem) {
        vec2 p = uv * vec2(esc, esc * 0.18);
        p.x += p.y * 0.12;                      // viento
        p.y += uTime * vel;
        float col = floor(p.x);
        float r = h11(col + sem);
        float y = fract(p.y + r * 7.0);
        float gota = smoothstep(0.0, 0.05, y) * (1.0 - smoothstep(0.05, 0.42, y));
        float ancho = 1.0 - smoothstep(0.0, 0.07, abs(fract(p.x) - 0.5));
        return gota * ancho * step(0.55, r);
      }
      void main() {
        vec4 c = texture(colorTexture, v_textureCoordinates);
        if (uRain <= 0.0) { out_FragColor = c; return; }
        vec2 uv = v_textureCoordinates;
        float v = capa(uv, 220.0, 1.6, 1.0) * 0.55 + capa(uv, 140.0, 1.2, 9.0) * 0.4 + capa(uv, 90.0, 0.9, 17.0) * 0.3;
        vec3 col = c.rgb * mix(1.0, 0.86, uRain);
        col = mix(col, vec3(0.80, 0.84, 0.88), clamp(v * 0.45 * uRain, 0.0, 0.45));
        out_FragColor = vec4(col, c.a);
      }
    `})}function si(e){const o=document.createElement("style");o.textContent=`
    .tiempo { position: fixed; left: 50%; transform: translateX(-50%); bottom: 82px; z-index: 6; display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; border-radius: 14px; background: rgba(12,16,22,.62); border: 1px solid rgba(255,255,255,.13);
      backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); color: #eef2f7;
      font: 500 12px ui-sans-serif,-apple-system,"Segoe UI",Inter,system-ui,sans-serif; width: auto; }
    .tiempo .lbl { color: rgba(238,242,247,.6); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; padding-left: 4px; }
    .tiempo button { all: unset; cursor: pointer; padding: 6px 10px; border-radius: 9px; color: rgba(238,242,247,.75); white-space: nowrap; }
    .tiempo button:hover { background: rgba(255,255,255,.08); color: #fff; }
    .tiempo button.on { background: #e8eef6; color: #0a0e14; font-weight: 600; }
    .tiempo .play { width: 26px; text-align: center; font-size: 13px; }
    .tiempo input[type=range] { flex: 1; min-width: 80px; accent-color: #f2c48a; }
    .tiempo .h { font-variant-numeric: tabular-nums; min-width: 40px; text-align: right; font-weight: 600; }
    .tiempo select { background: rgba(255,255,255,.08); color: #eef2f7; border: 1px solid rgba(255,255,255,.16); border-radius: 9px; padding: 5px 8px; font: inherit; }
    .tiempo select option { color: #111; }
    .tiempo .sep { width: 1px; height: 18px; background: rgba(255,255,255,.14); }
    @media (max-width: 720px) { .tiempo { bottom: 74px; flex-wrap: wrap; } }
  `,document.head.appendChild(o);const t=document.createElement("div");t.className="tiempo",t.innerHTML=`
    <span class="lbl">Filtro</span>
    <select aria-label="Filtro de imagen" title="Filtro de imagen">
      <option value="planos" selected>Planos finales</option>
      <option value="natural">Natural</option>
      <option value="calido">Cálido</option>
      <option value="claro">Render claro</option>
      <option value="cine">Cinematográfico</option>
      <option value="dramatico">Dramático</option>
      <option value="panel">Ajuste manual</option>
    </select>`,document.body.appendChild(t);const a=t.querySelector("input")??document.createElement("input"),n=t.querySelector(".h")??document.createElement("span"),s=t.querySelector(".play")??document.createElement("button"),c=t.querySelector("select");c.addEventListener("change",()=>e.onFiltro(c.value)),a.value=String(e.hora),a.addEventListener("input",()=>e.onHora(Number(a.value)));let h=!0;return s.addEventListener("click",()=>{h=!h,s.textContent=h?"❚❚":"▶",e.onPlay(h)}),t.querySelectorAll("[data-clima]").forEach(d=>d.addEventListener("click",()=>{t.querySelectorAll("[data-clima]").forEach(u=>u.classList.toggle("on",u===d)),e.onClima(d.dataset.clima)})),{setHora(d,u){document.activeElement!==a&&(a.value=String(d)),n.textContent=u},setPlay(d){h=d,s.textContent=d?"❚❚":"▶"}}}const ri=[{id:"hotel",label:"HOTEL LA FONTANA",category:"PROYECTO PRINCIPAL",enu:[-210,352,26],camera:{heading:.55,pitch:-.42,range:240,dur:2}},{id:"piso2",label:"REMODELACIÓN PISO 2",category:"INTERVENCIÓN BIM",enu:[-256,320,12],camera:{heading:.19,pitch:-1.55,range:68,dur:2}},{id:"plazoleta",label:"PLAZOLETA DE LA FUENTE",category:"ESPACIO PÚBLICO",enu:[-232,328,5],camera:{heading:.45,pitch:-.28,range:110,dur:1.8}},{id:"clinica127",label:"CLÍNICA 127 COLSUBSIDIO",category:"TORRE CORPORATIVA",enu:[-325,207,40],camera:{heading:.85,pitch:-.32,range:160,dur:2}},{id:"torres",label:"TORRES SANTA BÁRBARA",category:"RESIDENCIAL",enu:[-320,395,45],camera:{heading:.35,pitch:-.35,range:210,dur:2}},{id:"metro127",label:"METRO 127 · SONESTA",category:"HOTEL Y COMERCIO",enu:[-195,145,28],camera:{heading:1.25,pitch:-.34,range:190,dur:2}},{id:"panpaya",label:"PAN PA' YA · OLÍMPICA",category:"ZONA COMERCIAL",enu:[-84,300,16],camera:{heading:2.45,pitch:-.3,range:140,dur:2}},{id:"unicentro",label:"UNICENTRO BOGOTÁ",category:"CENTRO COMERCIAL",enu:[10,0,20],camera:{heading:.65,pitch:-.45,range:420,dur:2.2}}];function li(e,o){const t=document.createElement("div");t.className="mp-pins-overlay",e.container.appendChild(t);const a=ri.map(d=>{const u=document.createElement("div");u.className="mp-pin",u.innerHTML=`
      <div class="mp-pin-card">
        <span class="mp-pin-flag"></span>
        <div class="mp-pin-content">
          ${d.category?`<span class="mp-pin-cat">${d.category}</span>`:""}
          <strong class="mp-pin-title">${d.label}</strong>
        </div>
      </div>
      <div class="mp-pin-line"></div>
      <div class="mp-pin-anchor"></div>
    `,u.addEventListener("click",w=>{w.stopPropagation(),o&&o(d)}),t.appendChild(u);const m=ee(d.enu[0],d.enu[1],d.enu[2]);return{pin:d,el:u,worldPos:m}});let n=!1;t.style.display="none";const s=new ze;function c(){if(!n){t.style.display="none";return}t.style.display="block";const d=e.scene,u=d.camera;for(const m of a){const w=x.subtract(m.worldPos,u.positionWC,new x);if(x.dot(w,u.directionWC)<=0){m.el.style.display="none";continue}const k=x.distance(u.positionWC,m.worldPos);if(k>3500){m.el.style.display="none";continue}const v=ma.worldToWindowCoordinates(d,m.worldPos,s);if(!v){m.el.style.display="none";continue}m.el.style.display="block",m.el.style.transform=`translate3d(${Math.round(v.x)}px, ${Math.round(v.y)}px, 0)`;const y=Math.max(.75,Math.min(1.05,1200/(k+300))),H=k>2600?Math.max(0,(3500-k)/900):1;m.el.style.opacity=H.toFixed(2),m.el.querySelector(".mp-pin-card").style.transform=`scale(${y.toFixed(2)})`}}const h=e.scene.preRender.addEventListener(c);return{container:t,get visible(){return n},setVisible(d){n=d,d||(t.style.display="none")},update:c,destroy(){h(),t.remove()}}}wa.defaultAccessToken=Ve.ionToken;const Z=e=>document.getElementById(e),Ye=Z("cesiumContainer"),yt=Z("loading"),ci=Z("loadBar"),qo=Z("loadLabel"),di=Z("loadPct");function De(e,o){qo.textContent=e;const t=Math.round(Math.max(0,Math.min(1,o))*100);ci.style.width=t+"%",di.textContent=t+"%"}const Y=new pa(Ye,{animation:!1,timeline:!1,baseLayerPicker:!1,geocoder:!1,homeButton:!1,sceneModePicker:!1,navigationHelpButton:!1,fullscreenButton:!1,infoBox:!1,selectionIndicator:!1,shadows:!0,terrainShadows:be.RECEIVE_ONLY,terrain:va.fromWorldTerrain({requestWaterMask:!1,requestVertexNormals:!0}),baseLayer:ga.fromProviderAsync(Bo.fromAssetId(Ve.imageryAssetId),{}),contextOptions:{webgl:{alpha:!1,antialias:!0,powerPreference:"high-performance",preserveDrawingBuffer:!1}},requestRenderMode:!1,useBrowserRecommendedResolution:!1}),O=Y.scene;O.globe.enableLighting=!0;O.globe.showGroundAtmosphere=!0;O.globe.depthTestAgainstTerrain=!0;O.globe.maximumScreenSpaceError=2;O.fog.enabled=!1;O.fog.density=18e-5;O.fog.minimumBrightness=.04;O.highDynamicRange=!0;O.msaaSamples=4;O.postProcessStages.fxaa.enabled=!0;O.screenSpaceCameraController.enableCollisionDetection=!1;O.light=new ya({intensity:3,color:U.fromCssColorString("#fff4e3")});const Ne=Y.shadowMap;Ne.softShadows=!0;Ne.size=4096;Ne.maximumDistance=1200;Ne.darkness=.24;Ne.normalOffset=!0;{const e=Ne;e._primitiveBias.depthBias=8e-4,e._primitiveBias.normalOffsetScale=1.6,e._primitiveBias.normalShadingSmooth=.35}const Fe=O.postProcessStages.ambientOcclusion;Fe.enabled=!0;Fe.uniforms.intensity=2.1;Fe.uniforms.bias=.08;Fe.uniforms.lengthCap=.35;Fe.uniforms.stepSize=1.4;Fe.uniforms.blurStepSize=1;const Pe=O.postProcessStages.bloom;Pe.enabled=!0;Pe.uniforms.glowOnly=!1;Pe.uniforms.contrast=128;Pe.uniforms.brightness=-.36;Pe.uniforms.delta=1;Pe.uniforms.sigma=2.6;Pe.uniforms.stepSize=1.5;const ui=eo(),qt=e=>{const o=$.getColumn(ui,e,new Qe);return new x(o.x,o.y,o.z)},we=Ia(qt(0),qt(1),qt(2));O.postProcessStages.add(we);const xe=_a();O.postProcessStages.add(xe);Y.camera.frustum.fov=wt.toRadians(48);const Po=(()=>{try{const e=O.context._gl,o=e.getExtension("WEBGL_debug_renderer_info");return o?String(e.getParameter(o.UNMASKED_RENDERER_WEBGL)):""}catch{return""}})(),fi=/Intel|UHD|Iris|Mali|Adreno|Apple GPU|SwiftShader/i.test(Po)&&!/Arc/i.test(Po);let E=null,ue=fi||matchMedia("(pointer: coarse)").matches?.5:1;function it(){const e=Math.min(window.devicePixelRatio||1,2);Y.resolutionScale=e,Ne.size=ue>=1?4096:ue>=.5?2048:1024,Ne.softShadows=ue>=.5,Fe.enabled=ue>=1,Pe.enabled=ue>=.5,O.msaaSamples=ue>=.5?4:2,Y.shadows=ue>=.5,E?.tileset&&(E.tileset.maximumScreenSpaceError=ue>=1?8:ue>=.5?12:20)}it();Y.clock.shouldAnimate=!1;Y.clock.currentTime=Uo.fromIso8601("2026-06-21T16:50:00-05:00");const L=new za(Y),Go=e=>ee(Vt[e].e,Vt[e].n,Vt[e].u);L.flyTo({pivot:ee(-255,320,12),heading:.55,pitch:-.42,range:260},0);L.groundHeight=e=>O.globe.getHeight(e);const hi=[{id:"dia",iso:"2026-06-21T16:50:00-05:00",night:.04,tarde:1,fog:22e-5,label:"10:10",sun:5.75,color:"#ffe3c4"},{id:"tarde",iso:"2026-06-21T16:50:00-05:00",night:.04,tarde:1,fog:22e-5,label:"16:50",sun:5.75,color:"#ffe3c4"},{id:"noche",iso:"2026-06-21T19:35:00-05:00",night:1,tarde:0,fog:22e-5,label:"19:35",sun:.6,color:"#6b8fd4"}];let me=.04,Ue=1;function Ht(e){O.light.intensity=e.sunIntensity,O.light.color=U.fromCssColorString(e.sunColor),Ne.darkness=e.shadowDarkness,Fe.uniforms.intensity=e.aoIntensity,Pe.uniforms.brightness=e.bloomBrightness,xe.uniforms.uExposure=e.exposure,xe.uniforms.uContrast=e.contrast,xe.uniforms.uSaturation=e.saturation;const[o,t,a]=Wt(e.tintColor);xe.uniforms.uTint=new x(o,t,a),xe.uniforms.uVignette=e.vignette;const[n,s,c]=Wt(e.skyZenith);we.uniforms.uSkyZenith=new x(n,s,c);const[h,d,u]=Wt(e.skyHorizon);we.uniforms.uSkyHorizon=new x(h,d,u),we.uniforms.uCloudDensity=e.cloudDensity,we.uniforms.uCloudSpeed=e.cloudSpeed,E?.setLook({skyFill:e.skyFill,groundFill:e.groundFill,hazeAmount:e.hazeAmount,hazeStart:e.hazeStart})}const pt=Ja((e,o)=>Ht(o));Ht(pt.getPreset("dia"));we.uniforms.uNight=me;we.uniforms.uTarde=Ue;xe.uniforms.uNight=me;xe.uniforms.uTarde=Ue;O.skyAtmosphere&&(O.skyAtmosphere.hueShift=0,O.skyAtmosphere.saturationShift=.08,O.skyAtmosphere.brightnessShift=-.04);const mi={dia:10.17,tarde:16.83,noche:19.58};let pe=10.17,ut="sol",Yo="planos",Rt=!1,Be=null,gt=-1;const to=O.postProcessStages.add(ni()),oo=si({hora:pe,onHora:e=>{pe=e,Be=null,Rt=!1,oo.setPlay(!1)},onClima:e=>{ut=e,gt=-1},onPlay:e=>{Rt=e},onFiltro:e=>{Yo=e,gt=-1}});function pi(){const e=ii(pe,ut,pt.getPreset("dia"),pt.getPreset("tarde"),pt.getPreset("noche"));Y.clock.currentTime=e.fecha,Ht(ei(e.look,Yo,e.night)),me=e.night,Ue=e.tarde,E?.setNight(me),E?.setTarde(Ue),z?.setNight(me),we.uniforms.uNight=me,we.uniforms.uTarde=Ue,xe.uniforms.uNight=me,xe.uniforms.uTarde=Ue,to.uniforms.uRain=e.lluvia,O.skyAtmosphere&&(O.skyAtmosphere.brightnessShift=-.55*me-(ut==="lluvia"?.2:ut==="nublado"?.08:0),O.skyAtmosphere.saturationShift=.06-.3*me-(ut==="sol"?0:.35));const o=Z("clockLabel");o&&(o.textContent=e.etiqueta),oo.setHora(pe,e.etiqueta);const t=me>.5?"noche":Ue>.5?"tarde":"dia";document.querySelectorAll("[data-light]").forEach(a=>a.classList.toggle("on",a.dataset.light===t))}function gi(e){Rt=!1,oo.setPlay(!1),Be={from:pe,to:mi[e.id]??pe,start:performance.now()}}document.querySelectorAll("[data-light]").forEach(e=>{e.addEventListener("click",()=>{const o=hi.find(t=>t.id===e.dataset.light);o&&gi(o)})});let Ze=!1;const Zt=Z("btnOrbit"),ao=Z("btnPedestrian"),Ce=Z("btnPiso2"),He=Z("btnEdificioCompleto");function re(){Ze=!1,Zt?.classList.remove("on")}function Nt(e=2){re(),L.isWalking&&L.exitWalk(),Ce?.classList.remove("on"),He?.classList.add("on"),ge?.mark(-1),ge?.show(!0),z?.full(),L.flyTo({pivot:ee(-255,320,12),heading:.55,pitch:-.42,range:260},e)}He?.addEventListener("click",()=>Nt(2));function Ft(e,o=2){re(),Ce?.classList.remove("on"),He?.classList.remove("on"),z&&z.abierto>=0&&(z.full(),ge?.mark(-1));const t=Ma[e];L.flyTo({pivot:Go(t.place),heading:t.heading,pitch:t.pitch,range:t.range},o)}Z("btnHome")?.addEventListener("click",()=>Ft("general",2.2));Z("btnAerial")?.addEventListener("click",()=>Ft("aerial"));Z("btnArch")?.addEventListener("click",()=>Ft("arch"));ao?.addEventListener("click",()=>{re(),Ce?.classList.remove("on"),He?.classList.remove("on"),L.isWalking?L.exitWalk():L.enterWalk(fe?Ko(fe):void 0)});L.onModeChange=e=>{ao?.classList.toggle("on",e);const o=Z("hint");o&&e&&(o.textContent="Peatonal: arrastra para mirar · WASD o flechas para caminar · Shift para correr · Doble clic para ir a un punto",o.classList.remove("fade"),setTimeout(()=>o.classList.add("fade"),7e3))};document.querySelectorAll("[data-place]").forEach(e=>{e.addEventListener("click",()=>{re();const o=e.dataset.place;if(o==="hotel"&&E){const t=E.buildings.find(a=>a.s==="Hotel");if(t){Ae(null),Ae(t);return}}L.flyTo({pivot:Go(o),range:o==="hotel"?300:520,pitch:-.5},2)})});Zt?.addEventListener("click",()=>{Ze=!Ze,Zt.classList.toggle("on",Ze),Ze&&L.isWalking&&L.exitWalk()});const Lo=li(Y,e=>{if(re(),e.id==="piso2"){Ce?.click();return}if(e.id==="hotel"&&E){const t=E.buildings.find(a=>a.s==="Hotel");if(t){Ae(null),Ae(t);return}}const o=ee(e.enu[0],e.enu[1],e.enu[2]);L.flyTo({pivot:o,heading:e.camera.heading,pitch:e.camera.pitch,range:e.camera.range},e.camera.dur??2)}),Ro=Z("btnPins");Ro?.addEventListener("click",()=>{const e=!Lo.visible;Lo.setVisible(e),Ro.classList.toggle("on",e)});Ye.addEventListener("pointerdown",re);Ye.addEventListener("wheel",re,{passive:!0});addEventListener("keydown",e=>{je!=="sitio"||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||(e.code==="Escape"&&(L.isWalking?L.exitWalk():Ae(null)),(e.code==="KeyH"||e.code==="Home")&&Ft("general",2.2),e.code==="KeyP"&&ao?.click())});let fe=null,io=null;const vi=9;let Pt=null,z=null,ge=null,Kt=!1,Io=!1,Jt=!1;async function Xo(){if(je!=="sitio"){Jt=!0;return}Io||(Io=!0,await bt(),!(!E||!z)&&(re(),yi(),E?.startBackground()))}function yi(){if(!E)return;const e=E.buildings.find(t=>t.s==="Hotel"),o=L.flyTo.bind(L);L.flyTo=()=>{};try{e?(Ae(e),Ke&&(Ke.hidden=!0)):Ot()}finally{L.flyTo=o}}let Et=null;function bt(){return Et||(Et=(async()=>{E&&(z=await $a(Y,E.matrix),z&&(z.setNight(me),E.setRevitBlocks(z.bloques,z.huella),ge=Za(z,e=>{if(z)if(re(),ge?.mark(e),Ce?.classList.toggle("on",e===1),He?.classList.toggle("on",e<0),e<0)Nt(2);else if(e===1)He?.classList.remove("on"),z.openAt(1),L.flyTo({pivot:ee(-222,278,12),heading:.1928,pitch:-1.55,range:105},2.5);else{He?.classList.remove("on"),Ce?.classList.remove("on"),z.openAt(e);const o=z.caja;L.flyTo({pivot:ee((o[0]+o[2])/2,(o[1]+o[3])/2,12),pitch:-.95,range:150},2)}}),Kt&&(Kt=!1,Ot(),Se&&(Y.entities.remove(Se),Se=null))))})(),Et)}async function $o(){if(re(),L.isWalking&&L.exitWalk(),await bt(),!z)return;E?.setRevitBlocks(z.bloques,z.huella),Ce?.classList.contains("on")&&z.abierto===1?Nt(2):(Ce?.classList.add("on"),He?.classList.remove("on"),ge?.mark(1),ge?.show(!0),z.openAt(1),L.flyTo({pivot:ee(-222,278,12),heading:.1928,pitch:-1.55,range:105},2.5))}Ce?.addEventListener("click",()=>void $o());function Ot(){!E||!z||(E.setRevitBlocks(z.bloques,z.huella),z.play(),ge?.mark(-1),ge?.show(!0))}function Zo(){E&&(Pt={start:performance.now()},E.setHotelFloors(0))}let Se=null;const Ke=Z("card");function bi(e){return ee((e.bb[0]+e.bb[2])/2,(e.bb[1]+e.bb[3])/2,e.b+e.h*.5)}function Ko(e){return ee((e.bb[0]+e.bb[2])/2,e.bb[1]-9,e.b)}function Ae(e){const o=fe?.s==="Hotel";if(fe=e,e?.s!=="Hotel"&&Ce?.classList.remove("on"),Se&&(Y.entities.remove(Se),Se=null),!e||!E){Ke&&(Ke.hidden=!0),ge?.show(!1);return}if(e.s!=="Hotel"?ge?.show(!1):z?.visible&&ge?.show(!0),e.s!=="Hotel"){const u=e.r.map(([w,C])=>ee(w,C,0,E.matrix)),m=2572+e.b-.5;Se=Y.entities.add({polygon:{hierarchy:new xa(u),height:m,extrudedHeight:m+e.h+2.2,material:U.fromCssColorString("#9dc4ea").withAlpha(.2),outline:!0,outlineColor:U.fromCssColorString("#d7ebff"),shadows:be.DISABLED}})}const t=e.s==="Hotel";t&&window.dispatchEvent(new CustomEvent("hlf:hotel")),t&&!o&&(z?(Ot(),Se&&(Y.entities.remove(Se),Se=null)):(Kt=!0,bt(),Zo()),re(),He?.classList.add("on"),Ce?.classList.remove("on"),L.flyTo({pivot:ee(-255,320,12),heading:.55,pitch:-.42,range:260},1.8));const a=t&&E?E.buildings.filter(u=>u.s==="Hotel"):[e],n=u=>Math.abs(u.r.reduce((m,w,C)=>{const k=u.r[(C+1)%u.r.length];return m+w[0]*k[1]-k[0]*w[1]},0)/2),s=a.reduce((u,m)=>u+n(m),0),c=a.reduce((u,m)=>u+n(m)*m.p,0),h=Math.max(...a.map(u=>u.p)),d=Math.max(...a.map(u=>u.h));Math.abs(e.r.reduce((u,m,w)=>{const C=e.r[(w+1)%e.r.length];return u+m[0]*C[1]-C[0]*m[1]},0)/2),Z("cardKind").textContent=t?"Proyecto":`Sector ${e.s}`,Z("cardTitle").textContent=t?"Hotel La Fontana":`Edificación ${e.id+1}`,Z("cardData").innerHTML=`<dt>Pisos</dt><dd>${t?"hasta "+h:e.p}</dd><dt>Altura</dt><dd>${d.toFixed(1)} m</dd><dt>Huella</dt><dd>${Math.round(s).toLocaleString("es-CO")} m²</dd><dt>Área aprox.</dt><dd>${Math.round(c).toLocaleString("es-CO")} m²</dd>`,Ke&&(Ke.hidden=!1)}let Je=!1,xt=-1,_o=0,zt=0,ot=0,lt=0,at=0;function xi(e){if(je!=="sitio"||!z?.visible||L.isWalking||e.buttons)return;const o=performance.now();if(o-_o<60)return;_o=o;const t=Ye.getBoundingClientRect(),a=O.pick(new ze(e.clientX-t.left,e.clientY-t.top)),n=z.nivelDe(a?.primitive);Je=n>=0,z.explotado&&n!==xt&&(xt=n,z.marcarNivel(n),window.dispatchEvent(new CustomEvent("hlf:nivel",{detail:n}))),ot=Je||z.explotado?1:0,at=Je||z.explotado?1:0,Ye.style.cursor=Je?"pointer":""}Ye.addEventListener("pointermove",xi);Ye.addEventListener("pointerleave",()=>{z?.explotado||(Je=!1,ot=0,at=0)});O.preRender.addEventListener(()=>{Math.abs(zt-ot)>.005&&(zt+=(ot-zt)*.14,z?.setHighlight(zt)),Math.abs(lt-at)>.005&&(lt+=(at-lt)*.12,E?.setAtenuado(lt<.01?0:lt))});function Jo(){if(!z)return;re(),Ae(null),z.explode(),ot=1,at=1;const e=z.caja;L.flyTo({pivot:ee((e[0]+e[2])/2,(e[1]+e[3])/2,38),heading:.55,pitch:-.3,range:330},2.2),window.dispatchEvent(new CustomEvent("hlf:explotado",{detail:z.niveles}))}function wi(){z&&(z.full(),z.marcarNivel(-1),xt=-1,ot=0,at=0,L.flyTo({pivot:et(),heading:.55,pitch:-.42,range:260},2),window.dispatchEvent(new CustomEvent("hlf:recompuesto")))}L.onPick=e=>{if(!(!E||je!=="sitio")){if(z?.explotado){xt>=0&&window.dispatchEvent(new CustomEvent("hlf:entrarNivel",{detail:xt}));return}if(Je&&z){Jo();return}Ae(e?E.buildingAt(e):null)}};Z("cardClose")?.addEventListener("click",()=>Ae(null));Z("cardFocus")?.addEventListener("click",()=>{if(!fe)return;re();const e=Math.max(fe.bb[2]-fe.bb[0],fe.bb[3]-fe.bb[1],fe.h);L.flyTo({pivot:bi(fe),pitch:-.42,range:Math.max(60,e*2.1)},1.7)});Z("cardWalk")?.addEventListener("click",()=>{fe&&(re(),L.enterWalk(Ko(fe)))});const Gt=Z("status"),Ho=Z("statusText");async function Ci(e=25e3){const o=performance.now()+e;let t=0;for(;performance.now()<o;){const a=O.globe.tilesLoaded,n=!E?.tileset||E.tileset.tilesLoaded;if(a&&n){if(t||(t=performance.now()),performance.now()-t>=600)break}else t=0;await new Promise(s=>setTimeout(s,150))}for(let a=0;a<8;a++)await new Promise(n=>requestAnimationFrame(n))}async function Qo(){De("Cargando el modelo del hotel...",.05),await new Promise(t=>setTimeout(t,30)),E=await Ba(Y,(t,a)=>De(t,.05+a*.2),(t,a,n)=>{De(`Cargando secciones (${t}/${a}) · ${n}`,.25+t/Math.max(1,a)*.45),!(!Gt||!Ho)&&(Gt.hidden=!1,Ho.textContent=t<a?`Cargando secciones ${t}/${a} · ${n}`:`Modelo completo · ${a} secciones`,t>=a&&setTimeout(()=>Gt.classList.add("fade"),2600))}),E.setNight(me),E.setTarde(Ue),bt();const e=document.querySelector("[data-light].on")?.dataset.light||"dia";Ht(pt.getPreset(e)),it(),L.flyTo({pivot:ee(-255,320,12),heading:.55,pitch:-.42,range:260},0),E.startBackground(),De("Preparando el Hotel La Fontana...",.55),await bt(),De("Hotel listo · la ciudad termina de cargar en segundo plano",.8),De("Preparando la llegada...",.85),Ya(Y,E.matrix).then(t=>{io=t}),window.__ALL__=!0,De("Renderizando...",.94),await Ci(3500),De("Listo",1),yt.classList.add("done"),setTimeout(()=>{yt.hidden=!0},900),setTimeout(()=>void Xo(),3300);const o=Z("hint");o&&setTimeout(()=>o.classList.add("fade"),9e3),window.__READY__=!0}const de={fps:0,frames:0,t0:performance.now(),low:0};window.__DBG__={Cesium:ba,viewer:Y,cam:L,getSite:()=>E,enuToWorld:ee,select:Ae,stats:de,playHotel:Zo,playRevit:Ot,getRevit:()=>z,getTrafico:()=>io,setQuality:e=>{ue=e,it()}};let je="pais",vt=null;const et=()=>ee(-255,320,12),Lt={heading:.55,pitch:-.62,range:2600};function ea(e){we.enabled=e,xe.enabled=e,to.enabled=e,e?it():(Fe.enabled=!1,Pe.enabled=!1,Y.shadows=!1,O.msaaSamples=2),O.globe.enableLighting=e}function Dt(){je="pais",L.active=!1,O.screenSpaceCameraController.enableInputs=!0,ea(!1),document.body.dataset.modo="pais"}function ki(e=2.6){Dt(),Y.camera.flyTo({destination:x.fromDegrees(-77.6,3.4,26e5),orientation:{heading:0,pitch:wt.toRadians(-82),roll:0},duration:e})}function Mi(e,o,t=18e3,a=2.4){Dt(),Y.camera.flyTo({destination:x.fromDegrees(e,o-t/16e4,t),orientation:{heading:0,pitch:wt.toRadians(-55),roll:0},duration:a})}function No(){je="sitio",ea(!0),O.screenSpaceCameraController.enableInputs=!1,L.flyTo({pivot:et(),...Lt},0),L.active=!0,L.flyTo({pivot:et(),heading:.55,pitch:-.42,range:260},3.2),document.body.dataset.modo="sitio",Jt&&(Jt=!1,setTimeout(()=>void Xo(),1200))}async function Ti(){const e=new Oo(Lt.heading,Lt.pitch,Lt.range);if(E){Y.camera.flyToBoundingSphere(new Bt(et(),1),{offset:e,duration:3,complete:No});return}Dt(),yt.hidden=!1,yt.classList.remove("done");const o=new Promise(t=>Y.camera.flyToBoundingSphere(new Bt(et(),1),{offset:e,duration:5.5,complete:()=>t(),cancel:()=>t()}));vt??(vt=Qo());try{await Promise.all([vt,o])}catch(t){console.error(t),qo.textContent="No se pudo cargar la escena. Revisa la conexión y vuelve a intentar.",vt=null;return}Y.camera.flyToBoundingSphere(new Bt(et(),1),{offset:e,duration:0}),No()}window.HLF={entrar:Ti,vistaColombia:ki,volarA:Mi,viewer:Y,get modo(){return je},precargar:()=>{vt??(vt=Qo().catch(e=>{console.warn("precarga",e),vt=null}))},explotar:()=>Jo(),recomponer:()=>wi(),get explotado(){return!!z?.explotado},piso2:()=>void $o(),completo:()=>Nt(2)};Dt();Y.camera.setView({destination:x.fromDegrees(-77.6,3.4,26e5),orientation:{heading:0,pitch:wt.toRadians(-82),roll:0}});yt.hidden=!0;window.dispatchEvent(new CustomEvent("hlf:listo"));let Fo=performance.now(),Yt=0;function ta(){const e=performance.now(),o=Math.min(.1,(e-Fo)/1e3);if(Fo=e,Be){const a=Math.min(1,(e-Be.start)/1800),n=a<.5?4*a*a*a:1-Math.pow(-2*a+2,3)/2;pe=Be.from+(Be.to-Be.from)*n,a>=1&&(Be=null)}else Rt&&(pe+=o/7,pe>20.6&&(pe=5.6));if((Math.abs(pe-gt)>.004||gt<0)&&(gt=pe,pi()),to.uniforms.uTime=e*.001,Pt&&E){const a=(e-Pt.start)/550,n=Math.floor(a),s=a-n,c=1-Math.pow(1-Math.min(1,s*1.6),3);n>=vi?(E.setHotelFloors(99),Pt=null):E.setHotelFloors(n+c)}z?.update(o,e),io?.update(o);const t=e*.001;if(E?.setTime(t),we.uniforms.uTime=t,Ze&&je==="sitio"&&!L.isWalking&&L.flyTo({heading:L.state.heading+.16*o},0),L.update(o),de.frames++,e-de.t0>=2e3){de.fps=Math.round(de.frames*1e3/(e-de.t0)),de.frames=0,de.t0=e,window.__FPS__=de.fps;const a=!!E&&E.sections.loaded>=E.sections.total&&e-Yt>8e3;E&&E.sections.loaded>=E.sections.total&&!Yt&&(Yt=e),a&&document.visibilityState==="visible"&&(de.fps<20&&ue>.25&&!window.__DBG__.lock?++de.low>=3&&(ue=ue>=1?.5:.25,de.low=0,it()):de.low=0)}requestAnimationFrame(ta)}requestAnimationFrame(ta);addEventListener("resize",it);
