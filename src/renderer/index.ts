import { FingerBoard, NoteInfo } from '../common/FingerBoard';
import { WebSession, UserInfo } from '../common/WebSession';
import { UserDataSource } from '../common/UserDataSource'
var fb: FingerBoard;
var wb: WebSession;
var userData: UserDataSource;

function init() {
  fb = new FingerBoard();
  wb = new WebSession(Date.now().toString(), 'ws://localhost:9002', 'ts');
  userData = new UserDataSource(fb, wb);

  console.log(`Websocket: ${wb.name}`);
  wb.on("newMember", addFingerTab);
  wb.on("data", changeOthersFingerTab);

  userData.on("press", onGUIPress);
  userData.on("unpress", onGUIUnress);
  userData.on("pick", onGUIPick);
  // window.addEventListener("resize", redrawCanvas, false);
  drawCanvas(fb, "local");



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
    userData.do("press", {stringID, note});
  });

  unpressBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note: string = (document.getElementById("note") as HTMLInputElement).value;
    userData.do("unpress", {stringID, note});
  });

  pickBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note:string = "";
    userData.do("pick", {stringID, note});
  });

  // Click note div Callback function
  fb.on("press", clickNote);
  function clickNote(note: NoteInfo) {
    let htmlDiv = note.htmlElement;
    //console.log("f1: " + note.divIndex + ", " + note.string + " " + note.note + " ");
    if(htmlDiv != undefined) {
      if(htmlDiv.className == "press") {
        htmlDiv.className = "unpress";
        wb.wsCtrl.send(`data ${wb.name},unpress,${note.string},${note.note}`);
      }
      else {
        htmlDiv.className = "press";
        wb.wsCtrl.send(`data ${wb.name},press,${note.string},${note.note}`);
      }
    }
  }

  function drawCanvas(fb: FingerBoard, name: string) {
    fb.drawFingerTab();
    let container: HTMLElement | null = document.getElementById('container');
    if(container != null) {
      let fbContainer = document.createElement("div");
      let nameText = document.createElement("div");
      nameText.innerHTML = name;
      fbContainer.id = name;
      fbContainer.appendChild(nameText);
      fbContainer.appendChild(fb.domElement);
      fbContainer.style.height = (fb.domElement.height+2) + "px";
      fbContainer.style.width = (fb.domElement.width) + "px";
      fbContainer.appendChild(fb.pressPointElements);
      container.appendChild(fbContainer);
      container.appendChild(document.createElement("br"));
    }
  }

  function onGUIPress(noteInfo: {stringID: number, note: string}) {
    fb.press(noteInfo.stringID, noteInfo.note);
    wb.wsCtrl.send(`data ${wb.name},press,${noteInfo.stringID},${noteInfo.note}`);
  }

  function onGUIUnress(noteInfo: {stringID: number, note: string}) {
    fb.unpress(noteInfo.stringID, noteInfo.note);
    wb.wsCtrl.send(`data ${wb.name},unpress,${noteInfo.stringID},${noteInfo.note}`);
  }

  function onGUIPick(noteInfo: {stringID: number, note: string}) {
    fb.pick(noteInfo.stringID);
    wb.wsCtrl.send(`data ${wb.name},pick,${noteInfo.stringID}`);
  }

  function addFingerTab(user?: UserInfo): void {
    if(user != undefined) {
      drawCanvas(user.fb, user.name);
    }
      
  }

  function changeOthersFingerTab(user?: UserInfo, data?: string) {
    if(user != undefined && data != undefined) {
      let splited = data.split(",");
      let action = splited[1];
      let stringID: number = + splited[2];
      let note = (action == "pick")? "":splited[3];
      if(action == "press") {
        user.fb.press(stringID, note);
      } else if(action == "unpress") {
        user.fb.unpress(stringID, note);
      } else if(action == "pick") {
        user.fb.pick(stringID);
      }
    }
  }

  // function deleteFingerTab(user?: UserInfo) {
  //   if(user != undefined) {
  //     console.log("remove user: " + user.name);
  //     // let ele = document.getElementById(user.name);
  //     // if(ele != null && ele.parentNode != null) ele.parentNode.removeChild(ele);
  //   }
  //}
}



$(document).ready(() => {
  init();
});