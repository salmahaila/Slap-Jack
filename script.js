// Card and suit data used to build a standard 52-card deck.
const suits=[{symbol:"â™ ",color:"black"},{symbol:"â™¥",color:"red"},{symbol:"â™¦",color:"red"},{symbol:"â™£",color:"black"}];
const ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const $=selector=>document.querySelector(selector);
const startScreen=$("#start-screen"),gameScreen=$("#game-screen"),startButton=$("#start-button"),restartButton=$("#restart-button"),resultRestartButton=$("#result-restart-button"),playButton=$("#play-button"),slapButton=$("#slap-button"),playerCount=$("#player-count"),computerCount=$("#computer-count"),pileCount=$("#pile-count"),turnLabel=$("#turn-label"),playedCard=$("#played-card"),statusMessage=$("#status-message"),resultPanel=$("#result-panel"),resultTitle=$("#result-title"),resultMessage=$("#result-message");
let playerPile=[],computerPile=[],centerPile=[],currentTurn="player",gameOver=false,waitingForSlap=false,computerTimer=null,turnTimer=null,lastPlayerToPlay=null;

function createDeck(){
  const deck=[];
  for(const suit of suits) for(const rank of ranks) deck.push({rank,suit:suit.symbol,color:suit.color});
  return deck;
}

// Fisher-Yates shuffle gives every card a random position.
function shuffle(deck){
  for(let i=deck.length-1;i>0;i--){const randomIndex=Math.floor(Math.random()*(i+1));[deck[i],deck[randomIndex]]=[deck[randomIndex],deck[i]];}
  return deck;
}

function startGame(){
  clearTimeout(computerTimer); clearTimeout(turnTimer);
  const deck=shuffle(createDeck());
  playerPile=deck.slice(0,26); computerPile=deck.slice(26); centerPile=[]; currentTurn="player"; gameOver=false; waitingForSlap=false; lastPlayerToPlay=null;
  startScreen.classList.add("hidden"); gameScreen.classList.remove("hidden"); resultPanel.classList.add("hidden");
  resetPlayedCard(); setStatus("Your turn â€” play your top card."); updateDisplay();
}

function resetPlayedCard(){playedCard.className="card empty-card";playedCard.innerHTML='<span class="empty-copy">No card yet</span>';}
function showCard(card){
  playedCard.className=`card ${card.color==="red"?"red":""}`;
  playedCard.innerHTML=`<span class="corner top">${card.rank}<small>${card.suit}</small></span><span class="center-suit">${card.suit}</span><span class="corner bottom">${card.rank}<small>${card.suit}</small></span>`;
}

// Moves one top card into the center, then handles a Jack or starts the next turn.
function playCard(side){
  if(gameOver||waitingForSlap||side!==currentTurn)return;
  const pile=side==="player"?playerPile:computerPile;
  if(pile.length===0){currentTurn=side==="player"?"computer":"player";beginTurn();return;}
  const card=pile.shift(); centerPile.push(card); lastPlayerToPlay=side; showCard(card);
  setStatus(`${side==="player"?"You":"Computer"} played ${card.rank}${card.suit}.`); updateDisplay();
  if(card.rank==="J") openSlapWindow();
  else if(playerPile.length===0&&computerPile.length===0) turnTimer=setTimeout(()=>awardPile(lastPlayerToPlay,"Final card played â€” the pile goes to its owner."),700);
  else {
    currentTurn=side==="player"?"computer":"player";
    updateDisplay();
    turnTimer=setTimeout(beginTurn,650);
  }
}

function beginTurn(){
  if(gameOver||waitingForSlap)return;
  // An empty hand is skipped, but that player can recover by slapping a Jack.
  if(currentTurn==="player"&&playerPile.length===0)currentTurn="computer";
  if(currentTurn==="computer"&&computerPile.length===0)currentTurn="player";
  updateDisplay();
  if(currentTurn==="player")setStatus("Your turn â€” play your top card.");
  else {setStatus("Computer is playingâ€¦");turnTimer=setTimeout(()=>playCard("computer"),700);}
}

function openSlapWindow(){
  waitingForSlap=true; playedCard.classList.add("jack-card"); setStatus("JACK! Slap it before the computer!","alert"); updateDisplay();
  // A varied reaction time makes the computer beatable without being predictable.
  computerTimer=setTimeout(()=>{if(waitingForSlap&&!gameOver)awardPile("computer","The computer slapped the Jack first and won the pile.");},750+Math.random()*700);
}

function handlePlayerSlap(){
  if(gameOver)return;
  const topCard=centerPile[centerPile.length-1];
  if(waitingForSlap&&topCard?.rank==="J"){clearTimeout(computerTimer);awardPile("player","Great slap! You won the center pile.");}
  else applyFalseSlapPenalty();
}

function awardPile(winner,message){
  waitingForSlap=false; clearTimeout(computerTimer); playedCard.classList.remove("jack-card");
  // Shuffle the captured pile and add it to the bottom of the winner's cards.
  const wonCards=shuffle([...centerPile]);
  if(winner==="player")playerPile.push(...wonCards);else computerPile.push(...wonCards);
  centerPile=[]; currentTurn=winner; setStatus(message,winner==="player"?"good":"bad"); updateDisplay();
  if(checkForWinner())return;
  turnTimer=setTimeout(()=>{resetPlayedCard();beginTurn();},1100);
}

function applyFalseSlapPenalty(){
  if(waitingForSlap)return;
  if(playerPile.length>0){computerPile.push(playerPile.shift());setStatus("Wrong slap! One of your cards goes to the computer.","bad");}
  else setStatus("Wrong slap! You have no card to pay as a penalty.","bad");
  updateDisplay(); checkForWinner();
}

function checkForWinner(){
  if(centerPile.length>0)return false;
  if(playerPile.length===52){endGame(true);return true;}
  if(computerPile.length===52){endGame(false);return true;}
  return false;
}

function endGame(playerWon){
  gameOver=true;waitingForSlap=false;clearTimeout(computerTimer);clearTimeout(turnTimer);
  resultTitle.textContent=playerWon?"You win!":"Computer wins";
  resultMessage.textContent=playerWon?"You collected all 52 cards. Sharp reflexes!":"The computer collected all 52 cards. Try another round!";
  resultPanel.classList.remove("hidden");updateDisplay();
}

function setStatus(message,type=""){statusMessage.textContent=message;statusMessage.className=`status-message ${type}`.trim();}
function updateDisplay(){
  playerCount.textContent=playerPile.length;computerCount.textContent=computerPile.length;pileCount.textContent=centerPile.length;
  turnLabel.textContent=gameOver?"Game over":currentTurn==="player"?"Player":"Computer";
  playButton.disabled=gameOver||waitingForSlap||currentTurn!=="player"||playerPile.length===0;
  // This stays enabled during play so early clicks can receive the false-slap penalty.
  slapButton.disabled=gameOver;
}

startButton.addEventListener("click",startGame);restartButton.addEventListener("click",startGame);resultRestartButton.addEventListener("click",startGame);
playButton.addEventListener("click",()=>playCard("player"));slapButton.addEventListener("click",handlePlayerSlap);

