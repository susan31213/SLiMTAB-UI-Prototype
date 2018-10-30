import { FingerBoard } from '../common/FingerBoard';
import { WebSession, UserInfo } from '../common/WebSession';
import { UserDataSource } from '../common/UserDataSource'
var fb: FingerBoard;
var wb: WebSession;
var userData: UserDataSource;

function init() {
  fb = new FingerBoard();
  wb = new WebSession(Date.now().toString(), 'ws://localhost:9002', 'ts');
  userData = new UserDataSource(fb, wb);

  // reg the other user callback functions
  console.log(`Websocket: ${wb.name}`);
  drawCanvas(fb);
  wb.on("newMember", addFingerTab);       // on member join
  wb.on("data", changeOthersFingerTab);   // on other's data arrived

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
      fb.press(stringID, note);
  });

  unpressBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note: string = (document.getElementById("note") as HTMLInputElement).value;
    if($('input[name="play type"]:checked').val() == "send")
      userData.do("unpress", {stringID, note});
    else if($('input[name="play type"]:checked').val() == "receive")
      fb.unpress(stringID, note);
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
    wb.wsCtrl.send(`data ${wb.name},press,${noteInfo.stringID},${noteInfo.note}`);
  }

  function onSelfUnpress(noteInfo: {stringID: number, note: string}) {
    wb.wsCtrl.send(`data ${wb.name},unpress,${noteInfo.stringID},${noteInfo.note}`);
  }

  function onSelfPick(noteInfo: {stringID: number, note: string}) {
    wb.wsCtrl.send(`data ${wb.name},pick,${noteInfo.stringID}`);
  }

  function addFingerTab(user?: UserInfo): void {
    // save the other user's info...
    console.log(user);
  }

  function changeOthersFingerTab(user?: UserInfo, data?: string) {
    if(user != undefined && data != undefined) {
      let splited = data.split(",");
      let action = splited[1];
      let stringID: number = + splited[2];
      let note = (action == "pick")? "":splited[3];
      if(action == "press") {
        fb.press(stringID, note);
      } else if(action == "unpress") {
        fb.unpress(stringID, note);
      } else if(action == "pick") {
        fb.pick(stringID);
      }
    }
  }
}



$(document).ready(() => {
  init();
});