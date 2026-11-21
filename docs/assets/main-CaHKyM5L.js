var Vo=Object.defineProperty;var jo=(e,o,t)=>o in e?Vo(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var U=(e,o,t)=>jo(e,typeof o!="symbol"?o+"":o,t);import{C as x,a as ht,T as Ut,M as Y,b as Re,d as at,H as To,P as qt,e as Ge,L as Eo,U as I,V as de,f as Ke,h as Je,i as Mt,j as St,k as pt,l as Wo,S as ye,I as zo,m as qo,n as Go,o as W,p as gt,R as Yo,q as st,A as Te,r as no,s as Xo,t as $o,u as Zo,v as rt,w as so,x as Vt,G as Ko,B as Jo,y as Lt,J as Po,z as Qo,D as ea,E as ta,F as oa,K as aa,N as ia,O as na,Q as Rt,W as sa}from"./cesium-DBKYwLDS.js";const It="/BACO-OBRA/",ra=It.endsWith("/")?It:It+"/",la=ra+"cesium/";window.CESIUM_BASE_URL=la;const xt={longitude:-74.04145021,latitude:4.70207636,height:2572},_t={hotel:{name:"Hotel La Fontana",e:-236,n:330,u:18},unicentro:{name:"Unicentro",e:10,n:0,u:14}},ca={general:{place:"hotel",range:1250,pitch:-.52,heading:.55},aerial:{place:"hotel",range:420,pitch:-.62,heading:2.35},arch:{place:"hotel",range:210,pitch:-.2,heading:3.35}},Ve={secciones:"secciones/",googleTiles:"",ionToken:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6InpqazdNNTMycTI4aVVpV1UiLCJqdGkiOiJmNjYwOTgwYS02OTFjLTQ0NzEtODZjYS0xNjM0OTk3ODE5YTYiLCJpZCI6NTE4MTQ4LCJzdWIiOiJhbGVqYW5kcmFnb21lemciLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoiVW50aXRsZWQiLCJpYXQiOjE3OTUxMzc4NjR9.0nysUQdrzpmCv5RLHMTp1ad7rY2Ps8goLgDkKuctMtM",imageryAssetId:2},da=e=>e<.5?4*e*e*e:1-Math.pow(-2*e+2,3)/2,ro=-1.5533,lo=-.012,ua=4200,fa=6,co=1.7;class ha{constructor(o){U(this,"viewer");U(this,"canvas");U(this,"pivot",new x);U(this,"heading",.5);U(this,"pitch",-.6);U(this,"range",1200);U(this,"targetPivot",new x);U(this,"targetHeading",.5);U(this,"targetPitch",-.6);U(this,"targetRange",1200);U(this,"damping",9);U(this,"drag",null);U(this,"pointers",new Map);U(this,"pinch",null);U(this,"lastTap",0);U(this,"keys",new Set);U(this,"tween",null);U(this,"fov",ht.toRadians(48));U(this,"walking",!1);U(this,"eye",new x);U(this,"eyeTarget",new x);U(this,"wHeading",0);U(this,"wPitch",0);U(this,"wHeadingT",0);U(this,"wPitchT",0);U(this,"active",!0);U(this,"onPick",null);U(this,"onModeChange",null);U(this,"groundHeight",null);this.viewer=o,this.canvas=o.scene.canvas,o.scene.screenSpaceCameraController.enableInputs=!1,this.bind()}get isWalking(){return this.walking}get state(){return{heading:this.targetHeading,pitch:this.targetPitch,range:this.targetRange,pivot:x.clone(this.targetPivot)}}setPivot(o,t=!0){if(t){const a=x.clone(this.viewer.camera.positionWC),n=x.subtract(a,o,new x),s=x.magnitude(n),c=Ut.eastNorthUpToFixedFrame(o),p=Y.inverseTransformation(c,new Y),d=Y.multiplyByPointAsVector(p,n,new x);if(s>1){const f=-Math.asin(Math.max(-1,Math.min(1,d.z/s)));if(f<lo&&f>ro){let h=Math.atan2(-d.x,-d.y);for(;h-this.heading>Math.PI;)h-=Math.PI*2;for(;h-this.heading<-Math.PI;)h+=Math.PI*2;this.heading=this.targetHeading=h,this.pitch=this.targetPitch=f,this.range=this.targetRange=this.clamp(s),x.clone(o,this.pivot)}}}this.targetPivot=x.clone(o),this.tween=null}bind(){const o=this.canvas;o.style.touchAction="none",o.addEventListener("pointerdown",a=>{if(this.active){if(o.setPointerCapture(a.pointerId),this.pointers.set(a.pointerId,{x:a.offsetX,y:a.offsetY}),this.pointers.size===2){const[n,s]=[...this.pointers.values()];this.pinch={distance:Math.hypot(n.x-s.x,n.y-s.y),range:this.targetRange,cx:(n.x+s.x)/2,cy:(n.y+s.y)/2},this.drag=null;return}a.button===2||a.button===1||a.shiftKey?this.drag={id:a.pointerId,x:a.offsetX,y:a.offsetY,mode:"pan",moved:!1}:a.button===0&&(this.drag={id:a.pointerId,x:a.offsetX,y:a.offsetY,mode:"orbit",moved:!1}),this.tween=null}}),o.addEventListener("pointermove",a=>{if(!this.active||!this.pointers.has(a.pointerId))return;if(this.pointers.set(a.pointerId,{x:a.offsetX,y:a.offsetY}),this.pointers.size===2&&this.pinch){const[c,p]=[...this.pointers.values()],d=Math.hypot(c.x-p.x,c.y-p.y),f=(c.x+p.x)/2,h=(c.y+p.y)/2;this.walking?this.walk((this.pinch.cy-h)*.06,0):(d>0&&this.pinch.distance>0&&(this.targetRange=this.clamp(this.pinch.range*this.pinch.distance/d)),this.pan(this.pinch.cx-f,h-this.pinch.cy)),this.pinch.cx=f,this.pinch.cy=h;return}if(!this.drag||a.pointerId!==this.drag.id)return;const n=a.offsetX-this.drag.x,s=a.offsetY-this.drag.y;this.drag.x=a.offsetX,this.drag.y=a.offsetY,Math.abs(n)+Math.abs(s)>1.5&&(this.drag.moved=!0),this.tween=null,this.walking?this.drag.mode==="orbit"?(this.wHeadingT-=n*.0032,this.wPitchT=Math.max(-1.2,Math.min(1.2,this.wPitchT+s*.0028))):this.walk(s*.05,-n*.05):this.drag.mode==="orbit"?(this.targetHeading-=n*.0042,this.targetPitch=this.clampPitch(this.targetPitch-s*.0034)):this.pan(-n,s)});const t=a=>{if(this.pointers.delete(a.pointerId),this.pointers.size<2&&(this.pinch=null),this.drag&&a.pointerId===this.drag.id){const n=!this.drag.moved&&this.drag.mode==="orbit";if(this.drag=null,n&&a.type==="pointerup"){const s=new Re(a.offsetX,a.offsetY),c=performance.now();if(a.pointerType!=="mouse"&&c-this.lastTap<320){this.lastTap=0,this.focusAt(s);return}this.lastTap=c;const p=this.pickWorld(s);p&&!this.walking&&this.setPivot(p,!0),this.onPick?.(p)}}};o.addEventListener("pointerup",t),o.addEventListener("pointercancel",t),o.addEventListener("contextmenu",a=>a.preventDefault()),o.addEventListener("wheel",a=>{if(!this.active)return;a.preventDefault(),this.tween=null;const n=a.deltaMode===1?16:a.deltaMode===2?100:1,s=a.deltaY*n;if(this.walking){this.walk(-s*.02,0);return}const c=Math.exp(Math.max(-.45,Math.min(.45,s*.0016))),p=this.pickWorld(new Re(a.offsetX,a.offsetY)),d=this.clamp(this.targetRange*c);if(p&&c<1){const f=Math.min(.45,(this.targetRange-d)/this.targetRange)*.8,h=x.subtract(p,this.targetPivot,new x),w=x.magnitude(h);if(w>1){const g=Math.min(w,this.targetRange)*f/w;x.add(this.targetPivot,x.multiplyByScalar(h,g,h),this.targetPivot)}}this.targetRange=d},{passive:!1}),o.addEventListener("dblclick",a=>{this.active&&(a.preventDefault(),this.focusAt(new Re(a.offsetX,a.offsetY)))}),addEventListener("keydown",a=>{a.target instanceof HTMLInputElement||(this.keys.add(a.code),["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","PageUp","PageDown"].includes(a.code)&&a.preventDefault())}),addEventListener("keyup",a=>this.keys.delete(a.code)),addEventListener("blur",()=>this.keys.clear())}clamp(o,t=fa,a=ua){return Math.max(t,Math.min(a,o))}clampPitch(o){return Math.max(ro,Math.min(lo,o))}moveHorizontal(o,t,a,n){const s=Ut.eastNorthUpToFixedFrame(o),c=new x(Math.sin(t)*a+Math.cos(t)*n,Math.cos(t)*a-Math.sin(t)*n,0);Y.multiplyByPoint(s,c,o)}pan(o,t){const a=this.canvas.clientHeight||1,n=2*this.range*Math.tan(this.fov/2)/a,s=Math.max(.35,Math.sin(-this.pitch));this.moveHorizontal(this.targetPivot,this.heading,t*n/s,o*n),this.tween=null}walk(o,t){this.moveHorizontal(this.eyeTarget,this.wHeading,o,t),this.snapEye()}snapEye(){const o=at.fromCartesian(this.eyeTarget),t=this.groundHeight?.(o);t!==void 0&&Number.isFinite(t)&&(o.height=t+co,at.toCartesian(o,void 0,this.eyeTarget))}pickWorld(o){const t=this.viewer.scene;let a;if(t.pickPositionSupported&&t.pick(o,4,4)&&(a=t.pickPosition(o)),!a){const n=t.camera.getPickRay(o);n&&(a=t.globe.pick(n,t)??void 0)}return a??null}focusAt(o){const t=this.pickWorld(o);if(t){if(this.walking){x.clone(t,this.eyeTarget),this.snapEye();return}this.flyTo({pivot:t,heading:this.targetHeading,pitch:Math.min(this.targetPitch,-.3),range:this.clamp(Math.max(70,this.targetRange*.42),50,420)},1.6)}}flyTo(o,t=2){this.walking&&this.exitWalk(!1);const a={pivot:o.pivot??x.clone(this.targetPivot),heading:o.heading??this.targetHeading,pitch:o.pitch??this.targetPitch,range:o.range??this.targetRange};let n=a.heading;for(;n-this.targetHeading>Math.PI;)n-=Math.PI*2;for(;n-this.targetHeading<-Math.PI;)n+=Math.PI*2;if(a.heading=n,t<=.02){this.tween=null,this.targetPivot=x.clone(a.pivot),this.pivot=x.clone(a.pivot),this.heading=this.targetHeading=a.heading,this.pitch=this.targetPitch=a.pitch,this.range=this.targetRange=a.range;return}this.tween={from:{pivot:x.clone(this.targetPivot),heading:this.targetHeading,pitch:this.targetPitch,range:this.targetRange},to:a,start:performance.now(),duration:t*1e3}}enterWalk(o){x.clone(o??this.targetPivot,this.eyeTarget),this.snapEye(),x.clone(this.viewer.camera.positionWC,this.eye),this.wHeading=this.wHeadingT=this.heading,this.wPitch=this.pitch,this.wPitchT=0,this.walking=!0,this.tween=null,this.onModeChange?.(!0)}exitWalk(o=!0){if(!this.walking)return;this.walking=!1;const t=at.fromCartesian(this.eyeTarget);t.height-=co-1;const a=at.toCartesian(t);this.pivot=x.clone(a),this.targetPivot=a,this.heading=this.targetHeading=this.wHeading,this.pitch=-.05,this.range=8,o?this.onModeChange?.(!1):this.onModeChange?.(!1)}updateKeys(o){if(!this.keys.size)return;const t=this.keys,a=t.has("ShiftLeft")||t.has("ShiftRight")?3:1;let n=0,s=0;(t.has("KeyW")||t.has("ArrowUp"))&&(n+=1),(t.has("KeyS")||t.has("ArrowDown"))&&(n-=1),(t.has("KeyD")||t.has("ArrowRight"))&&(s+=1),(t.has("KeyA")||t.has("ArrowLeft"))&&(s-=1);let c=0;if(t.has("KeyQ")&&(c+=1),t.has("KeyE")&&(c-=1),this.walking){c&&(this.wHeadingT-=c*1.2*o),(n||s)&&this.walk(n*4.2*a*o,s*3.4*a*o);return}if(c&&(this.targetHeading+=c*.9*o,this.tween=null),(t.has("PageUp")||t.has("Equal")||t.has("NumpadAdd"))&&(this.targetRange=this.clamp(this.targetRange*(1-.9*o))),(t.has("PageDown")||t.has("Minus")||t.has("NumpadSubtract"))&&(this.targetRange=this.clamp(this.targetRange*(1+.9*o))),t.has("KeyR")&&(this.targetPitch=this.clampPitch(this.targetPitch-.7*o)),t.has("KeyF")&&(this.targetPitch=this.clampPitch(this.targetPitch+.7*o)),!n&&!s)return;const p=Math.max(8,this.range*.6)*a*o;this.moveHorizontal(this.targetPivot,this.heading,n*p,s*p),this.tween=null}update(o){if(!this.active)return;this.updateKeys(o);const t=1-Math.exp(-this.damping*o);if(this.walking){x.lerp(this.eye,this.eyeTarget,1-Math.exp(-5*o),this.eye),this.wHeading+=(this.wHeadingT-this.wHeading)*t,this.wPitch+=(this.wPitchT-this.wPitch)*t,this.viewer.camera.setView({destination:this.eye,orientation:{heading:this.wHeading,pitch:this.wPitch,roll:0}});return}if(this.tween){const a=Math.min(1,(performance.now()-this.tween.start)/this.tween.duration),n=da(a),{from:s,to:c}=this.tween;x.lerp(s.pivot,c.pivot,n,this.targetPivot),this.targetHeading=s.heading+(c.heading-s.heading)*n,this.targetPitch=s.pitch+(c.pitch-s.pitch)*n,this.targetRange=Math.exp(Math.log(s.range)+(Math.log(c.range)-Math.log(s.range))*n),a>=1&&(this.tween=null)}this.heading+=(this.targetHeading-this.heading)*t,this.pitch+=(this.targetPitch-this.pitch)*t,this.range=Math.exp(Math.log(this.range)+(Math.log(this.targetRange)-Math.log(this.range))*t),x.lerp(this.pivot,this.targetPivot,t,this.pivot),this.viewer.camera.lookAt(this.pivot,new To(this.heading,this.pitch,this.range)),this.viewer.camera.lookAtTransform(Y.IDENTITY)}}function ma(){return new Je({typedArray:new Uint8Array([128,128,128,255]),width:1,height:1})}const Ao=()=>({uAerial:{type:I.SAMPLER_2D,value:ma()},uAerialRect:{type:I.VEC4,value:new Ke(-1e3,-1e3,1e3,1e3)},uAerialOn:{type:I.FLOAT,value:0}}),Lo=`
  vec3 hlfAerial(vec2 en) {
    vec2 uv = (en - uAerialRect.xy) / (uAerialRect.zw - uAerialRect.xy);
    return czm_srgbToLinear(texture(uAerial, clamp(uv, 0.001, 0.999)).rgb);
  }
`,mt=`
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
`;function pa(){return new Ge({uniforms:{uNight:{type:I.FLOAT,value:0},uTarde:{type:I.FLOAT,value:0},uSkyFill:{type:I.FLOAT,value:.24},uHazeAmount:{type:I.FLOAT,value:.08},uHazeStart:{type:I.FLOAT,value:1200},uHotelPisos:{type:I.FLOAT,value:99},uRevitBox:{type:I.VEC4,value:new Ke(0,0,0,0)},uLean:{type:I.VEC2,value:new Re(0,0)},...Ao()},varyings:{vPosM:de.VEC3,vUpEC:de.VEC3},vertexShaderText:`
      void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        vPosM = vsInput.attributes.positionMC;
        vUpEC = normalize((czm_modelView * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
      }
    `,fragmentShaderText:mt+Lo+`
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
    `})}function ga(e,o,t){return new Ge({uniforms:{uNight:{type:I.FLOAT,value:0},uTarde:{type:I.FLOAT,value:0},uSkyFill:{type:I.FLOAT,value:.22},uHazeAmount:{type:I.FLOAT,value:.08},uHazeStart:{type:I.FLOAT,value:1200},uTime:{type:I.FLOAT,value:0},uFrame:{type:I.FLOAT,value:o},uTop:{type:I.FLOAT,value:t},uAtlas:{type:I.SAMPLER_2D,value:new Je({url:e,repeat:!1,minificationFilter:St.LINEAR_MIPMAP_LINEAR,magnificationFilter:Mt.LINEAR})}},varyings:{vUV:de.VEC2,vView:de.VEC3,vRightT:de.VEC2,vUpT:de.VEC2,vUpEC:de.VEC3},vertexShaderText:`
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
    `,fragmentShaderText:mt+`
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
    `})}function va(){return new Ge({uniforms:{uNight:{type:I.FLOAT,value:0},uTarde:{type:I.FLOAT,value:0},uHazeAmount:{type:I.FLOAT,value:.08},uHazeStart:{type:I.FLOAT,value:1200}},lightingModel:Eo.UNLIT,fragmentShaderText:mt+`
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 c = material.diffuse;
        // el verde y el rojo de la foto aérea se bajan un poco para que no compitan con el modelo
        c = mix(vec3(dot(c, vec3(0.3, 0.59, 0.11))), c, 0.78);
        c = mix(c, c * vec3(1.01, 0.99, 0.97), uTarde * 0.35);
        c = mix(c, c * vec3(0.11, 0.14, 0.22), uNight);
        material.diffuse = mix(c, hlfHazeColor(uNight, uTarde), hlfHaze(length(fsInput.attributes.positionEC), uHazeStart, uHazeAmount));
      }
    `})}function ya(e,o,t){return new qt({name:"hlf_sky",uniforms:{uNight:0,uTarde:0,uTime:0,uEast:e,uNorth:o,uUp:t,uSkyZenith:new x(.16,.42,.82),uSkyHorizon:new x(.72,.83,.94),uCloudDensity:.85,uCloudSpeed:1},fragmentShader:`
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
    `})}function ba(){return new qt({name:"hlf_grade",uniforms:{uNight:0,uTarde:0,uExposure:1,uContrast:.22,uSaturation:1.06,uTint:new x(1,1,1),uVignette:.24},fragmentShader:`
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
    `})}function xa(e){const o=t=>({type:I.SAMPLER_2D,value:new Je({url:e+t,repeat:!0,minificationFilter:St.LINEAR_MIPMAP_LINEAR,magnificationFilter:Mt.LINEAR})});return new Ge({uniforms:{uNight:{type:I.FLOAT,value:0},uTarde:{type:I.FLOAT,value:0},uGroundFill:{type:I.FLOAT,value:.12},uHazeAmount:{type:I.FLOAT,value:.08},uHazeStart:{type:I.FLOAT,value:1200},uAsfalto:o("tex_asfalto.webp"),uAnden:o("tex_anden.webp"),uPrado:o("tex_prado.webp"),uCiclo:o("tex_ciclo.webp"),...Ao()},varyings:{vG:de.VEC3,vUpEC:de.VEC3},vertexShaderText:`
      void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        vG = vsInput.attributes.positionMC;
        vUpEC = normalize((czm_modelView * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
      }
    `,fragmentShaderText:mt+Lo+`
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
    `})}function wa(){return new Ge({uniforms:{uNight:{type:I.FLOAT,value:0},uTarde:{type:I.FLOAT,value:0},uSkyFill:{type:I.FLOAT,value:.24},uHazeAmount:{type:I.FLOAT,value:.08},uHazeStart:{type:I.FLOAT,value:1200}},varyings:{vPosM:de.VEC3,vUpEC:de.VEC3},vertexShaderText:`
      void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        vPosM = vsInput.attributes.positionMC;
        vUpEC = normalize((czm_modelView * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
      }
    `,fragmentShaderText:mt+`
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
    `})}function Gt(){return Ut.eastNorthUpToFixedFrame(x.fromDegrees(xt.longitude,xt.latitude,xt.height))}function J(e,o,t,a=Gt()){return Y.multiplyByPoint(a,new x(e,o,t),new x)}const Ca={island_tree_01:"Arbolado · copa media",island_tree_02:"Arbolado · copa ancha",island_tree_03:"Arbolado · copa baja",jacaranda_tree:"Arbolado · gran porte",tree_small_02:"Arbolado · joven",fir_sapling_medium:"Coníferas",shrub_02:"Arbustos"};function ka(e,o,t){let a=!1;for(let n=0,s=t.length-1;n<t.length;s=n++){const[c,p]=t[n],[d,f]=t[s];p>o!=f>o&&e<(d-c)*(o-p)/(f-p)+c&&(a=!a)}return a}function Ma(e,o,t){let a=1/0;for(let n=0,s=t.length-1;n<t.length;s=n++){const[c,p]=t[s],[d,f]=t[n],h=d-c,w=f-p,g=Math.max(0,Math.min(1,((e-c)*h+(o-p)*w)/(h*h+w*w||1)));a=Math.min(a,Math.hypot(e-c-g*h,o-p-g*w))}return a}async function Sa(e,o,t){const a=e.scene,n=Gt(),s=Y.inverseTransformation(n,new Y),c=Ve.secciones;o("Contexto urbano",.08);const[p,d,f,h]=await Promise.all([fetch(c+"recorte.json").then(i=>i.json()),fetch(c+"edificios.json").then(i=>i.json()),fetch(c+"arboles.json").then(i=>i.json()),fetch(c+"suelo.json").then(i=>i.json())]),w=()=>p.clips.map(i=>{const u=new gt({positions:x.fromDegreesArray(i.flat())}),z=u.computeRectangle();return u.computeRectangle=T=>Yo.clone(z,T),u});a.globe.clippingPolygons=new pt({polygons:w()});const g=va();let C=null;try{if(!Ve.googleTiles)throw new Error("sin clave de Google: se usa solo el modelo propio");C=await Wo.fromUrl(Ve.googleTiles,{maximumScreenSpaceError:10,shadows:ye.DISABLED,dynamicScreenSpaceError:!0,dynamicScreenSpaceErrorDensity:.0022,dynamicScreenSpaceErrorFactor:4,showCreditsOnScreen:!0,cullWithChildrenBounds:!0,cacheBytes:384*1024*1024,maximumCacheOverflowBytes:256*1024*1024}),C.clippingPolygons=new pt({polygons:w()}),C.customShader=g,a.primitives.add(C)}catch(i){console.warn("Tiles de Google no disponibles",i)}const S=[-236,330],b=[];for(const i of d.secciones){const u=i.key==="Hotel";b.push({key:i.key,file:u?"hotel_fachadas.glb":i.file,kind:u?"cubierta_pbr":"edificios",label:u?"Hotel La Fontana 3D":`Edificaciones · sector ${i.key}`,dist:u?-2:Math.hypot(i.c[0]-S[0],i.c[1]-S[1])})}b.push({key:"hotel_cubiertas",file:"hotel_cubiertas.glb",kind:"cubierta",label:"Cubiertas del hotel",dist:-1}),b.push({key:"hotel_plazoleta",file:"hotel_plazoleta.glb",kind:"cubierta_pbr",label:"Plazoleta y acceso · Hotel",dist:-.8}),b.push({key:"torres_vecinas",file:"torres_vecinas.glb",kind:"cubierta_pbr",label:"Torres vecinas PBR",dist:-.6}),b.push({key:"esquina_ak15",file:"esquina_ak15.glb",kind:"cubierta_pbr",label:"Esquina Ak 15 PBR",dist:-.55}),b.push({key:"metro127",file:"metro127.glb",kind:"cubierta_pbr",label:"Metro 127 · Sonesta PBR",dist:-.52}),b.push({key:"clinica127",file:"clinica127.glb",kind:"cubierta_pbr",label:"Clínica 127 Colsubsidio PBR",dist:-.51}),b.push({key:"unicentro_cubierta",file:"unicentro_cubierta.glb",kind:"cubierta_pbr",label:"Cubierta · Unicentro",dist:-.5}),b.sort((i,u)=>i.dist-u.dist);const B={Terreno:[0,"Terreno"],Vias:[1,"Vías"],Andenes:[2,"Andenes"],Separadores:[3,"Separadores"],Ciclorrutas:[4,"Ciclorrutas"],Agua:[5,"Canal · agua"],Canal_Fondo:[6,"Canal"],Canal_Muros:[6,"Canal · muros"],Puentes:[7,"Puentes"]},y=h.secciones.map(i=>({key:i.key,file:i.file,kind:"suelo",capa:B[i.key]?.[0]??0,label:B[i.key]?.[1]??i.key,dist:-3})),A=f.secciones.map(i=>({key:i.key,file:i.file,kind:"arboles",atlas:i.atlas,marco:i.marco,marcoSup:i.marcoSup,label:Ca[i.key]??"Vegetación",dist:0}));let L=[];try{L=(await fetch(c+"arboles3d.json").then(i=>i.json())).secciones}catch{}const k=L.map(i=>({key:"3d_"+i.key,file:i.file,kind:"arbol3d",label:"Arbolado del hotel",dist:0})),M=[...y,...b.slice(0,4),...k,...A.slice(0,3),...b.slice(4,9),...A.slice(3),...b.slice(9)],N=pa(),Q=new Ge({lightingModel:Eo.UNLIT,uniforms:{uNight:{type:I.FLOAT,value:0}},fragmentShaderText:`
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
    `}),K=wa(),Z=xa(c),ne=(async()=>{try{const i=await zo.fromAssetId(Ve.imageryAssetId),u=18,z=i.tilingScheme,T=(te,Me)=>at.fromCartesian(J(te,Me,0,n)),R=z.positionToTileXY(T(-1010,930),u),q=z.positionToTileXY(T(1010,-940),u),oe=q.x-R.x+1,ae=q.y-R.y+1,H=i.tileWidth,$=document.createElement("canvas");$.width=oe*H,$.height=ae*H;const D=$.getContext("2d"),ee=[];for(let te=R.y;te<=q.y;te++)for(let Me=R.x;Me<=q.x;Me++)ee.push([Me,te]);const ie=async([te,Me])=>{for(let to=0;to<40;to++){const oo=i.requestImage(te,Me,u);if(oo){try{const ot=await oo,ao=(te-R.x)*H,io=(Me-R.y)*H;typeof ImageBitmap<"u"&&ot instanceof ImageBitmap?(D.save(),D.translate(ao,io+H),D.scale(1,-1),D.drawImage(ot,0,0,H,H),D.restore()):D.drawImage(ot,ao,io,H,H)}catch{}return}await new Promise(ot=>setTimeout(ot,120))}};D.fillStyle="#6a6f62",D.fillRect(0,0,$.width,$.height);const ke=Array.from({length:6},async()=>{for(;ee.length;)await ie(ee.shift())});await Promise.all(ke);const fe=document.createElement("canvas");fe.width=fe.height=4096,fe.getContext("2d").drawImage($,0,0,4096,4096);const Fe=await new Promise(te=>fe.toBlob(te,"image/jpeg",.92));if(!Fe)return;const Le=URL.createObjectURL(Fe);window.__AERIAL_URL__=Le;const Ye=z.tileXYToRectangle(R.x,R.y,u),Oe=z.tileXYToRectangle(q.x,q.y,u),Jt=(te,Me)=>Y.multiplyByPoint(s,x.fromRadians(te,Me,xt.height),new x),Qt=Jt(Ye.west,Oe.south),eo=Jt(Oe.east,Ye.north),Uo=new Ke(Qt.x,Qt.y,eo.x,eo.y);for(const te of[N,Z])te.setUniform("uAerial",new Je({url:Le,repeat:!1,minificationFilter:St.LINEAR_MIPMAP_LINEAR,magnificationFilter:Mt.LINEAR})),te.setUniform("uAerialRect",Uo),te.setUniform("uAerialOn",1)}catch(i){console.warn("Foto aérea no disponible",i)}})(),se=[],ge=[],ze=[];let Pe=null;const Ae=new qo(new x(0,-1,0),1e3);let tt=0,je=0,We=.22,Ce=.08,ve=1200;const qe={total:M.length,loaded:0,failed:[]},l=async i=>{try{const u=await st.fromGltfAsync({url:c+i.file,modelMatrix:n,upAxis:Te.Y,forwardAxis:Te.X,shadows:i.kind==="arbol3d"?ye.ENABLED:i.kind==="arboles"?ye.CAST_ONLY:i.kind==="suelo"?ye.RECEIVE_ONLY:ye.ENABLED,backFaceCulling:!1,incrementallyLoadTextures:!1,cull:i.kind!=="arboles"});if(i.kind==="arbol3d")u.customShader=Q;else if(i.kind==="suelo")u.customShader=Z;else if(i.kind==="arboles"){const T=ga(c+i.atlas,i.marco,i.marcoSup);T.setUniform("uNight",tt),T.setUniform("uTarde",je),T.setUniform("uSkyFill",We),T.setUniform("uHazeAmount",Ce),T.setUniform("uHazeStart",ve),se.push(T),u.customShader=T}else i.key==="Hotel"||i.key==="hotel_plazoleta"||i.key==="hotel_cubiertas"?u.customShader=K:i.kind!=="cubierta_pbr"&&(u.customShader=N);const z=i.key==="Hotel"||i.key==="hotel_plazoleta"||i.key==="hotel_cubiertas";u.imageBasedLighting.imageBasedLightingFactor=z?new Re(1,.75):i.kind==="cubierta_pbr"?new Re(.85,.55):new Re(.68,.38),a.primitives.add(u),i.kind==="arboles"&&ge.push(u),(i.key==="Hotel"||i.key==="hotel_cubiertas")&&ze.push(u),await new Promise(T=>{if(u.ready)return T();const R=u.readyEvent.addEventListener(()=>{R(),T()});setTimeout(T,2e4)})}catch(u){console.error("Sección no cargada",i.file,u),qe.failed.push(i.file)}qe.loaded++,t?.(qe.loaded,qe.total,i.label)},m=y.length+7,v=async(i,u,z)=>{let T=0,R=0;await Promise.all(Array.from({length:Math.min(u,i.length)},async()=>{for(;T<i.length;){const q=i[T++];await l(q),z?.(++R)}}))},r=M.slice(0,m);await v(r,5,i=>o(r[Math.min(i,r.length-1)].label,.2+.75*i/r.length));let P=()=>{};const F=new Promise(i=>{P=i,setTimeout(i,16e3)}),j=(async()=>{await F,await v(M.slice(m),3),await ne})();return{startBackground:()=>P(),matrix:n,inverse:s,tileset:C,buildings:d.edificios,treeCount:f.total,sections:qe,done:j,setNight(i){g.setUniform("uNight",i),N.setUniform("uNight",i),K.setUniform("uNight",i),tt=i,Z.setUniform("uNight",i);for(const u of se)u.setUniform("uNight",i)},setTarde(i){g.setUniform("uTarde",i),N.setUniform("uTarde",i),K.setUniform("uTarde",i),je=i,Z.setUniform("uTarde",i);for(const u of se)u.setUniform("uTarde",i)},setTime(i){for(const u of se)u.setUniform("uTime",i)},setLook(i){if(i.skyFill!==void 0){We=i.skyFill,N.setUniform("uSkyFill",We),K.setUniform("uSkyFill",We);for(const u of se)u.setUniform("uSkyFill",We)}if(i.groundFill!==void 0&&Z.setUniform("uGroundFill",i.groundFill),i.hazeAmount!==void 0){Ce=i.hazeAmount,N.setUniform("uHazeAmount",Ce),K.setUniform("uHazeAmount",Ce),Z.setUniform("uHazeAmount",Ce),g.setUniform("uHazeAmount",Ce);for(const u of se)u.setUniform("uHazeAmount",Ce)}if(i.hazeStart!==void 0){ve=i.hazeStart,N.setUniform("uHazeStart",ve),K.setUniform("uHazeStart",ve),Z.setUniform("uHazeStart",ve),g.setUniform("uHazeStart",ve);for(const u of se)u.setUniform("uHazeStart",ve)}},setRevitBlocks(i,u=[]){const z=d.edificios.filter(T=>i.includes(T.id)).map(T=>{const R=T.r.reduce((oe,ae)=>oe+ae[0],0)/T.r.length,q=T.r.reduce((oe,ae)=>oe+ae[1],0)/T.r.length;return new gt({positions:T.r.map(([oe,ae])=>{const H=oe-R,$=ae-q,D=Math.hypot(H,$)||1;return J(oe+H/D*1,ae+$/D*1,0,n)})})});for(const T of u)z.push(new gt({positions:T.map(([R,q])=>J(R,q,0,n))}));for(const T of ze)T.clippingPolygons=z.length?new pt({polygons:z}):void 0},setRevitZone(i){if(!i){Pe=i?[[i[0],i[1]],[i[2],i[1]],[i[2],i[3]],[i[0],i[3]]].map(([u,z])=>J(u,z,0,n)):null;for(const u of ze)u.clippingPolygons=Pe?new pt({polygons:[new gt({positions:Pe})]}):void 0;N.setUniform("uRevitBox",i?new Ke(i[0]-1,i[1]-1,i[2]+1,i[3]+1):new Ke(0,0,0,0))}},setHotelFloors(i){const u=i<98;Ae.distance=3.2+i*3.05;for(const z of ze)u&&!z.clippingPlanes&&(z.clippingPlanes=new Go({planes:[Ae],edgeWidth:2,edgeColor:W.fromCssColorString("#d7ebff")})),z.clippingPlanes&&(z.clippingPlanes.enabled=u);N.setUniform("uHotelPisos",i)},setTreesVisible(i){for(const u of ge)u.show=i},buildingAt(i){const u=Y.multiplyByPoint(s,i,new x);let z=null,T=1.2;for(const R of d.edificios){if(u.x<R.bb[0]-1.5||u.x>R.bb[2]+1.5||u.y<R.bb[1]-1.5||u.y>R.bb[3]+1.5||u.z>R.b+R.h+2.5)continue;if(ka(u.x,u.y,R.r))return R;const q=Ma(u.x,u.y,R.r);q<T&&(T=q,z=R)}return z}}}const Ta=W.fromCssColorString("#ff2b1a"),Ea=W.fromCssColorString("#ffc400"),za=W.fromCssColorString("#00e862"),Xe=W.fromCssColorString("#1a1d22");function Nt(e){const o=document.createElement("canvas");o.width=128,o.height=128;const t=o.getContext("2d");if(t.clearRect(0,0,128,128),e==="pare"){t.beginPath();for(let a=0;a<8;a++){const n=(a+.5)*Math.PI/4,s=64+Math.cos(n)*58,c=64+Math.sin(n)*58;a===0?t.moveTo(s,c):t.lineTo(s,c)}t.closePath(),t.fillStyle="#c81e1e",t.fill(),t.lineWidth=5,t.strokeStyle="#ffffff",t.stroke(),t.fillStyle="#ffffff",t.font="bold 31px sans-serif",t.textAlign="center",t.textBaseline="middle",t.fillText("PARE",64,66)}else e==="peaton"?(t.beginPath(),t.moveTo(64,6),t.lineTo(122,64),t.lineTo(64,122),t.lineTo(6,64),t.closePath(),t.fillStyle="#f5b800",t.fill(),t.lineWidth=4,t.strokeStyle="#18181b",t.stroke(),t.fillStyle="#18181b",t.beginPath(),t.arc(64,38,7,0,Math.PI*2),t.fill(),t.fillRect(59,47,10,22),t.fillRect(54,69,7,20),t.fillRect(67,69,7,20)):(t.beginPath(),t.arc(64,64,56,0,Math.PI*2),t.fillStyle="#ffffff",t.fill(),t.lineWidth=11,t.strokeStyle="#c81e1e",t.stroke(),t.fillStyle="#111827",t.font="bold 46px sans-serif",t.textAlign="center",t.textBaseline="middle",t.fillText("30",64,67));return o.toDataURL("image/png")}function Pa(e,o,t,a,n){const s=(y,A,L)=>Y.multiplyByPoint(o,new x(y,A,L),new x),c=[],p=t+7.2,d=a+7.2,f=n(p,d),h=W.fromCssColorString("#2a303a"),w=W.fromCssColorString("#14171c"),g=W.fromCssColorString("#eab308"),C=(y,A,L,k)=>{const M=k?.42:.3,N=k?.3:.42;c.push(e.entities.add({position:s(y,A,L),box:{dimensions:new x(M,N,1.18),material:w}}));const Q=(ge,ze)=>{const Pe=e.entities.add({position:s(y,A,L+ge),box:{dimensions:new x(k?.24:.33,k?.33:.24,.24),material:ze}});return c.push(Pe),Pe},K=Q(.36,Xe),Z=Q(0,Xe),ne=Q(-.36,Xe);return{red:K,yellow:Z,green:ne,setState:ge=>{K.box.material=new rt(ge==="red"?Ta:Xe),Z.box.material=new rt(ge==="yellow"?Ea:Xe),ne.box.material=new rt(ge==="green"?za:Xe)}}};if(Math.abs(t+148.8)<12&&Math.abs(a-216.3)<12){const y=[{px:-159.5,py:232,dx:4.2,dy:0,isNS:!0},{px:-163.5,py:226.5,dx:0,dy:-4,isNS:!1},{px:-163,py:203,dx:0,dy:4,isNS:!1},{px:-133.5,py:231.5,dx:4.2,dy:0,isNS:!0},{px:-133,py:202.5,dx:0,dy:4,isNS:!1}],A=[],L=[];for(const M of y){const N=n(M.px,M.py);c.push(e.entities.add({position:s(M.px,M.py,N+2.9),cylinder:{length:5.8,topRadius:.09,bottomRadius:.13,material:h}}),e.entities.add({position:s(M.px,M.py,N+1.2),cylinder:{length:.45,topRadius:.132,bottomRadius:.132,material:g}}),e.entities.add({position:s(M.px+M.dx*.5,M.py+M.dy*.5,N+5.65),box:{dimensions:new x(Math.max(.14,Math.abs(M.dx)),Math.max(.14,Math.abs(M.dy)),.14),material:h}}));const Q=C(M.px+M.dx*.78,M.py+M.dy*.78,N+5.1,M.isNS);(M.isNS?A:L).push(Q)}const k=M=>({red:M[0].red,yellow:M[0].yellow,green:M[0].green,setState:N=>{for(const Q of M)Q.setState(N)}});return{ns:k(A),ew:k(L),setVisible(M){for(const N of c)N.show=M}}}c.push(e.entities.add({position:s(p,d,f+2.9),cylinder:{length:5.8,topRadius:.09,bottomRadius:.13,material:h}}),e.entities.add({position:s(p,d,f+1.2),cylinder:{length:.45,topRadius:.132,bottomRadius:.132,material:g}}));const S=4.6;c.push(e.entities.add({position:s(p-S*.5,d,f+5.65),box:{dimensions:new x(S,.14,.14),material:h}}),e.entities.add({position:s(p,d-S*.5,f+5.65),box:{dimensions:new x(.14,S,.14),material:h}}));const b=C(p-3.4,d,f+5.1,!0),B=C(p,d-3.4,f+5.1,!1);return{ns:b,ew:B,setVisible(y){for(const A of c)A.show=y}}}function Aa(e,o,t,a,n){const s=(y,A,L)=>Y.multiplyByPoint(o,new x(y,A,L),new x),c=[],p=no.fromColor(W.fromCssColorString("#f3f4f6").withAlpha(.92)),d=no.fromColor(W.fromCssColorString("#f5b800").withAlpha(.92)),f=(y,A,L,k,M,N)=>{if(a(y,A)<.8)return;const Q=n(y,A)+.07;s(y,A,Q);const K=Vt.fromRotationZ(M),Z=Y.fromRotationTranslation(K,new x(y,A,Q)),ne=Y.multiply(o,Z,new Y);c.push(new Ko({geometry:Jo.fromDimensions({dimensions:new x(L,k,.04)}),modelMatrix:ne,attributes:{color:N}}))},h=Math.atan2(-51,380);for(const y of t){if(Math.abs(y.e+148.8)<12&&Math.abs(y.n-216.3)<12){const L=[{bx:-154,by:230,horiz:!0,ang:0},{bx:-164.5,by:221.5,horiz:!1,ang:h},{bx:-164.5,by:210.5,horiz:!1,ang:h},{bx:-154,by:202.5,horiz:!0,ang:0},{bx:-129,by:229,horiz:!1,ang:h},{bx:-128.5,by:211.5,horiz:!1,ang:h},{bx:-136.5,by:202.5,horiz:!0,ang:0}];for(const k of L)for(let M=-3;M<=3;M++){const N=k.horiz?k.bx+M*1.1:k.bx,Q=k.horiz?k.by:k.by+M*1.05;f(N,Q,k.horiz?.52:2.8,k.horiz?2.8:.52,k.ang,p)}continue}const A=[{de:0,dn:9.5,horiz:!0},{de:0,dn:-9.5,horiz:!0},{de:9.5,dn:0,horiz:!1},{de:-9.5,dn:0,horiz:!1}];for(const L of A){const k=y.e+L.de,M=y.n+L.dn;if(a(k,M)<1.2)continue;for(let K=-3;K<=3;K++){const Z=L.horiz?k+K*1.15:k,ne=L.horiz?M:M+K*1.15;f(Z,ne,L.horiz?.52:2.8,L.horiz?2.8:.52,0,p)}const N=k+(L.de===0?0:Math.sign(L.de)*2.1),Q=M+(L.dn===0?0:Math.sign(L.dn)*2.1);f(N,Q,L.horiz?6.8:.42,L.horiz?.42:6.8,0,p)}}for(let y=-80;y<=440;y+=8)f(-154,y,.18,3.2,0,p),f(-132,y,.18,3.2,0,p);for(let y=-420;y<=160;y+=8){const A=263-(y+420)*.13421052631578947;f(y,A+7.5,3.2,.18,h,p),f(y,A-7.5,3.2,.18,h,p),f(y,A,4.5,.18,h,d)}for(let y=-160;y<=360;y+=8)f(158,y,.18,3.2,0,p);let w=null;c.length>0&&(w=new Xo({geometryInstances:c,appearance:new $o({flat:!0,translucent:!0}),asynchronous:!1}),e.scene.primitives.add(w));const g=[],C=Nt("pare"),S=Nt("peaton"),b=Nt("vel30"),B=W.fromCssColorString("#9ca3af");return t.forEach((y,A)=>{const L=[{e:y.e-7.2,n:y.n-7.2,tex:C},{e:y.e+7.2,n:y.n-7.2,tex:A%2===0?S:b}];for(const k of L){const M=n(k.e,k.n);g.push(e.entities.add({position:s(k.e,k.n,M+1.15),cylinder:{length:2.3,topRadius:.035,bottomRadius:.035,material:B}}),e.entities.add({position:s(k.e,k.n,M+2.45),billboard:{image:k.tex,width:.72,height:.72,sizeInMeters:!0,verticalOrigin:Zo.CENTER}}))}}),{setVisible(y){w&&(w.show=y);for(const A of g)A.show=y}}}function La(e,o){const t=(b,B,y)=>Y.multiplyByPoint(o,new x(b,B,y),new x),a=[],p=W.fromCssColorString("#7a7771"),d=W.fromCssColorString("#3d3833"),f=W.fromCssColorString("#24471b"),h=W.fromCssColorString("#3d7f8f").withAlpha(.88),w=W.fromCssColorString("#ffbe55");a.push(e.entities.add({position:t(-225,263.5,4.17+.32),cylinder:{length:.64,topRadius:3.3,bottomRadius:3.6,material:p,slices:12}}),e.entities.add({position:t(-225,263.5,4.17+.56),cylinder:{length:.24,topRadius:3.45,bottomRadius:3.55,material:f,slices:12}}),e.entities.add({position:t(-225,263.5,4.17+.66),cylinder:{length:.08,topRadius:2.95,bottomRadius:2.95,material:h,slices:24}}),e.entities.add({position:t(-225,263.5,4.17+1.35),cylinder:{length:1.9,topRadius:.34,bottomRadius:.48,material:d}}),e.entities.add({position:t(-225,263.5,4.17+1.35),cylinder:{length:.18,topRadius:1.95,bottomRadius:1.55,material:d,slices:24}}),e.entities.add({position:t(-225,263.5,4.17+2.2),cylinder:{length:.16,topRadius:1.15,bottomRadius:.85,material:d,slices:24}}));let g=0;const C=new rt(new so(()=>{const b=.62+.18*Math.sin(g*7);return W.fromCssColorString("#d9f4ff").withAlpha(b)},!1)),S=new rt(new so(()=>{const b=.46+.16*Math.cos(g*5.5);return W.fromCssColorString("#bce8f7").withAlpha(b)},!1));a.push(e.entities.add({position:t(-225,263.5,4.17+2.85),cylinder:{length:1.25,topRadius:.08,bottomRadius:.36,material:C,slices:16}}),e.entities.add({position:t(-225,263.5,4.17+1.78),cylinder:{length:.85,topRadius:1.08,bottomRadius:1.22,material:S,slices:24}}),e.entities.add({position:t(-225,263.5,4.17+1.02),cylinder:{length:.72,topRadius:1.88,bottomRadius:2.08,material:S,slices:24}}));for(let b=-246;b<=-202;b+=8.5)a.push(e.entities.add({position:t(b,255.8,4.17+1.1),cylinder:{length:2.2,topRadius:.04,bottomRadius:.05,material:d}}),e.entities.add({position:t(b,255.8,4.17+2.3),ellipsoid:{radii:new x(.16,.16,.22),material:w}}));return{update(b){g=b},setVisible(b){for(const B of a)B.show=b}}}const vt=["#e9e9e6","#d8d9db","#272a30","#4b5563","#8c9197","#b8bcc0","#7a1f1c","#27405f","#c9c2b4","#3b4a3f","#a33b2a"],uo=["#2b4c7e","#991b1b","#1f2937","#3f6212","#7c2d12","#475569","#d97706","#f3f4f6"],fo=3.2;async function Ra(e,o,t=110){const a=Ve.secciones;let n,s,c;try{n=await fetch(a+"vias_campo.json").then(m=>m.json());const l=new Uint8Array(await fetch(a+"vias_campo.bin").then(m=>m.arrayBuffer()));s=l.subarray(0,n.w*n.h),c=l.subarray(n.w*n.h)}catch{return null}const{cell:p,x0:d,y0:f,w:h,h:w}=n,g=(l,m)=>{const v=(l-d)/p-.5,r=(m-f)/p-.5,P=Math.floor(v),F=Math.floor(r);if(P<0||F<0||P>=h-1||F>=w-1)return 0;const j=v-P,i=r-F,u=F*h+P;return((s[u]*(1-j)+s[u+1]*j)*(1-i)+(s[u+h]*(1-j)+s[u+h+1]*j)*i)*.5},C=(l,m)=>{const v=Math.max(0,Math.min(h-1,Math.floor((l-d)/p))),r=Math.max(0,Math.min(w-1,Math.floor((m-f)/p))),P=r*h+v;if(s[P]>0)return c[P]*.1-2;let F=0,j=0;for(let i=-2;i<=2;i++){const u=r+i;if(!(u<0||u>=w))for(let z=-2;z<=2;z++){const T=v+z;if(T<0||T>=h)continue;const R=u*h+T;if(s[R]===0)continue;const q=1/(z*z+i*i+.5);F+=q,j+=(c[R]*.1-2)*q}}return F>0?j/F:1},S=[],b=[],B=[];for(let l=2;l<w-2;l++)for(let m=2;m<h-2;m++){const v=l*h+m,r=d+(m+.5)*p,P=f+(l+.5)*p,F=Math.hypot(r+180,P-250);if(F>520)continue;const j=s[v]*.5;if(j>=2.6&&j<=5&&S.push(v),j>=6&&F<460&&B.push({e:r,n:P,d:j}),s[v]===0&&F<430){let i=!1;for(let u=-2;u<=2&&!i;u++)for(let z=-2;z<=2;z++)if(s[(l+u)*h+(m+z)]>0){i=!0;break}i&&b.push(v)}}if(!S.length)return null;B.sort((l,m)=>m.d-l.d);const y=[];for(const l of B){if(y.length>=6)break;if(y.some(r=>Math.hypot(r.e-l.e,r.n-l.n)<90))continue;const m=C(l.e,l.n),v=Pa(e,o,l.e,l.n,C);v.ns.setState("green"),v.ew.setState("red"),y.push({e:l.e,n:l.n,u:m,faseOffset:y.length*4.5,rig:v,nsEstado:"green",ewEstado:"red"})}const A=Aa(e,o,y,g,C),L=La(e,o),k=(()=>{let l=12345;return()=>(l=l*1664525+1013904223>>>0)/4294967296})(),M=(l,m,v)=>{const r=Math.cos(v),P=Math.sin(v);if(l>=-168&&l<=-118&&Math.abs(P)>.35)return l<-143?P<-.2?12:-1e6:P>.2?12:-1e6;const F=263-(l+420)*(51/380);return Math.abs(m-F)<26&&Math.abs(r)>.35?m>F?r>.2?12:-1e6:r<-.2?12:-1e6:l>=-255&&l<=-210&&m<222&&Math.abs(P)>.35?P<-.2?10:-1e6:m<175&&l<-215&&Math.abs(r)>.35?r>.2?10:-1e6:l<-385&&m<265&&Math.abs(P)>.35?P<-.2?10:-1e6:0},N=[],Q=(l,m,v)=>N.some(r=>r!==v&&Math.hypot(r.e-l,r.n-m)<8.5),K=l=>{for(let m=0;m<45;m++){const v=S[Math.floor(k()*S.length)],r=d+(v%h+.5)*p,P=f+(Math.floor(v/h)+.5)*p;if(Q(r,P,l))continue;let F=0,j=-1e9;for(let i=0;i<16;i++){const u=i/16*Math.PI*2,z=r+Math.cos(u)*10,T=P+Math.sin(u)*10,R=g(z,T),q=M(z,T,u);if(q<-1e4)continue;const oe=g(r+Math.sin(u)*2.5,P-Math.cos(u)*2.5),ae=g(r-Math.sin(u)*2.5,P+Math.cos(u)*2.5),H=-Math.abs(R-fo)+(ae>oe?1.5:0)+q;R>1.5&&H>j&&(j=H,F=u)}if(j>-1e8){l.e=r,l.n=P,l.th=F,l.vActual=l.v*.5;return}}};for(let l=0;l<t;l++){const m=k(),v=m<.12?"sitp_azul":m<.2?"sitp_amarillo":m<.38?"taxi":m<.54?"moto":m<.68?"hatch":m<.84?"suv":"sedan",F={e:0,n:0,th:0,v:v==="moto"?8+k()*4.5:v==="sitp_azul"||v==="sitp_amarillo"?5.2+k()*3:6.5+k()*5,vActual:0,model:null,u:0,tipo:v};K(F),N.push(F)}const Z=[];if(b.length>0)for(let l=0;l<42;l++){const m=b[Math.floor(k()*b.length)],v=d+(m%h+.5)*p,r=f+(Math.floor(m/h)+.5)*p;Z.push({e:v,n:r,th:k()*Math.PI*2,v:1.15+k()*.45,model:null,u:C(v,r)+.16,conPerro:l%3===0})}const ne=[],se=(l,m,v,r,P,F,j,i=.68)=>{for(let u=0;u<P;u++){const z=P===1?(l+m)*.5:l+u/(P-1)*(m-l);for(let T=0;T<F;T++){if(k()>i)continue;const R=F===1?(v+r)*.5:v+T/(F-1)*(r-v);if(g(z,R)>.3)continue;const q=k(),oe=q<.08?"taxi":q<.42?"suv":"sedan",ae=k()<.5?0:Math.PI,H=C(z,R);ne.push({e:z+(k()-.5)*.25,n:R+(k()-.5)*.25,u:H>-1.5?H:3.55,th:j+ae+(k()-.5)*.07,tipo:oe,model:null})}}};se(92,134,-22,62,4,15,.05,.7),se(52,108,114,146,5,4,.12,.62),se(58,106,-104,-56,4,6,.1,.65),se(-132,-98,-46,32,3,12,.04,.68);const ge=new x,ze=new Vt,Pe=new Y,Ae=(l,m=.08)=>{l.model&&(x.fromElements(l.e,l.n,l.u+m,ge),Vt.fromRotationZ(l.th,ze),Y.fromRotationTranslation(ze,ge,Pe),l.model.modelMatrix=Y.multiply(o,Pe,new Y))},tt={sedan:"carro.glb",suv:"carro_suv.glb",hatch:"carro_hatch.glb",taxi:"carro_taxi.glb",moto:"carro_moto.glb",sitp_azul:"sitp_azul.glb",sitp_amarillo:"sitp_amarillo.glb"},je=l=>l==="taxi"||l==="sitp_azul"||l==="sitp_amarillo",We=(async()=>{for(let l=0;l<N.length;l++){const m=N[l],v=tt[m.tipo];try{const r=await st.fromGltfAsync({url:a+v,upAxis:Te.Y,forwardAxis:Te.X,shadows:ye.ENABLED,color:je(m.tipo)?W.WHITE:W.fromCssColorString(vt[l%vt.length]),colorBlendMode:Lt.MIX,colorBlendAmount:je(m.tipo)?0:.32});e.scene.primitives.add(r),m.model=r,m.u=C(m.e,m.n),Ae(m)}catch{}l%6===5&&await new Promise(r=>setTimeout(r,35))}for(let l=0;l<Z.length;l++){const m=Z[l];try{const v=await st.fromGltfAsync({url:a+(m.conPerro?"persona_perro.glb":"persona.glb"),upAxis:Te.Y,forwardAxis:Te.X,shadows:ye.ENABLED,color:W.fromCssColorString(uo[l%uo.length]),colorBlendMode:Lt.MIX,colorBlendAmount:.25});e.scene.primitives.add(v),m.model=v,Ae(m,0)}catch{}l%6===5&&await new Promise(v=>setTimeout(v,35))}for(let l=0;l<ne.length;l++){const m=ne[l],v=tt[m.tipo];try{const r=await st.fromGltfAsync({url:a+v,upAxis:Te.Y,forwardAxis:Te.X,shadows:ye.ENABLED,color:je(m.tipo)?W.WHITE:W.fromCssColorString(vt[l*3%vt.length]),colorBlendMode:Lt.MIX,colorBlendAmount:je(m.tipo)?0:.32});e.scene.primitives.add(r),m.model=r,Ae(m)}catch{}l%8===7&&await new Promise(r=>setTimeout(r,30))}})();let Ce=!0,ve=0;const qe=(l,m)=>g(l,m)===0&&g(l+4,m)+g(l-4,m)+g(l,m+4)+g(l,m-4)>.5;return{ready:We,count:t,debug:()=>N.map(l=>[Math.round(l.e),Math.round(l.n),+l.u.toFixed(1),l.model?1:0]),setVisible(l){Ce=l;for(const m of N)m.model&&(m.model.show=l);for(const m of ne)m.model&&(m.model.show=l);for(const m of Z)m.model&&(m.model.show=l);for(const m of y)m.rig.setVisible(l);A.setVisible(l),L.setVisible(l)},update(l){if(!Ce)return;const m=Math.min(.08,Math.max(.001,l));ve+=m,L.update(ve);for(const v of y){const r=(ve+v.faseOffset)%24,P=r<10?"green":r<12?"yellow":"red",F=r>=12&&r<22?"green":r>=22?"yellow":"red";P!==v.nsEstado&&(v.nsEstado=P,v.rig.ns.setState(P)),F!==v.ewEstado&&(v.ewEstado=F,v.rig.ew.setState(F))}for(let v=0;v<N.length;v++){const r=N[v];if(!r.model)continue;let P=0,F=-1e9;for(let H=-4;H<=4;H++){const $=H*.13,D=r.th+$,ee=r.e+Math.cos(D)*9,ie=r.n+Math.sin(D)*9,ke=g(ee,ie);if(ke<1.1||g(r.e+Math.cos(D)*4.5,r.n+Math.sin(D)*4.5)<.9)continue;const Fe=M(ee,ie,D);if(Fe<-1e4)continue;const Le=g(ee+Math.sin(D)*2.5,ie-Math.cos(D)*2.5),Ye=g(ee-Math.sin(D)*2.5,ie+Math.cos(D)*2.5),Oe=-Math.abs(Math.min(ke,6)-fo)-Math.abs($)*1.6+(Ye>=Le?.6:0)+Fe;Oe>F&&(F=Oe,P=$)}if(F<-1e8||Math.hypot(r.e+180,r.n-250)>580){K(r),r.u=C(r.e,r.n),Ae(r);continue}const j=Math.cos(r.th),i=Math.sin(r.th);let u=1;const z=r.tipo==="sitp_azul"||r.tipo==="sitp_amarillo",T=z?9.5:6.4,R=z?16.5:12.5;for(let H=0;H<N.length;H++){if(H===v||!N[H].model)continue;const $=N[H],D=$.e-r.e,ee=$.n-r.n,ie=D*D+ee*ee;if(ie>320)continue;const ke=$.tipo==="sitp_azul"||$.tipo==="sitp_amarillo",fe=T+(ke?3:0),Fe=R+(ke?3:0),Le=D*j+ee*i,Ye=Math.abs(-D*i+ee*j);if(Le>0&&Le<Fe&&Ye<2.45){const Oe=Le<fe?0:(Le-fe)/(Fe-fe);Oe<u&&(u=Oe)}else ie<(z||ke?42:22)&&H<v&&(u=0)}const q=Math.abs(j)>Math.abs(i);for(const H of y){if((q?H.ewEstado:H.nsEstado)==="green")continue;const D=H.e-r.e,ee=H.n-r.n,ie=D*j+ee*i,ke=Math.abs(-D*i+ee*j);if(ie>7&&ie<21&&ke<9){const fe=ie<10.5?0:(ie-10.5)/10.5;fe<u&&(u=fe)}}const oe=1-Math.min(.55,Math.abs(P)*1.4),ae=r.v*oe*u;if(r.vActual+=(ae-r.vActual)*Math.min(1,m*4.5),r.vActual>.05){r.th+=Math.max(-1.4*m,Math.min(1.4*m,P));const H=r.e+Math.cos(r.th)*r.vActual*m,$=r.n+Math.sin(r.th)*r.vActual*m;g(H,$)>=.7?(r.e=H,r.n=$):r.th+=.6;const D=Math.max(C(r.e,r.n),C(r.e+Math.cos(r.th)*1.4,r.n+Math.sin(r.th)*1.4),C(r.e-Math.cos(r.th)*1.4,r.n-Math.sin(r.th)*1.4));r.u+=(D-r.u)*Math.min(1,m*8)}Ae(r)}for(const v of Z){if(!v.model)continue;const r=v.e+Math.cos(v.th)*v.v*m,P=v.n+Math.sin(v.th)*v.v*m;qe(r,P)&&Math.hypot(r+180,P-250)<430?(v.e=r,v.n=P,v.u+=(C(v.e,v.n)+.16-v.u)*Math.min(1,m*4)):v.th+=.9+k()*1.2,Ae(v,0)}}}}async function ho(e,o){try{const t=new Image;t.decoding="async",t.src=e,await t.decode();const a=document.createElement("canvas");a.width=t.naturalWidth,a.height=t.naturalHeight;const n=a.getContext("2d");n.drawImage(t,0,0);const s=n.getImageData(0,0,a.width,a.height);return new Je({typedArray:new Uint8Array(s.data.buffer),width:a.width,height:a.height,repeat:!0,minificationFilter:St.LINEAR_MIPMAP_LINEAR,magnificationFilter:Mt.LINEAR})}catch{return new Je({typedArray:new Uint8Array([...o,255]),width:1,height:1})}}function Ia(e,o){return new Ge({uniforms:{uNight:{type:I.FLOAT,value:0},uLadrillo:{type:I.SAMPLER_2D,value:e},uTeja:{type:I.SAMPLER_2D,value:o}},varyings:{vRP:de.VEC3,vRN:de.VEC3},vertexShaderText:`
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
        material.emissive = col * 0.14 * (1.0 - uNight);
        
      }
    `})}async function _a(e,o){const t=Ve.secciones;let a;try{a=await fetch(t+"revit.json").then(g=>g.json())}catch{return null}const[n,s]=await Promise.all([ho(t+"tex_ladrillo_hlf.webp",[190,112,74]),ho(t+"tex_teja.webp",[90,52,28])]),c=Ia(n,s),p=[];for(const g of a.niveles)try{const C=await st.fromGltfAsync({url:t+g.file,modelMatrix:o,upAxis:Te.Y,forwardAxis:Te.X,shadows:ye.ENABLED,backFaceCulling:!1,show:!1});C.customShader=c,C.imageBasedLighting.imageBasedLightingFactor=new Re(.45,.25),e.scene.primitives.add(C),p.push({...g,model:C,off:0,shown:!1,anim:null})}catch(C){console.warn("Nivel de Revit no cargado",g.file,C)}if(!p.length)return null;const d=new Y,f=g=>{const C=Y.fromTranslation(new x(0,0,g.off),d);g.model.modelMatrix=Y.multiply(o,C,new Y),g.model.show=g.shown},h=g=>1-Math.pow(1-g,3),w={niveles:p.map(g=>({i:g.i,nombre:g.nombre})),caja:a.caja,bloques:a.bloques??[],huella:a.huella??[],ready:!0,visible:!1,abierto:-1,play(){w.visible=!0,w.abierto=-1;for(const g of p)g.off=0,g.shown=!0,g.anim=null,f(g)},openAt(g){w.visible=!0,w.abierto=g;const C=performance.now();let S=0;for(const b of[...p].reverse())if(b.i>g){const B=22+(b.i-g)*7.5;b.shown=!0,f(b),b.anim={o0:b.off,o1:B,start:C+S++*70,dur:900,hideAtEnd:!0}}for(const b of p)b.i<=g&&(b.shown=!0,b.off!==0&&(b.anim={o0:b.off,o1:0,start:C,dur:600}),f(b))},full(){w.visible=!0,w.abierto=-1;const g=performance.now();let C=0;for(const S of p)S.shown=!0,S.off!==0?S.anim={o0:S.off,o1:0,start:g+C++*60,dur:800}:f(S)},hide(){w.visible=!1,w.abierto=-1;for(const g of p)g.anim=null,g.off=0,g.shown=!1,f(g)},setNight(g){c.setUniform("uNight",g)},update(g,C){if(w.visible)for(const S of p){const b=S.anim;if(!b||C<b.start)continue;const B=Math.min(1,(C-b.start)/b.dur),y=h(B);S.off=b.o0+(b.o1-b.o0)*y,B>=1&&(b.hideAtEnd&&(S.shown=!1),S.anim=null),f(S)}}};return w}function Na(e,o){const t=document.createElement("style");t.textContent=`
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
  `,document.head.appendChild(t);const a=document.createElement("aside");a.className="pisos",a.hidden=!0,a.innerHTML="";const n=new Map,s=(p,d,f)=>{const h=document.createElement("button");h.innerHTML=`${d}<span>${f}</span>`,h.addEventListener("click",()=>o(p)),n.set(p,h),a.appendChild(h)};s(-1,"Edificio completo",""),s(1,"Piso 2","N2"),document.body.appendChild(a);const c=p=>n.forEach((d,f)=>d.classList.toggle("on",f===p));return c(-1),{show:p=>{a.hidden=!p},mark:c}}const yt={dia:{sunIntensity:5.75,sunColor:"#ffe3c4",shadowDarkness:.38,aoIntensity:4,skyFill:.22,groundFill:.12,exposure:1.08,contrast:.39,saturation:.52,tintColor:"#dedede",vignette:.5,bloomBrightness:-.8,skyZenith:"#74777b",skyHorizon:"#c2c2d1",cloudDensity:.85,cloudSpeed:1,hazeAmount:0,hazeStart:2500},tarde:{sunIntensity:5.75,sunColor:"#ffe3c4",shadowDarkness:.38,aoIntensity:4,skyFill:.22,groundFill:.12,exposure:1.08,contrast:.39,saturation:.52,tintColor:"#dedede",vignette:.5,bloomBrightness:-.8,skyZenith:"#74777b",skyHorizon:"#c2c2d1",cloudDensity:.85,cloudSpeed:1,hazeAmount:0,hazeStart:2500},noche:{sunIntensity:.6,sunColor:"#6b8fd4",shadowDarkness:.85,aoIntensity:2.7,skyFill:.38,groundFill:.1,exposure:1.08,contrast:.41,saturation:.5,tintColor:"#bec7d5",vignette:.05,bloomBrightness:-.6,skyZenith:"#040611",skyHorizon:"#0a0f1f",cloudDensity:.24,cloudSpeed:.8,hazeAmount:.33,hazeStart:450}};function Ht(e){const o=/^#?([0-9a-f]{6})$/i.exec(e.trim());if(!o)return[1,1,1];const t=parseInt(o[1],16);return[(t>>16&255)/255,(t>>8&255)/255,(t&255)/255]}const Ha=[{title:"Sol y Sombras",items:[{key:"sunIntensity",label:"Intensidad sol",min:.2,max:6,step:.05,type:"range"},{key:"sunColor",label:"Color sol",type:"color"},{key:"shadowDarkness",label:"Luz en sombra",min:.05,max:.85,step:.01,type:"range"},{key:"aoIntensity",label:"Oclusión (AO)",min:0,max:4,step:.05,type:"range"},{key:"skyFill",label:"Relleno fachadas",min:0,max:.6,step:.01,type:"range"},{key:"groundFill",label:"Relleno suelo",min:0,max:.4,step:.01,type:"range"}]},{title:"Color y Cámara",items:[{key:"exposure",label:"Exposición",min:.6,max:1.6,step:.02,type:"range"},{key:"contrast",label:"Contraste",min:0,max:.6,step:.01,type:"range"},{key:"saturation",label:"Saturación",min:.4,max:1.6,step:.02,type:"range"},{key:"tintColor",label:"Tinte color",type:"color"},{key:"vignette",label:"Viñeta",min:0,max:.5,step:.01,type:"range"},{key:"bloomBrightness",label:"Bloom",min:-.8,max:.2,step:.02,type:"range"}]},{title:"Cielo, Nubes y Neblina",items:[{key:"skyZenith",label:"Cielo cenit",type:"color"},{key:"skyHorizon",label:"Cielo horizonte",type:"color"},{key:"cloudDensity",label:"Densidad nubes",min:0,max:1,step:.02,type:"range"},{key:"cloudSpeed",label:"Velocidad nubes",min:0,max:3,step:.05,type:"range"},{key:"hazeAmount",label:"Neblina",min:0,max:.5,step:.01,type:"range"},{key:"hazeStart",label:"Inicio neblina (m)",min:200,max:2500,step:50,type:"range"}]}];function Fa(e){const o={dia:{...yt.dia},tarde:{...yt.tarde},noche:{...yt.noche}};let t="dia";const a=document.createElement("button");a.id="btnLookStudio",a.className="look-toggle",a.textContent="⚙ Ajustar luz",a.title="Abrir editor de iluminación y color (L)",document.body.appendChild(a);const n=document.createElement("aside");n.id="lookPanel",n.className="look-panel",n.hidden=!0,n.innerHTML=`
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
  `,document.body.appendChild(n);const s=n.querySelector("#lpBody"),c=new Map;for(const w of Ha){const g=document.createElement("section");g.className="lp-sec";const C=document.createElement("h4");C.textContent=w.title,g.appendChild(C);for(const S of w.items){const b=document.createElement("label");b.className="lp-row";const B=document.createElement("span");B.className="lp-lbl",B.textContent=S.label,b.appendChild(B);const y=document.createElement("input");y.type=S.type,S.type==="range"&&(y.min=String(S.min),y.max=String(S.max),y.step=String(S.step));const A=S.type==="range"?document.createElement("span"):void 0;A&&(A.className="lp-val"),y.addEventListener("input",()=>{const k=o[t];if(S.type==="range"){const M=parseFloat(y.value);k[S.key]=M,A&&(A.textContent=S.step&&S.step>=1?String(Math.round(M)):M.toFixed(2))}else k[S.key]=y.value;e(t,k)});const L=document.createElement("div");L.className="lp-ctrl",L.appendChild(y),A&&L.appendChild(A),b.appendChild(L),g.appendChild(b),c.set(S.key,{input:y,val:A})}s.appendChild(g)}const p={dia:"Día · 10:10",tarde:"Tarde · 16:50",noche:"Noche · 19:35"};function d(){const w=o[t],g=n.querySelector("#lpPresetName");g&&(g.textContent=p[t]);for(const[C,{input:S,val:b}]of c){const B=w[C];if(S.value=String(B),b&&typeof B=="number"){const y=parseFloat(S.step||"0.01");b.textContent=y>=1?String(Math.round(B)):B.toFixed(2)}}}const f=()=>{n.hidden=!n.hidden,a.classList.toggle("on",!n.hidden)};a.addEventListener("click",f),n.querySelector("#lpClose")?.addEventListener("click",f);const h=n.querySelector("#lpCopy");return h.addEventListener("click",async()=>{const w=JSON.stringify({active:t,presets:o},null,2);try{await navigator.clipboard.writeText(w),h.textContent="¡JSON copiado!",setTimeout(()=>h.textContent="Copiar JSON",1800)}catch{prompt("Copia este JSON:",w)}}),n.querySelector("#lpReset")?.addEventListener("click",()=>{o[t]={...yt[t]},d(),e(t,o[t])}),addEventListener("keydown",w=>{w.code==="KeyL"&&!w.ctrlKey&&!w.metaKey&&!w.altKey&&f()}),d(),{setActivePreset(w){t=w,d()},getPreset(w){return o[w]},toggle:f}}const Oa={planos:{nombre:"Planos finales",o:{exposure:1.06,contrast:.18,saturation:1.08,tintColor:"#fff8f0",vignette:.1,shadowDarkness:.36,bloomBrightness:-.65,skyFill:.34,groundFill:.18,skyZenith:"#5f86b3",skyHorizon:"#d9dee0",hazeAmount:.06,hazeStart:600},sol:1},natural:{nombre:"Natural",o:{exposure:1.04,contrast:.2,saturation:1.05,tintColor:"#ffffff",vignette:.18,shadowDarkness:.45,bloomBrightness:-.6}},calido:{nombre:"Cálido",o:{exposure:1.06,contrast:.24,saturation:1.14,tintColor:"#fff0dc",vignette:.25,shadowDarkness:.42,bloomBrightness:-.5},sol:1.05},claro:{nombre:"Render claro",o:{exposure:1.16,contrast:.1,saturation:.96,tintColor:"#fbfcff",vignette:.08,shadowDarkness:.28,bloomBrightness:-.7}},cine:{nombre:"Cinematográfico",o:{exposure:.98,contrast:.42,saturation:.86,tintColor:"#f3ece3",vignette:.55,shadowDarkness:.5,bloomBrightness:-.45}},dramatico:{nombre:"Dramático",o:{exposure:.94,contrast:.55,saturation:1.1,tintColor:"#fff6ec",vignette:.62,shadowDarkness:.62,bloomBrightness:-.4},sol:1.12}};function Da(e,o,t){if(o==="panel")return e;const a=Oa[o],n={...e,...a.o};return n.exposure=e.exposure+((a.o.exposure??e.exposure)-e.exposure)*(1-t),n.sunIntensity=e.sunIntensity*(a.sol??1),n}const mo=4.7*Math.PI/180,Ba="2026-11-16",po=-18.6*Math.PI/180,Ro=11.68;function Ua(e){const o=(e-Ro)*15*Math.PI/180,t=Math.sin(mo)*Math.sin(po)+Math.cos(mo)*Math.cos(po)*Math.cos(o);return Math.asin(t)*180/Math.PI}const go=(e,o,t)=>{const a=Math.max(0,Math.min(1,(t-e)/(o-e)));return a*a*(3-2*a)},vo=e=>[1,3,5].map(o=>parseInt(e.slice(o,o+2),16)),Va=e=>"#"+e.map(o=>Math.round(Math.max(0,Math.min(255,o))).toString(16).padStart(2,"0")).join(""),it=(e,o,t)=>{const a=vo(e),n=vo(o);return Va(a.map((s,c)=>s+(n[c]-s)*t))};function yo(e,o,t){const a={...e};for(const n of Object.keys(e)){const s=e[n],c=o[n];a[n]=typeof s=="number"&&typeof c=="number"?s+(c-s)*t:typeof s=="string"&&typeof c=="string"&&s.startsWith("#")?it(s,c,t):t<.5?s:c}return a}function ja(e,o,t,a,n){const s=Ua(e),c=go(2,-7,s),p=go(26,6,s)*(1-c);let d=yo(t,a,p);d=yo(d,n,c),e<Ro&&(d={...d,sunColor:it(d.sunColor,"#fff1e2",.35*(1-c))});const f=o==="nublado"?1:o==="lluvia"?1.35:0;if(f){const C=Math.min(1,f);d={...d,sunIntensity:d.sunIntensity*(1-.68*C-(o==="lluvia"?.12:0)),shadowDarkness:d.shadowDarkness*(1-.6*C),cloudDensity:Math.max(d.cloudDensity,o==="lluvia"?1:.96),saturation:d.saturation*(1-.22*C),exposure:d.exposure*(1-(o==="lluvia"?.14:.06)),contrast:d.contrast*(1-.35*C),skyZenith:it(d.skyZenith,o==="lluvia"?"#5d636a":"#8a9097",.85*(1-c)),skyHorizon:it(d.skyHorizon,o==="lluvia"?"#868c93":"#b3b7bd",.85*(1-c)),sunColor:it(d.sunColor,"#dfe4ea",.6*C),hazeAmount:d.hazeAmount+(o==="lluvia"?.22:.1),hazeStart:d.hazeStart*(o==="lluvia"?.45:.7),bloomBrightness:d.bloomBrightness-.2}}const h=Math.floor(e),w=Math.floor((e-h)*60),g=Po.fromIso8601(`${Ba}T${String(h).padStart(2,"0")}:${String(w).padStart(2,"0")}:00-05:00`);return{look:d,night:c,tarde:p,fecha:g,lluvia:o==="lluvia"?1:0,etiqueta:`${String(h).padStart(2,"0")}:${String(w).padStart(2,"0")}`}}function Wa(){return new qt({name:"hlf_lluvia",uniforms:{uRain:0,uTime:0},fragmentShader:`
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
    `})}function qa(e){const o=document.createElement("style");o.textContent=`
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
    </select>`,document.body.appendChild(t);const a=t.querySelector("input")??document.createElement("input"),n=t.querySelector(".h")??document.createElement("span"),s=t.querySelector(".play")??document.createElement("button"),c=t.querySelector("select");c.addEventListener("change",()=>e.onFiltro(c.value)),a.value=String(e.hora),a.addEventListener("input",()=>e.onHora(Number(a.value)));let p=!0;return s.addEventListener("click",()=>{p=!p,s.textContent=p?"❚❚":"▶",e.onPlay(p)}),t.querySelectorAll("[data-clima]").forEach(d=>d.addEventListener("click",()=>{t.querySelectorAll("[data-clima]").forEach(f=>f.classList.toggle("on",f===d)),e.onClima(d.dataset.clima)})),{setHora(d,f){document.activeElement!==a&&(a.value=String(d)),n.textContent=f},setPlay(d){p=d,s.textContent=d?"❚❚":"▶"}}}const Ga=[{id:"hotel",label:"HOTEL LA FONTANA",category:"PROYECTO PRINCIPAL",enu:[-210,352,26],camera:{heading:.55,pitch:-.42,range:240,dur:2}},{id:"piso2",label:"REMODELACIÓN PISO 2",category:"INTERVENCIÓN BIM",enu:[-256,320,12],camera:{heading:.19,pitch:-1.55,range:68,dur:2}},{id:"plazoleta",label:"PLAZOLETA DE LA FUENTE",category:"ESPACIO PÚBLICO",enu:[-232,328,5],camera:{heading:.45,pitch:-.28,range:110,dur:1.8}},{id:"clinica127",label:"CLÍNICA 127 COLSUBSIDIO",category:"TORRE CORPORATIVA",enu:[-325,207,40],camera:{heading:.85,pitch:-.32,range:160,dur:2}},{id:"torres",label:"TORRES SANTA BÁRBARA",category:"RESIDENCIAL",enu:[-320,395,45],camera:{heading:.35,pitch:-.35,range:210,dur:2}},{id:"metro127",label:"METRO 127 · SONESTA",category:"HOTEL Y COMERCIO",enu:[-195,145,28],camera:{heading:1.25,pitch:-.34,range:190,dur:2}},{id:"panpaya",label:"PAN PA' YA · OLÍMPICA",category:"ZONA COMERCIAL",enu:[-84,300,16],camera:{heading:2.45,pitch:-.3,range:140,dur:2}},{id:"unicentro",label:"UNICENTRO BOGOTÁ",category:"CENTRO COMERCIAL",enu:[10,0,20],camera:{heading:.65,pitch:-.45,range:420,dur:2.2}}];function Ya(e,o){const t=document.createElement("div");t.className="mp-pins-overlay",e.container.appendChild(t);const a=Ga.map(d=>{const f=document.createElement("div");f.className="mp-pin",f.innerHTML=`
      <div class="mp-pin-card">
        <span class="mp-pin-flag"></span>
        <div class="mp-pin-content">
          ${d.category?`<span class="mp-pin-cat">${d.category}</span>`:""}
          <strong class="mp-pin-title">${d.label}</strong>
        </div>
      </div>
      <div class="mp-pin-line"></div>
      <div class="mp-pin-anchor"></div>
    `,f.addEventListener("click",w=>{w.stopPropagation(),o&&o(d)}),t.appendChild(f);const h=J(d.enu[0],d.enu[1],d.enu[2]);return{pin:d,el:f,worldPos:h}});let n=!1;t.style.display="none";const s=new Re;function c(){if(!n){t.style.display="none";return}t.style.display="block";const d=e.scene,f=d.camera;for(const h of a){const w=x.subtract(h.worldPos,f.positionWC,new x);if(x.dot(w,f.directionWC)<=0){h.el.style.display="none";continue}const C=x.distance(f.positionWC,h.worldPos);if(C>3500){h.el.style.display="none";continue}const S=Qo.worldToWindowCoordinates(d,h.worldPos,s);if(!S){h.el.style.display="none";continue}h.el.style.display="block",h.el.style.transform=`translate3d(${Math.round(S.x)}px, ${Math.round(S.y)}px, 0)`;const b=Math.max(.75,Math.min(1.05,1200/(C+300))),B=C>2600?Math.max(0,(3500-C)/900):1;h.el.style.opacity=B.toFixed(2),h.el.querySelector(".mp-pin-card").style.transform=`scale(${b.toFixed(2)})`}}const p=e.scene.preRender.addEventListener(c);return{container:t,get visible(){return n},setVisible(d){n=d,d||(t.style.display="none")},update:c,destroy(){p(),t.remove()}}}sa.defaultAccessToken=Ve.ionToken;const X=e=>document.getElementById(e),Yt=X("cesiumContainer"),ut=X("loading"),Xa=X("loadBar"),Io=X("loadLabel"),$a=X("loadPct");function De(e,o){Io.textContent=e;const t=Math.round(Math.max(0,Math.min(1,o))*100);Xa.style.width=t+"%",$a.textContent=t+"%"}const G=new ea(Yt,{animation:!1,timeline:!1,baseLayerPicker:!1,geocoder:!1,homeButton:!1,sceneModePicker:!1,navigationHelpButton:!1,fullscreenButton:!1,infoBox:!1,selectionIndicator:!1,shadows:!0,terrainShadows:ye.RECEIVE_ONLY,terrain:oa.fromWorldTerrain({requestWaterMask:!1,requestVertexNormals:!0}),baseLayer:ta.fromProviderAsync(zo.fromAssetId(Ve.imageryAssetId),{}),contextOptions:{webgl:{alpha:!1,antialias:!0,powerPreference:"high-performance",preserveDrawingBuffer:!1}},requestRenderMode:!1,useBrowserRecommendedResolution:!1}),O=G.scene;O.globe.enableLighting=!0;O.globe.showGroundAtmosphere=!0;O.globe.depthTestAgainstTerrain=!0;O.globe.maximumScreenSpaceError=2;O.fog.enabled=!1;O.fog.density=18e-5;O.fog.minimumBrightness=.04;O.highDynamicRange=!0;O.msaaSamples=4;O.postProcessStages.fxaa.enabled=!0;O.screenSpaceCameraController.enableCollisionDetection=!1;O.light=new aa({intensity:3,color:W.fromCssColorString("#fff4e3")});const _e=G.shadowMap;_e.softShadows=!0;_e.size=4096;_e.maximumDistance=1200;_e.darkness=.24;_e.normalOffset=!0;{const e=_e;e._primitiveBias.depthBias=8e-4,e._primitiveBias.normalOffsetScale=1.6,e._primitiveBias.normalShadingSmooth=.35}const He=O.postProcessStages.ambientOcclusion;He.enabled=!0;He.uniforms.intensity=2.1;He.uniforms.bias=.08;He.uniforms.lengthCap=.35;He.uniforms.stepSize=1.4;He.uniforms.blurStepSize=1;const Ee=O.postProcessStages.bloom;Ee.enabled=!0;Ee.uniforms.glowOnly=!1;Ee.uniforms.contrast=128;Ee.uniforms.brightness=-.36;Ee.uniforms.delta=1;Ee.uniforms.sigma=2.6;Ee.uniforms.stepSize=1.5;const Za=Gt(),Ft=e=>{const o=Y.getColumn(Za,e,new Ke);return new x(o.x,o.y,o.z)},xe=ya(Ft(0),Ft(1),Ft(2));O.postProcessStages.add(xe);const be=ba();O.postProcessStages.add(be);G.camera.frustum.fov=ht.toRadians(48);const bo=(()=>{try{const e=O.context._gl,o=e.getExtension("WEBGL_debug_renderer_info");return o?String(e.getParameter(o.UNMASKED_RENDERER_WEBGL)):""}catch{return""}})(),Ka=/Intel|UHD|Iris|Mali|Adreno|Apple GPU|SwiftShader/i.test(bo)&&!/Arc/i.test(bo);let E=null,le=Ka||matchMedia("(pointer: coarse)").matches?.5:1;function Qe(){const e=Math.min(window.devicePixelRatio||1,2);G.resolutionScale=e,_e.size=le>=1?4096:le>=.5?2048:1024,_e.softShadows=le>=.5,He.enabled=le>=1,Ee.enabled=le>=.5,O.msaaSamples=le>=.5?4:2,G.shadows=le>=.5,E?.tileset&&(E.tileset.maximumScreenSpaceError=le>=1?8:le>=.5?12:20)}Qe();G.clock.shouldAnimate=!1;G.clock.currentTime=Po.fromIso8601("2026-06-21T16:50:00-05:00");const _=new ha(G),_o=e=>J(_t[e].e,_t[e].n,_t[e].u);_.flyTo({pivot:J(-255,320,12),heading:.55,pitch:-.42,range:260},0);_.groundHeight=e=>O.globe.getHeight(e);const Ja=[{id:"dia",iso:"2026-06-21T16:50:00-05:00",night:.04,tarde:1,fog:22e-5,label:"10:10",sun:5.75,color:"#ffe3c4"},{id:"tarde",iso:"2026-06-21T16:50:00-05:00",night:.04,tarde:1,fog:22e-5,label:"16:50",sun:5.75,color:"#ffe3c4"},{id:"noche",iso:"2026-06-21T19:35:00-05:00",night:1,tarde:0,fog:22e-5,label:"19:35",sun:.6,color:"#6b8fd4"}];let he=.04,Ue=1;function Tt(e){O.light.intensity=e.sunIntensity,O.light.color=W.fromCssColorString(e.sunColor),_e.darkness=e.shadowDarkness,He.uniforms.intensity=e.aoIntensity,Ee.uniforms.brightness=e.bloomBrightness,be.uniforms.uExposure=e.exposure,be.uniforms.uContrast=e.contrast,be.uniforms.uSaturation=e.saturation;const[o,t,a]=Ht(e.tintColor);be.uniforms.uTint=new x(o,t,a),be.uniforms.uVignette=e.vignette;const[n,s,c]=Ht(e.skyZenith);xe.uniforms.uSkyZenith=new x(n,s,c);const[p,d,f]=Ht(e.skyHorizon);xe.uniforms.uSkyHorizon=new x(p,d,f),xe.uniforms.uCloudDensity=e.cloudDensity,xe.uniforms.uCloudSpeed=e.cloudSpeed,E?.setLook({skyFill:e.skyFill,groundFill:e.groundFill,hazeAmount:e.hazeAmount,hazeStart:e.hazeStart})}const lt=Fa((e,o)=>Tt(o));Tt(lt.getPreset("dia"));xe.uniforms.uNight=he;xe.uniforms.uTarde=Ue;be.uniforms.uNight=he;be.uniforms.uTarde=Ue;O.skyAtmosphere&&(O.skyAtmosphere.hueShift=0,O.skyAtmosphere.saturationShift=.08,O.skyAtmosphere.brightnessShift=-.04);const Qa={dia:10.17,tarde:16.83,noche:19.58};let me=10.17,nt="sol",No="planos",kt=!1,Be=null,ct=-1;const Xt=O.postProcessStages.add(Wa()),$t=qa({hora:me,onHora:e=>{me=e,Be=null,kt=!1,$t.setPlay(!1)},onClima:e=>{nt=e,ct=-1},onPlay:e=>{kt=e},onFiltro:e=>{No=e,ct=-1}});function ei(){const e=ja(me,nt,lt.getPreset("dia"),lt.getPreset("tarde"),lt.getPreset("noche"));G.clock.currentTime=e.fecha,Tt(Da(e.look,No,e.night)),he=e.night,Ue=e.tarde,E?.setNight(he),E?.setTarde(Ue),V?.setNight(he),xe.uniforms.uNight=he,xe.uniforms.uTarde=Ue,be.uniforms.uNight=he,be.uniforms.uTarde=Ue,Xt.uniforms.uRain=e.lluvia,O.skyAtmosphere&&(O.skyAtmosphere.brightnessShift=-.55*he-(nt==="lluvia"?.2:nt==="nublado"?.08:0),O.skyAtmosphere.saturationShift=.06-.3*he-(nt==="sol"?0:.35));const o=X("clockLabel");o&&(o.textContent=e.etiqueta),$t.setHora(me,e.etiqueta);const t=he>.5?"noche":Ue>.5?"tarde":"dia";document.querySelectorAll("[data-light]").forEach(a=>a.classList.toggle("on",a.dataset.light===t))}function ti(e){kt=!1,$t.setPlay(!1),Be={from:me,to:Qa[e.id]??me,start:performance.now()}}document.querySelectorAll("[data-light]").forEach(e=>{e.addEventListener("click",()=>{const o=Ja.find(t=>t.id===e.dataset.light);o&&ti(o)})});let $e=!1;const jt=X("btnOrbit"),Zt=X("btnPedestrian"),we=X("btnPiso2"),Ie=X("btnEdificioCompleto");function ue(){$e=!1,jt?.classList.remove("on")}function Et(e=2){ue(),_.isWalking&&_.exitWalk(),we?.classList.remove("on"),Ie?.classList.add("on"),pe?.mark(-1),pe?.show(!0),V?.full(),_.flyTo({pivot:J(-255,320,12),heading:.55,pitch:-.42,range:260},e)}Ie?.addEventListener("click",()=>Et(2));function zt(e,o=2){ue(),we?.classList.remove("on"),Ie?.classList.remove("on"),V&&V.abierto>=0&&(V.full(),pe?.mark(-1));const t=ca[e];_.flyTo({pivot:_o(t.place),heading:t.heading,pitch:t.pitch,range:t.range},o)}X("btnHome")?.addEventListener("click",()=>zt("general",2.2));X("btnAerial")?.addEventListener("click",()=>zt("aerial"));X("btnArch")?.addEventListener("click",()=>zt("arch"));Zt?.addEventListener("click",()=>{ue(),we?.classList.remove("on"),Ie?.classList.remove("on"),_.isWalking?_.exitWalk():_.enterWalk(ce?Oo(ce):void 0)});_.onModeChange=e=>{Zt?.classList.toggle("on",e);const o=X("hint");o&&e&&(o.textContent="Peatonal: arrastra para mirar · WASD o flechas para caminar · Shift para correr · Doble clic para ir a un punto",o.classList.remove("fade"),setTimeout(()=>o.classList.add("fade"),7e3))};document.querySelectorAll("[data-place]").forEach(e=>{e.addEventListener("click",()=>{ue();const o=e.dataset.place;if(o==="hotel"&&E){const t=E.buildings.find(a=>a.s==="Hotel");if(t){Ne(null),Ne(t);return}}_.flyTo({pivot:_o(o),range:o==="hotel"?300:520,pitch:-.5},2)})});jt?.addEventListener("click",()=>{$e=!$e,jt.classList.toggle("on",$e),$e&&_.isWalking&&_.exitWalk()});const xo=Ya(G,e=>{if(ue(),e.id==="piso2"){we?.click();return}if(e.id==="hotel"&&E){const t=E.buildings.find(a=>a.s==="Hotel");if(t){Ne(null),Ne(t);return}}const o=J(e.enu[0],e.enu[1],e.enu[2]);_.flyTo({pivot:o,heading:e.camera.heading,pitch:e.camera.pitch,range:e.camera.range},e.camera.dur??2)}),wo=X("btnPins");wo?.addEventListener("click",()=>{const e=!xo.visible;xo.setVisible(e),wo.classList.toggle("on",e)});Yt.addEventListener("pointerdown",ue);Yt.addEventListener("wheel",ue,{passive:!0});addEventListener("keydown",e=>{et!=="sitio"||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||(e.code==="Escape"&&(_.isWalking?_.exitWalk():Ne(null)),(e.code==="KeyH"||e.code==="Home")&&zt("general",2.2),e.code==="KeyP"&&Zt?.click())});let ce=null,Kt=null;const oi=9;let wt=null,V=null,pe=null,Wt=!1,Co=!1;async function ai(){Co||(Co=!0,await ft(),!(!E||!V)&&(ue(),ii(),E?.startBackground()))}function ii(){if(!E)return;const e=E.buildings.find(t=>t.s==="Hotel"),o=_.flyTo.bind(_);_.flyTo=()=>{};try{e?(Ne(e),Ze&&(Ze.hidden=!0)):Pt()}finally{_.flyTo=o}}let bt=null;function ft(){return bt||(bt=(async()=>{E&&(V=await _a(G,E.matrix),V&&(V.setNight(he),E.setRevitBlocks(V.bloques,V.huella),pe=Na(V,e=>{if(V)if(ue(),pe?.mark(e),we?.classList.toggle("on",e===1),Ie?.classList.toggle("on",e<0),e<0)Et(2);else if(e===1)Ie?.classList.remove("on"),V.openAt(1),_.flyTo({pivot:J(-222,278,12),heading:.1928,pitch:-1.55,range:105},2.5);else{Ie?.classList.remove("on"),we?.classList.remove("on"),V.openAt(e);const o=V.caja;_.flyTo({pivot:J((o[0]+o[2])/2,(o[1]+o[3])/2,12),pitch:-.95,range:150},2)}}),Wt&&(Wt=!1,Pt(),Se&&(G.entities.remove(Se),Se=null))))})(),bt)}async function Ho(){if(ue(),_.isWalking&&_.exitWalk(),await ft(),!V)return;E?.setRevitBlocks(V.bloques,V.huella),we?.classList.contains("on")&&V.abierto===1?Et(2):(we?.classList.add("on"),Ie?.classList.remove("on"),pe?.mark(1),pe?.show(!0),V.openAt(1),_.flyTo({pivot:J(-222,278,12),heading:.1928,pitch:-1.55,range:105},2.5))}we?.addEventListener("click",()=>void Ho());function Pt(){!E||!V||(E.setRevitBlocks(V.bloques,V.huella),V.play(),pe?.mark(-1),pe?.show(!0))}function Fo(){E&&(wt={start:performance.now()},E.setHotelFloors(0))}let Se=null;const Ze=X("card");function ni(e){return J((e.bb[0]+e.bb[2])/2,(e.bb[1]+e.bb[3])/2,e.b+e.h*.5)}function Oo(e){return J((e.bb[0]+e.bb[2])/2,e.bb[1]-9,e.b)}function Ne(e){const o=ce?.s==="Hotel";if(ce=e,e?.s!=="Hotel"&&we?.classList.remove("on"),Se&&(G.entities.remove(Se),Se=null),!e||!E){Ze&&(Ze.hidden=!0),pe?.show(!1);return}if(e.s!=="Hotel"?pe?.show(!1):V?.visible&&pe?.show(!0),e.s!=="Hotel"){const f=e.r.map(([w,g])=>J(w,g,0,E.matrix)),h=2572+e.b-.5;Se=G.entities.add({polygon:{hierarchy:new na(f),height:h,extrudedHeight:h+e.h+2.2,material:W.fromCssColorString("#9dc4ea").withAlpha(.2),outline:!0,outlineColor:W.fromCssColorString("#d7ebff"),shadows:ye.DISABLED}})}const t=e.s==="Hotel";t&&window.dispatchEvent(new CustomEvent("hlf:hotel")),t&&!o&&(V?(Pt(),Se&&(G.entities.remove(Se),Se=null)):(Wt=!0,ft(),Fo()),ue(),Ie?.classList.add("on"),we?.classList.remove("on"),_.flyTo({pivot:J(-255,320,12),heading:.55,pitch:-.42,range:260},1.8));const a=t&&E?E.buildings.filter(f=>f.s==="Hotel"):[e],n=f=>Math.abs(f.r.reduce((h,w,g)=>{const C=f.r[(g+1)%f.r.length];return h+w[0]*C[1]-C[0]*w[1]},0)/2),s=a.reduce((f,h)=>f+n(h),0),c=a.reduce((f,h)=>f+n(h)*h.p,0),p=Math.max(...a.map(f=>f.p)),d=Math.max(...a.map(f=>f.h));Math.abs(e.r.reduce((f,h,w)=>{const g=e.r[(w+1)%e.r.length];return f+h[0]*g[1]-g[0]*h[1]},0)/2),X("cardKind").textContent=t?"Proyecto":`Sector ${e.s}`,X("cardTitle").textContent=t?"Hotel La Fontana":`Edificación ${e.id+1}`,X("cardData").innerHTML=`<dt>Pisos</dt><dd>${t?"hasta "+p:e.p}</dd><dt>Altura</dt><dd>${d.toFixed(1)} m</dd><dt>Huella</dt><dd>${Math.round(s).toLocaleString("es-CO")} m²</dd><dt>Área aprox.</dt><dd>${Math.round(c).toLocaleString("es-CO")} m²</dd>`,Ze&&(Ze.hidden=!1)}_.onPick=e=>{!E||et!=="sitio"||Ne(e?E.buildingAt(e):null)};X("cardClose")?.addEventListener("click",()=>Ne(null));X("cardFocus")?.addEventListener("click",()=>{if(!ce)return;ue();const e=Math.max(ce.bb[2]-ce.bb[0],ce.bb[3]-ce.bb[1],ce.h);_.flyTo({pivot:ni(ce),pitch:-.42,range:Math.max(60,e*2.1)},1.7)});X("cardWalk")?.addEventListener("click",()=>{ce&&(ue(),_.enterWalk(Oo(ce)))});const Ot=X("status"),ko=X("statusText");async function si(e=25e3){const o=performance.now()+e;let t=0;for(;performance.now()<o;){const a=O.globe.tilesLoaded,n=!E?.tileset||E.tileset.tilesLoaded;if(a&&n){if(t||(t=performance.now()),performance.now()-t>=600)break}else t=0;await new Promise(s=>setTimeout(s,150))}for(let a=0;a<8;a++)await new Promise(n=>requestAnimationFrame(n))}async function ri(){De("Cargando el modelo del hotel...",.05),await new Promise(t=>setTimeout(t,30)),E=await Sa(G,(t,a)=>De(t,.05+a*.2),(t,a,n)=>{De(`Cargando secciones (${t}/${a}) · ${n}`,.25+t/Math.max(1,a)*.45),!(!Ot||!ko)&&(Ot.hidden=!1,ko.textContent=t<a?`Cargando secciones ${t}/${a} · ${n}`:`Modelo completo · ${a} secciones`,t>=a&&setTimeout(()=>Ot.classList.add("fade"),2600))}),E.setNight(he),E.setTarde(Ue),ft();const e=document.querySelector("[data-light].on")?.dataset.light||"dia";Tt(lt.getPreset(e)),Qe(),_.flyTo({pivot:J(-255,320,12),heading:.55,pitch:-.42,range:260},0),E.startBackground(),De("Preparando el Hotel La Fontana...",.55),await ft(),De("Hotel listo · la ciudad termina de cargar en segundo plano",.8),De("Preparando la llegada...",.85),Ra(G,E.matrix).then(t=>{Kt=t}),window.__ALL__=!0,De("Renderizando...",.94),await si(3500),De("Listo",1),ut.classList.add("done"),setTimeout(()=>{ut.hidden=!0},900),setTimeout(()=>void ai(),3300);const o=X("hint");o&&setTimeout(()=>o.classList.add("fade"),9e3),window.__READY__=!0}const re={fps:0,frames:0,t0:performance.now(),low:0};window.__DBG__={Cesium:ia,viewer:G,cam:_,getSite:()=>E,enuToWorld:J,select:Ne,stats:re,playHotel:Fo,playRevit:Pt,getRevit:()=>V,getTrafico:()=>Kt,setQuality:e=>{le=e,Qe()}};let et="pais",Dt=null;const dt=()=>J(-255,320,12),Ct={heading:.55,pitch:-.62,range:2600};function Do(e){xe.enabled=e,be.enabled=e,Xt.enabled=e,e?Qe():(He.enabled=!1,Ee.enabled=!1,G.shadows=!1,O.msaaSamples=2),O.globe.enableLighting=e}function At(){et="pais",_.active=!1,O.screenSpaceCameraController.enableInputs=!0,Do(!1),document.body.dataset.modo="pais"}function li(e=2.6){At(),G.camera.flyTo({destination:x.fromDegrees(-77.6,3.4,26e5),orientation:{heading:0,pitch:ht.toRadians(-82),roll:0},duration:e})}function ci(e,o,t=18e3,a=2.4){At(),G.camera.flyTo({destination:x.fromDegrees(e,o-t/16e4,t),orientation:{heading:0,pitch:ht.toRadians(-55),roll:0},duration:a})}function Mo(){et="sitio",Do(!0),O.screenSpaceCameraController.enableInputs=!1,_.flyTo({pivot:dt(),...Ct},0),_.active=!0,_.flyTo({pivot:dt(),heading:.55,pitch:-.42,range:260},3.2),document.body.dataset.modo="sitio"}async function di(){const e=new To(Ct.heading,Ct.pitch,Ct.range);if(E){G.camera.flyToBoundingSphere(new Rt(dt(),1),{offset:e,duration:3,complete:Mo});return}At(),ut.hidden=!1,ut.classList.remove("done");const o=new Promise(t=>G.camera.flyToBoundingSphere(new Rt(dt(),1),{offset:e,duration:5.5,complete:()=>t(),cancel:()=>t()}));Dt??(Dt=ri());try{await Promise.all([Dt,o])}catch(t){console.error(t),Io.textContent="No se pudo cargar la escena. Revisa la conexión y vuelve a intentar.",Dt=null;return}G.camera.flyToBoundingSphere(new Rt(dt(),1),{offset:e,duration:0}),Mo()}window.HLF={entrar:di,vistaColombia:li,volarA:ci,viewer:G,get modo(){return et},piso2:()=>void Ho(),completo:()=>Et(2)};At();G.camera.setView({destination:x.fromDegrees(-77.6,3.4,26e5),orientation:{heading:0,pitch:ht.toRadians(-82),roll:0}});ut.hidden=!0;window.dispatchEvent(new CustomEvent("hlf:listo"));let So=performance.now(),Bt=0;function Bo(){const e=performance.now(),o=Math.min(.1,(e-So)/1e3);if(So=e,Be){const a=Math.min(1,(e-Be.start)/1800),n=a<.5?4*a*a*a:1-Math.pow(-2*a+2,3)/2;me=Be.from+(Be.to-Be.from)*n,a>=1&&(Be=null)}else kt&&(me+=o/7,me>20.6&&(me=5.6));if((Math.abs(me-ct)>.004||ct<0)&&(ct=me,ei()),Xt.uniforms.uTime=e*.001,wt&&E){const a=(e-wt.start)/550,n=Math.floor(a),s=a-n,c=1-Math.pow(1-Math.min(1,s*1.6),3);n>=oi?(E.setHotelFloors(99),wt=null):E.setHotelFloors(n+c)}V?.update(o,e),Kt?.update(o);const t=e*.001;if(E?.setTime(t),xe.uniforms.uTime=t,$e&&et==="sitio"&&!_.isWalking&&_.flyTo({heading:_.state.heading+.16*o},0),_.update(o),re.frames++,e-re.t0>=2e3){re.fps=Math.round(re.frames*1e3/(e-re.t0)),re.frames=0,re.t0=e,window.__FPS__=re.fps;const a=!!E&&E.sections.loaded>=E.sections.total&&e-Bt>8e3;E&&E.sections.loaded>=E.sections.total&&!Bt&&(Bt=e),a&&document.visibilityState==="visible"&&(re.fps<20&&le>.25&&!window.__DBG__.lock?++re.low>=3&&(le=le>=1?.5:.25,re.low=0,Qe()):re.low=0)}requestAnimationFrame(Bo)}requestAnimationFrame(Bo);addEventListener("resize",Qe);
