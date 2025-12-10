// ============ Canvas ============
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

// Audio
const sfxHit = document.getElementById("sfx-hit");
const sfxBlast = document.getElementById("sfx-blast");
const sfxPower = document.getElementById("sfx-power");
const sfxHigh = document.getElementById("sfx-high");

// ============ Player ============
let player = {
  x: innerWidth / 2,
  y: innerHeight / 2,
  size: 40,
  speed: 6
};

// Keyboard movement (OK)
let keys = { left:false, right:false, up:false, down:false };

document.addEventListener("keydown", e=>{
  if(e.key==="ArrowLeft") keys.left=true;
  if(e.key==="ArrowRight") keys.right=true;
  if(e.key==="ArrowUp") keys.up=true;
  if(e.key==="ArrowDown") keys.down=true;
});
document.addEventListener("keyup", e=>{
  if(e.key==="ArrowLeft") keys.left=false;
  if(e.key==="ArrowRight") keys.right=false;
  if(e.key==="ArrowUp") keys.up=false;
  if(e.key==="ArrowDown") keys.down=false;
});

// ============ JOYSTICK ONLY (Finger follow OFF) ============
const joyOuter = document.getElementById("joystickOuter");
const joyInner = document.getElementById("joystickInner");

let joyActive = false;
let joyX = 0, joyY = 0;

joyOuter.addEventListener("touchstart", ()=> joyActive = true );

joyOuter.addEventListener("touchmove", e=>{
  const rect = joyOuter.getBoundingClientRect();
  const t = e.touches[0];

  const x = t.clientX - (rect.left + rect.width/2);
  const y = t.clientY - (rect.top + rect.height/2);

  const max = 40;
  const dist = Math.hypot(x,y) || 1;
  const lim = dist > max ? max/dist : 1;

  joyX = x * lim;
  joyY = y * lim;

  joyInner.style.left = (rect.width/2 - 22 + joyX) + "px";
  joyInner.style.top  = (rect.height/2 - 22 + joyY) + "px";

  e.preventDefault();
}, {passive:false});

joyOuter.addEventListener("touchend", ()=>{
  joyActive = false;
  joyX=joyY=0;
  joyInner.style.left = "38px";
  joyInner.style.top = "38px";
});

// ============ Move Player ============
function movePlayer(){
  if(keys.left) player.x -= player.speed;
  if(keys.right) player.x += player.speed;
  if(keys.up) player.y -= player.speed;
  if(keys.down) player.y += player.speed;

  if(joyActive){
    player.x += joyX * 0.15;
    player.y += joyY * 0.15;
  }

  // Boundaries
  player.x = Math.max(0, Math.min(canvas.width-player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height-player.size, player.y));
}

// ============ Obstacles ============
let topObs = [];
let bottomObs = [];

setInterval(()=>{
  const s=40;
  topObs.push({x:Math.random()*canvas.width, y:-s, size:s, speed:4});
}, 800);

setInterval(()=>{
  const s=40;
  bottomObs.push({x:Math.random()*canvas.width, y:canvas.height+s, size:s, speed:4});
}, 900);

// ============ Power Ups ============
let powerups = [];
let shield=false, shieldTTL=0;
let slow=false, slowTTL=0;

function spawnPU(){
  if(powerups.length>=3) return;

  const types=["shield","slow","bomb"];
  const t = types[Math.floor(Math.random()*3)];

  powerups.push({
    x:Math.random()*canvas.width,
    y:Math.random()*canvas.height*0.7+80,
    type:t,
    ttl:600
  });
}
setInterval(spawnPU,7000);

// ============ VFX ============ 
let particles = [];
let flash = 0;

function spawnBlast(cx,cy){
  flash = 12;
  for(let i=0;i<50;i++){
    particles.push({
      x:cx, y:cy,
      vx:(Math.random()-0.5)*14,
      vy:(Math.random()-0.5)*14,
      life:40
    });
  }
}

// ============ Collision ============
function hit(a,b){
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

// ============ Game State ============
let score=0;
let maxScore = Number(localStorage.getItem("maxScore"))||0;
document.getElementById("maxScoreDisplay").textContent = "Max: "+maxScore;

let gameOver=false;

// ============ Game Over ============
function endGame(){
  gameOver = true;

  if(score > maxScore){
    maxScore = score;
    localStorage.setItem("maxScore",maxScore);
    spawnBlast(player.x,player.y);
    sfxHigh.play();
  }
  else sfxHit.play();

  document.getElementById("gameOverText").textContent = "Score: "+score;
  document.getElementById("gameOverScreen").style.display = "flex";
}

// ============ Restart ============
function restartGame(){
  gameOver=false;
  score=0;
  topObs=[];
  bottomObs=[];
  powerups=[];
  particles=[];
  flash=0;
  shield=false;
  slow=false;

  document.getElementById("pu-shield").classList.remove("used");
  document.getElementById("pu-slow").classList.remove("used");

  document.getElementById("gameOverScreen").style.display = "none";
  update();
}

// ============ Main Loop ============
function update(){
  if(gameOver) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  movePlayer();

  // Draw player
  ctx.fillStyle="#00e6c6";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Obstacles top
  topObs.forEach(o=>{
    o.y += slow? o.speed*0.4 : o.speed;
    ctx.fillStyle="red";
    ctx.fillRect(o.x,o.y,o.size,o.size);
    if(hit(player,o)){
      if(shield){ shield=false; }
      else endGame();
    }
  });

  // Obstacles bottom
  bottomObs.forEach(o=>{
    o.y -= slow? o.speed*0.4 : o.speed;
    ctx.fillStyle="orange";
    ctx.fillRect(o.x,o.y,o.size,o.size);
    if(hit(player,o)){
      if(shield){ shield=false; }
      else endGame();
    }
  });

  // Powerups
  powerups.forEach((p,i)=>{
    ctx.font="32px serif";
    ctx.fillText(
      p.type==="shield"?"🛡️":p.type==="slow"?"🐌":"💣",
      p.x,p.y
    );

    if(hit(player,{x:p.x,y:p.y,size:40})){

      sfxPower.play();

      if(p.type==="shield"){
        shield=true; shieldTTL=360;
        document.getElementById("pu-shield").classList.add("used");
      }
      else if(p.type==="slow"){
        slow=true; slowTTL=300;
        document.getElementById("pu-slow").classList.add("used");
      }
      else {
        spawnBlast(player.x,player.y);
        topObs=[];
        bottomObs=[];
      }

      powerups.splice(i,1);
    }

    p.ttl--;
    if(p.ttl<=0) powerups.splice(i,1);
  });

  // Timers
  if(shield){ shieldTTL--; if(shieldTTL<=0){ shield=false; document.getElementById("pu-shield").classList.remove("used"); }}
  if(slow){ slowTTL--; if(slowTTL<=0){ slow=false; document.getElementById("pu-slow").classList.remove("used"); }}

  // VFX
  if(flash>0){ ctx.fillStyle="rgba(255,255,255,0.2)"; ctx.fillRect(0,0,canvas.width,canvas.height); flash--; }

  particles.forEach((p,i)=>{
    ctx.fillStyle="#ff8a65";
    ctx.fillRect(p.x,p.y,4,4);
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.3;
    p.life--;
    if(p.life<=0) particles.splice(i,1);
  });

  score++;
  document.getElementById("scoreDisplay").textContent = "Score: "+score;

  requestAnimationFrame(update);
}

update();
