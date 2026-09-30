let board = Array(9).fill("");
let currentPlayer = "X";
let result = "playing";
let difficulty = "hard";
let humanScore = 0;
let aiScore = 0;
let thinking = false;
let winningCells = [];
let aiTimer = null;

const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function openGame(game) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  if (game === "pool") {
    document.getElementById("pool").classList.add("active");
    if (window.poolGame) window.poolGame.reset();
  } else {
    document.getElementById("game").classList.add("active");
    render();
  }
}
function showHome() {
  if (window.poolGame) window.poolGame.stop();
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("home").classList.add("active");
}
function render(animateIndex=null) {
  const boardEl=document.getElementById("board"); boardEl.innerHTML="";
  board.forEach((value,index)=>{const button=document.createElement("button");button.className="cell"+(value==="X"?" x":"")+(value==="O"?" o":"")+(winningCells.includes(index)?" win":"");button.textContent=value;button.disabled=thinking||result!=="playing"||value!==""||currentPlayer!=="X";button.setAttribute("aria-label",value?`${value} mark`:`Empty square ${index+1}`);button.onclick=()=>playerMove(index);if(index===animateIndex&&value!=="")button.classList.add("just-played");boardEl.appendChild(button);});
  document.getElementById("humanScore").textContent=humanScore;document.getElementById("aiScore").textContent=aiScore;
  const status=document.getElementById("status");status.classList.remove("win-status","ai-status");
  if(result==="playing"){status.textContent=thinking?"AI is thinking…":"Your turn";if(thinking)status.classList.add("ai-status");}
  else if(result==="human"){status.textContent="You win 🎉";status.classList.add("win-status");}
  else if(result==="ai"){status.textContent="AI wins";status.classList.add("ai-status");}else status.textContent="Draw";
  document.querySelectorAll(".segmented button").forEach(b=>b.classList.toggle("selected",b.dataset.level===difficulty));
}
function playerMove(index){if(thinking||result!=="playing"||board[index]!=="")return;board[index]="X";currentPlayer="O";if(finishIfNeeded("X")){render(index);return;}thinking=true;render(index);aiTimer=setTimeout(()=>{const move=getAIMove();if(move!==null)board[move]="O";currentPlayer="X";thinking=false;finishIfNeeded("O");render(move);aiTimer=null;},350);}
function finishIfNeeded(player){const pattern=wins.find(row=>row.every(i=>board[i]===player));if(pattern){winningCells=pattern;if(player==="X")humanScore++;else aiScore++;result=player==="X"?"human":"ai";return true;}if(board.every(cell=>cell!=="")){result="draw";return true;}return false;}
function getAIMove(){const available=board.map((v,i)=>v===""?i:null).filter(v=>v!==null);if(!available.length)return null;if(difficulty==="easy")return available[Math.floor(Math.random()*available.length)];if(difficulty==="medium")return mediumMove(available);return bestMove();}
function mediumMove(a){const w=immediateMove("O");if(w!==null)return w;const b=immediateMove("X");if(b!==null)return b;if(board[4]==="")return 4;const c=[0,2,6,8].filter(i=>board[i]==="");if(c.length)return c[Math.floor(Math.random()*c.length)];return a[Math.floor(Math.random()*a.length)];}
function immediateMove(player){for(const index of board.keys()){if(board[index]!=="")continue;const t=[...board];t[index]=player;if(wins.some(row=>row.every(i=>t[i]===player)))return index;}return null;}
function bestMove(){let best=-Infinity,choices=[];for(const index of board.keys()){if(board[index]!=="")continue;const t=[...board];t[index]="O";const score=minimax(t,0,false);if(score>best){best=score;choices=[index];}else if(score===best)choices.push(index);}return choices[Math.floor(Math.random()*choices.length)];}
function minimax(state,depth,maximizing){if(isWinner("O",state))return 10-depth;if(isWinner("X",state))return depth-10;if(state.every(c=>c!==""))return 0;if(maximizing){let best=-Infinity;for(const i of state.keys()){if(state[i]!=="")continue;const n=[...state];n[i]="O";best=Math.max(best,minimax(n,depth+1,false));}return best;}let best=Infinity;for(const i of state.keys()){if(state[i]!=="")continue;const n=[...state];n[i]="X";best=Math.min(best,minimax(n,depth+1,true));}return best;}
function isWinner(player,state){return wins.some(row=>row.every(i=>state[i]===player));}
function newGame(){if(aiTimer!==null){clearTimeout(aiTimer);aiTimer=null;}board=Array(9).fill("");currentPlayer="X";result="playing";thinking=false;winningCells=[];render();}
function setDifficulty(level){if(thinking)return;difficulty=level;newGame();}

// Lightweight, dependency-free 8-Ball pool game. Uses a canvas for a real playable table.
(function(){
  const canvas=document.getElementById("poolCanvas"); if(!canvas)return;
  const ctx=canvas.getContext("2d");
  const W=900,H=500,table={x:34,y:34,w:832,h:432},rail=22,pocketR=25,ballR=13;
  const pockets=[[table.x,table.y],[table.x+table.w/2,table.y],[table.x+table.w,table.y],[table.x,table.y+table.h],[table.x+table.w/2,table.y+table.h],[table.x+table.w,table.y+table.h]];
  const colors=["#f4f6fb","#f4d35e","#f7f7f7","#f26b5e","#7d8cff","#f5a65b","#55d6be","#e8edf7","#121522","#f4d35e","#f7f7f7","#f26b5e","#7d8cff","#f5a65b","#55d6be","#e8edf7"];
  let balls=[],aim={x:0,y:0,active:false},dragging=false,shotPower=0.72,turn="human",state="playing",message="Your break",anim=0,raf=null;
  function resize(){const max=Math.min(window.innerWidth-30,860);canvas.style.width=max+"px";canvas.style.height=(max*H/W)+"px";canvas.width=W;canvas.height=H;draw();}
  function reset(){balls=[];const cue={id:0,x:190,y:H/2,vx:0,vy:0,type:"cue",active:true};balls.push(cue);const startX=620;let id=1;for(let row=0;row<5;row++){for(let col=0;col<=row;col++){const x=startX+row*25;const y=H/2+(col-row/2)*28;balls.push({id,x,y,vx:0,vy:0,type:id===8?"eight":(id<8?"solid":"stripe"),num:id,active:true});id++;}}turn="human";state="playing";message="Your break";shotPower=.72;aim={x:cue.x+200,y:cue.y};start();updateLabels();}
  function start(){if(!raf)raf=requestAnimationFrame(loop);}
  function stop(){if(raf){cancelAnimationFrame(raf);raf=null;}}
  function speed(){let moving=false;for(const b of balls)if(b.active&&(Math.abs(b.vx)+Math.abs(b.vy))>.15)moving=true;return moving;}
  function loop(){update(.9);draw();raf=requestAnimationFrame(loop);}
  function update(dt){if(state!=="playing")return;let moving=false;for(const b of balls){if(!b.active)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=.986;b.vy*=.986;if(Math.abs(b.vx)+Math.abs(b.vy)>.15)moving=true;for(const p of pockets){if(Math.hypot(b.x-p[0],b.y-p[1])<pocketR){if(b.type==="cue"){b.x=190;b.y=H/2;b.vx=b.vy=0;message="Scratch — your turn again";}else if(b.type==="eight"){b.active=false;state="lost";message=turn==="human"?"8-ball sunk — AI wins":"8-ball sunk — you win!";}else b.active=false;}}
    if(!b.active)continue;const minX=table.x+rail+ballR,maxX=table.x+table.w-rail-ballR,minY=table.y+rail+ballR,maxY=table.y+table.h-rail-ballR;if(b.x<minX){b.x=minX;b.vx=Math.abs(b.vx)*.82;}if(b.x>maxX){b.x=maxX;b.vx=-Math.abs(b.vx)*.82;}if(b.y<minY){b.y=minY;b.vy=Math.abs(b.vy)*.82;}if(b.y>maxY){b.y=maxY;b.vy=-Math.abs(b.vy)*.82;}}
    for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j];if(!a.active||!b.active)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=ballR*2;if(d>0&&d<min){const nx=dx/d,ny=dy/d,rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){a.vx+=rel*nx;a.vy+=rel*ny;b.vx-=rel*nx;b.vy-=rel*ny;}const push=(min-d)/2;a.x-=nx*push;a.y-=ny*push;b.x+=nx*push;b.y+=ny*push;}}
    if(!moving&&!dragging&&turn==="ai"&&state==="playing")aiShot();
  }
  function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle="#0b0e19";ctx.fillRect(0,0,W,H);ctx.fillStyle="#151a2b";roundRect(table.x,table.y,table.w,table.h,28);ctx.fill();ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=2;ctx.stroke();ctx.fillStyle="#124f3d";roundRect(table.x+rail,table.y+rail,table.w-rail*2,table.h-rail*2,17);ctx.fill();for(const p of pockets){ctx.beginPath();ctx.fillStyle="#05070d";ctx.arc(p[0],p[1],pocketR,0,Math.PI*2);ctx.fill();}for(const b of balls){if(!b.active)continue;ctx.beginPath();ctx.fillStyle=colors[b.num||0];ctx.arc(b.x,b.y,ballR,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(0,0,0,.35)";ctx.stroke();if(b.type==="stripe"){ctx.save();ctx.beginPath();ctx.arc(b.x,b.y,ballR,0,Math.PI*2);ctx.clip();ctx.fillStyle="#f2f4f8";ctx.fillRect(b.x-ballR,b.y-5,ballR*2,10);ctx.restore();}if(b.num){ctx.fillStyle=b.num===8?"#fff":"#10131d";ctx.font="bold 8px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(b.num,b.x,b.y);}}
    const cue=balls[0];if(cue&&cue.active&&turn==="human"&&state==="playing"){const ang=Math.atan2(aim.y-cue.y,aim.x-cue.x);ctx.save();ctx.translate(cue.x,cue.y);ctx.rotate(ang+Math.PI);ctx.strokeStyle="rgba(238,243,255,.85)";ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-35,0);ctx.lineTo(-150-100*shotPower,0);ctx.stroke();ctx.restore();ctx.strokeStyle="rgba(85,230,255,.35)";ctx.setLineDash([7,9]);ctx.beginPath();ctx.moveTo(cue.x,cue.y);ctx.lineTo(aim.x,aim.y);ctx.stroke();ctx.setLineDash([]);}
  }
  function roundRect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function shoot(){if(turn!=="human"||state!=="playing")return;const cue=balls[0];const a=Math.atan2(aim.y-cue.y,aim.x-cue.x);const p=8+shotPower*10;cue.vx=Math.cos(a)*p;cue.vy=Math.sin(a)*p;turn="ai";message="AI is thinking…";updateLabels();}
  function aiShot(){if(turn!=="ai"||state!=="playing")return;const cue=balls[0];const targets=balls.filter(b=>b.active&&b.type!=="cue"&&b.type!=="eight");if(!targets.length){message="Your turn";turn="human";updateLabels();return;}const t=targets[0];const a=Math.atan2(t.y-cue.y,t.x-cue.x);cue.vx=Math.cos(a)*7;cue.vy=Math.sin(a)*7;turn="human";message="Your turn";updateLabels();}
  function updateLabels(){const s=document.getElementById("poolStatus");if(s)s.textContent=message;const p=document.getElementById("powerFill");if(p)p.style.width=(shotPower*100)+"%";}
  function pointer(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
  canvas.addEventListener("pointermove",e=>{const p=pointer(e);aim=p;if(dragging){shotPower=Math.max(.1,Math.min(1,Math.hypot(p.x-balls[0].x,p.y-balls[0].y)/240));updateLabels();}draw();});
  canvas.addEventListener("pointerdown",e=>{if(turn!=="human"||state!=="playing")return;dragging=true;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener("pointerup",e=>{if(!dragging)return;dragging=false;shoot();});
  document.getElementById("shootButton").onclick=shoot;
  document.getElementById("poolNewGame").onclick=reset;
  window.poolGame={reset,stop};window.addEventListener("resize",resize);resize();reset();
})();
