import { FingerBoard, NoteInfo } from '../common/FingerBoard';
import { WebSession, UserInfo } from '../common/WebSession';
var fb: FingerBoard;
var wb: WebSession;

// wb.add(new )
function init() {
  fb = new FingerBoard();

  wb = new WebSession(Date.now().toString(), 'ws://140.116.82.7:9002', 'ts');
  console.log(`Websocket: ${wb.name}`);
  wb.on("new member", addFingerTab);
  wb.on("data", changeFingerTab);

  // window.addEventListener("resize", redrawCanvas, false);
  redrawCanvas(fb, "local");



  // add button listener
  let pressBtn = document.getElementById("pressBtn") as HTMLElement;
  let unpressBtn = document.getElementById("unpressBtn") as HTMLElement;
  let pickBtn = document.getElementById("pickBtn") as HTMLElement;

  pressBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note: string = (document.getElementById("note") as HTMLInputElement).value;
    fb.press(stringID as number, note);
    wb.wsCtrl.send(`data ${wb.name},press,${stringID},${note}`);
  });

  unpressBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    let note: string = (document.getElementById("note") as HTMLInputElement).value;
    fb.unPress(stringID as number, note);
    wb.wsCtrl.send(`data ${wb.name},unPress,${stringID},${note}`);
  });

  pickBtn.addEventListener("click", () => {
    let stringID: number = + ((document.getElementById("stringID") as HTMLInputElement).value);
    fb.pick(stringID as number);
    wb.wsCtrl.send(`data ${wb.name},pick,${stringID}`);
  });

  // Callbacks (Debuggggggggggg)
  fb.on("press", f1);
  function f1(note: NoteInfo) {
    let htmlDiv = note.htmlElement;
    console.log("f1: " + note.divIndex + ", " + note.string + " " + note.note + " ");
    if(htmlDiv != undefined) {
      if(htmlDiv.className == "press") {
        htmlDiv.className = "unPress";
        wb.wsCtrl.send(`data ${wb.name},unPress,${note.string},${note.note}`);
      }
      else {
        htmlDiv.className = "press";
        wb.wsCtrl.send(`data ${wb.name},press,${note.string},${note.note}`);
      }
    }
  }
  // Callbacks end (Debuggggggggggg)

  function redrawCanvas(fb: FingerBoard, name: string) {
    fb.drawCanvasAndPressPoints();
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

  function addFingerTab(user?: UserInfo): void {
    if(user != undefined) {
      redrawCanvas(user.fb, user.name);
    }
      
  }

  function changeFingerTab(user?: UserInfo, data?: string) {
    if(user != undefined && data != undefined) {
      let splited = data.split(",");
      let action = splited[1];
      let stringID: number = + splited[2];
      let note = splited[3];
      if(action == "press") {
        user.fb.press(stringID, note);
      } else if(action == "unPress") {
        user.fb.unPress(stringID, note);
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