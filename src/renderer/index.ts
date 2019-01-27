import { FingerBoard } from '../common/FingerBoard';
import { WebSession, SessionCommandOp } from '../common/WebSession';
import { UserDataSource } from '../common/UserDataSource';
import { FakeDataSource } from '../common/FakeDataSource';
import { STabV1Reader } from '../common/STabV1Reader';
import { Note } from "../common/Tabular";
import { GameLogic } from "../common/GameLogic";
import * as Vex from 'vexflow';

var fb: FingerBoard;
var wb: WebSession;
var userData: UserDataSource;



function init() {
  fb = new FingerBoard();
  wb = new WebSession(Date.now().toString(), 'ws://localhost:9002', 'ts');
  userData = new UserDataSource(fb);

  // reg the other user callback functions
  drawCanvas(fb);
  wb.on("enter", onMemberEnter);          // on member join
  wb.on("data", changeOthersFingerTab);   // on other's data arrived
  wb.on("leave", onMemberLeave);          // on member leave

  // Self note info callback functions
  userData.on("press", onSelfPress);
  userData.on("unpress", onSelfUnpress);
  userData.on("pick", onSelfPick);

  // hide debugger
  (document.getElementById("debugger") as HTMLElement).style.display = 'none';



  // add button listener
  let pressBtn = document.getElementById("pressBtn") as HTMLElement;
  let unpressBtn = document.getElementById("unpressBtn") as HTMLElement;
  let pickBtn = document.getElementById("pickBtn") as HTMLElement;
  let showDebugBtn = document.getElementById("showDebug") as HTMLElement;
  let quitBtn = document.getElementById("quit") as HTMLElement;

  quitBtn.addEventListener("click", () => {
    window.close();
  });

  showDebugBtn.addEventListener("click", () => {
    let db = document.getElementById("debugger") as HTMLElement;
    if(db != null && db.style.display == 'none') {
      db.style.display = '';
    }
    else if(db != null && db.style.display == '') {
      db.style.display = 'none';
    }
  });

  pressBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note: string = (document.getElementById("note") as HTMLInputElement).value;

    if($('input[name="play type"]:checked').val() == "send")
      userData.do("press", {stringID, note});
    else if($('input[name="play type"]:checked').val() == "receive")
      fb.press(fb.namePressPointIndex(stringID, note));
  });

  unpressBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note: string = (document.getElementById("note") as HTMLInputElement).value;
    if($('input[name="play type"]:checked').val() == "send")
      userData.do("unpress", {stringID, note});
    else if($('input[name="play type"]:checked').val() == "receive")
      fb.unpress(fb.namePressPointIndex(stringID, note));
  });

  pickBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note:string = "";
    if($('input[name="play type"]:checked').val() == "send")
      userData.do("pick", {stringID, note});
    else if($('input[name="play type"]:checked').val() == "receive")
      fb.pick(stringID);
  });

  function drawCanvas(fb: FingerBoard) {
    fb.drawFingerTab();
    let container: HTMLElement | null = document.getElementById('footer');
    if(container != null) {
      container.appendChild(fb.domElement);
      container.appendChild(document.createElement("br"));
    }
  }

  function onSelfPress(noteInfo: {stringID: number, note: string}) {
    var bytearray = new Uint8Array(3);
    bytearray[0] = SessionCommandOp.eBroadcast;
    bytearray[1] = 0x00;
    bytearray[2] = fb.namePressPointIndex(noteInfo.stringID, noteInfo.note);
    wb.wsCtrl.send(bytearray.buffer);
  }

  function onSelfUnpress(noteInfo: {stringID: number, note: string}) {
    var bytearray = new Uint8Array(3);
    bytearray[0] = SessionCommandOp.eBroadcast;
    bytearray[1] = 0x01;
    bytearray[2] = fb.namePressPointIndex(noteInfo.stringID, noteInfo.note);
    wb.wsCtrl.send(bytearray.buffer);
  }

  function onSelfPick(noteInfo: {stringID: number, note: string}) {
    var bytearray = new Uint8Array(3);
    bytearray[0] = SessionCommandOp.eBroadcast;
    bytearray[1] = 0x02;
    bytearray[2] = noteInfo.stringID;
    wb.wsCtrl.send(bytearray.buffer);
  }

  function onMemberEnter(data?: Array<string | number>) {
    if(data != undefined)
      console.log(`Enter: ${data[0]}`)
  }

  function onMemberLeave(data?: Array<string | number>) {
    if(data != undefined)
      console.log(`Leave: ${data[0]}`)
  }

  function changeOthersFingerTab(data?: Array<string | number>) {
    if(data != undefined) {
      if(data[0] == 0x00) {
        fb.press(data[1] as number);
      } else if(data[0] == 0x01) {
        fb.unpress(data[1] as number);
      } else if(data[0] == 0x02) {
        fb.pick(data[1] as number);
      }
    }
  }

  
}



$(document).ready(() => {
  init();
  const VF = Vex.Flow;
  const content = document.getElementById('content') as HTMLElement;
  console.log(content)
  const renderer = new VF.Renderer(content, VF.Renderer.Backends.SVG);
  renderer.resize(1085, 200);
  var context = renderer.getContext();
  context.setFont("Arial", 10).setBackgroundFillStyle("#eed");
  
  // Create a tab stave of width 400 at position 10, 40 on the canvas.
  
  var stave = new VF.TabStave(10, 40, 400);
  stave.addClef("tab").setContext(context).draw();

  // Tabular
  const testTabular = new STabV1Reader(`[[[4,2,4,6,3,"c"],[4,2,4,6,3,"c"],[4,2,4,6,3,"c"],[4,2,4,6,3,"e"]]]`);
  const tab = testTabular.read();
  console.log(tab);
  const note_value = ["w", "h", "q", "8", "16", "32"];
  let notes = []
  for(let i=0; i<tab.sections.length; i++) {
    for(let j=0; j<tab.sections[i].notes.length; j++) {
      const duration = tab.sections[i].notes[j].duration;
      if(tab.sections[i].notes[j] instanceof Note) {
        const positions: Array<{str: number, fret: number}> = [];
        (tab.sections[i].notes[j] as Note).positions.forEach((pos: {stringID: number, fretID: number}) => {
          positions.push({str: pos.stringID, fret: pos.fretID});
        })
        
        notes.push(new VF.TabNote({positions: positions, duration: note_value[Math.floor(Math.log2(duration))]}, true));
        

      } else {
        notes.push(new VF.StaveNote({keys: ["b/4"], duration: note_value[Math.floor(Math.log2(duration))]+"r" }));
      }

      
    }
    notes.push(new Vex.Flow.BarNote());
  }
  VF.Formatter.FormatAndDraw(context, stave, notes);

  // FakeDataSource: simulate user input
  const dds = new FakeDataSource(fb, "ws://localhost:9002");
  dds.on("data", (note: Note)=>{
    
    // check hit timing
    gm.Hit(note);

    // render fingerTab
    note.positions.forEach(element => {
      fb.press(fb.fretPressPointIndex(element.stringID, element.fretID));
      fb.pick(element.stringID);
      setTimeout(() => {
        fb.unpress(fb.fretPressPointIndex(element.stringID, element.fretID));
      }, 300);
    });
  });

  // GameLogic
  let canvas = <HTMLCanvasElement>document.createElement("canvas");
  canvas.width = 1085;
  content.appendChild(canvas);
  let cxt = <CanvasRenderingContext2D>canvas.getContext("2d");
  let gm = new GameLogic(fb, cxt, tab, 20);
  // dds.startSendData(1000);

  /////// Event Listener ///////
  //Press space to hit...
  document.addEventListener('keyup', function(event) {
    if(event.keyCode == 32) {
      dds.SendData();
    }
  });
  
  // Button: Game Start & Replay
  let updateRequestID: number;

  let gStart = document.getElementById("gameStart") as HTMLElement;
  let gReplay = document.getElementById("replay") as HTMLElement;
  gStart.addEventListener("click", () => {
    cancelAnimationFrame(updateRequestID);
    gm.StartGame();
    updateGame();
  });

  gReplay.addEventListener("click", () => {
    cancelAnimationFrame(updateRequestID);
    gm.StartReplay();
    updateGame();
  });

  function updateGame() {
    updateRequestID = requestAnimationFrame(() => {gm.Update(); updateGame()});
  }

});



