import browser from "webextension-polyfill";
import { GetThresholdOfColor, SendNewsPage, addExtensionSettings, enableAnimatedBackground, loadHomePage, setupSettingsButton } from "../../SEQTA";
import { updateBgDurations } from "./Animation";
import { appendBackgroundToUI } from "./ImageBackgrounds";
import stringToHTML from "../utils/stringToHTML";
import { settingsState } from "../utils/listeners/SettingsState";
import { updateAllColors } from "./colors/Manager";

export async function AddBetterSEQTAElements(toggle: any) {
  if (toggle) {    
    initializeSettings();
    addDarkMode(settingsState.DarkMode);
    createHomeButton();
    await handleUserInfo();
    handleStudentData();
    createNewsButton();
    setupEventListeners();
  }

  appendBackgroundToUI();
  addExtensionSettings();
  if (toggle) {
    await createSettingsButton();
    await addDarkLightToggle();
    customizeMenuToggle();
  } else {
    await createSettingsButton();
  }

  setupSettingsButton();
}

function initializeSettings() {
  enableAnimatedBackground();
  updateBgDurations();
}

function addDarkMode(DarkMode: boolean) {
  if (DarkMode) {
    document.documentElement.classList.add('dark');
  }
}

function createHomeButton() {
  const container = document.getElementById('content')!;
  const div = document.createElement('div');
  div.classList.add('titlebar');
  container.append(div);
  
  const NewButton = stringToHTML('<li class="item" data-key="home" id="homebutton" data-path="/home" data-betterseqta="true"><label><svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" /></svg><span>Home</span></label></li>');
  const menu = document.getElementById('menu')!;
  const List = menu.firstChild! as HTMLElement;
  
  if (NewButton.firstChild) {
    List.insertBefore(NewButton.firstChild, List.firstChild);
  }
}

async function handleUserInfo() {
  try {
    const response = await fetch(`${location.origin}/seqta/student/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        mode: 'normal',
        query: null,
        redirect_url: location.origin,
      }),
    });
    
    const responseData = await response.json();
    let info = responseData.payload;
    updateUserInfo(info);
  } catch (error) {
    console.error('Error fetching and processing student data:', error);
  }
}

function updateUserInfo(info: {
  basic: boolean;
  clientIP: string[] | null;
  email: string | null;
  id: number | null;
  lastAccessedTime: number | null;
  meta: {
    code: string | null;
    governmentID: string | null;
  };
  personUUID: string | null;
  status: number | null;
  synergeticCommunityUrl: string | null;
  type: string | null;
  userCode: string | null;
  userDesc: string | null;
  userName: string | null;
}) {
  const titlebar = document.getElementsByClassName('titlebar')[0];
  
  const userInfo = stringToHTML(/* html */`
    <div class="userInfosvgdiv tooltip">
      <svg class="userInfosvg" viewBox="0 0 24 24"><path fill="var(--text-primary)" d="M12,19.2C9.5,19.2 7.29,17.92 6,16C6.03,14 10,12.9 12,12.9C14,12.9 17.97,14 18,16C16.71,17.92 14.5,19.2 12,19.2M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z"></path></svg>
      <div class="tooltiptext topmenutooltip" id="logouttooltip"></div>
    </div>
  `).firstChild;
  titlebar.append(userInfo!);
  
  const userinfo = stringToHTML(/* html */`
    <div class="userInfo">
      <div class="userInfoText">
        <div style="display: flex; align-items: center;">
          <p class="userInfohouse userInfoCode"></p>
          <p class="userInfoName">${info.userDesc}</p>
        </div>
        <p class="userInfoCode">${info.meta.code} // ${info.meta.governmentID}</p>
      </div>
    </div>
  `).firstChild;
  titlebar.append(userinfo!);
  
  var logoutbutton = document.getElementsByClassName('logout')[0];
  var userInfosvgdiv = document.getElementById('logouttooltip')!;
  userInfosvgdiv.appendChild(logoutbutton);
}

async function handleStudentData() {
  try {
    const response = await fetch(`${location.origin}/seqta/student/load/message/people`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ mode: 'student' }),
    });
    
    const responseData = await response.json();
    let students = responseData.payload;
    await updateStudentInfo(students);
  } catch (error) {
    console.error('Error fetching and processing student data:', error);
  }
}

async function getUserInfo() {
  try {
    const response = await fetch(`${location.origin}/seqta/student/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        mode: 'normal',
        query: null,
        redirect_url: location.origin,
      }),
    });

    const responseData = await response.json();
    return responseData.payload;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error; // Rethrow the error after logging it
  }
}

async function updateStudentInfo(students: any) {
  const info = await getUserInfo(); // You would need to implement this to fetch or pass the user info
  var index = students.findIndex(function (person: any) {
    return (
      person.firstname == info.userDesc.split(' ')[0] &&
      person.surname == info.userDesc.split(' ')[1]
    );
  });
  
  let houseelement1 = document.getElementsByClassName('userInfohouse')[0];
  const houseelement = houseelement1 as HTMLElement;
  
  if (students[index]?.house) {
    if (students[index]?.house_colour) {
      houseelement.style.background = students[index].house_colour;
      try {
        let colorresult = GetThresholdOfColor(students[index]?.house_colour);
        houseelement.style.color = colorresult && colorresult > 300 ? 'black' : 'white';
        houseelement.innerText = students[index].year + students[index].house;
      } catch (error) {
        houseelement.innerText = students[index].house;
      }
    }
  } else {
    houseelement.innerText = students[index].year;
  }
}

function createNewsButton() {
  const NewsButtonStr = '<li class="item" data-key="news" id="newsbutton" data-path="/news" data-betterseqta="true"><label><svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M20 3H4C2.89 3 2 3.89 2 5V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V5C22 3.89 21.11 3 20 3M5 7H10V13H5V7M19 17H5V15H19V17M19 13H12V11H19V13M19 9H12V7H19V9Z" /></svg><span>News</span></label></li>';
  const NewsButton = stringToHTML(NewsButtonStr);
  const menu = document.getElementById('menu')!;
  const List = menu.firstChild! as HTMLElement;
  
  List!.appendChild(NewsButton.firstChild!);
  
  let a = document.createElement('div');
  a.classList.add('icon-cover');
  a.id = 'icon-cover';
  menu!.appendChild(a);
}

function setupEventListeners() {
  const menuCover = document.querySelector('#icon-cover');
  menuCover!.addEventListener('click', function () {
    location.href = '../#?page=/home';
    loadHomePage();
    (document!.getElementById('menu')!.firstChild! as HTMLElement).classList.remove('noscroll');
  });

  const homebutton = document.getElementById('homebutton');
  homebutton!.addEventListener('click', function () {
    if (!homebutton?.classList.contains('draggable') && !homebutton?.classList.contains('active')) {
      loadHomePage();
    }
  });

  const newsbutton = document.getElementById('newsbutton');
  newsbutton!.addEventListener('click', function () {
    if (!newsbutton?.classList.contains('draggable') && !newsbutton?.classList.contains('active')) {
      SendNewsPage();
    }
  });
}

async function createSettingsButton() {
  let SettingsButton = stringToHTML(
    '<button class="addedButton tooltip" id="AddedSettings"><svg width="24" height="24" viewBox="0 0 24 24"><g><g><path d="M23.182,6.923c-.29,0-3.662,2.122-4.142,2.4l-2.8-1.555V4.511l4.257-2.456a.518.518,0,0,0,.233-.408.479.479,0,0,0-.233-.407,6.511,6.511,0,1,0-3.327,12.107,6.582,6.582,0,0,0,6.148-4.374,5.228,5.228,0,0,0,.333-1.542A.461.461,0,0,0,23.182,6.923Z"></path><path d="M9.73,10.418,7.376,12.883c-.01.01-.021.016-.03.025L1.158,19.1a2.682,2.682,0,1,0,3.793,3.793l4.583-4.582,0,0,4.1-4.005-.037-.037A9.094,9.094,0,0,1,9.73,10.418ZM3.053,21.888A.894.894,0,1,1,3.946,21,.893.893,0,0,1,3.053,21.888Z"></path></g></g></svg><div class="tooltiptext topmenutooltip">BetterSEQTA+ Settings</div></button>'
  );
  let ContentDiv = document.getElementById('content');
  ContentDiv!.append(SettingsButton.firstChild!);
}

function GetLightDarkModeString(darkMode: boolean) {  
  if (darkMode) {
    return 'Switch to light theme'
  } else {
    return 'Switch to dark theme'
  }
}

async function addDarkLightToggle() {
  const tooltipString = GetLightDarkModeString(settingsState.DarkMode);
  const svgContent = settingsState.DarkMode ? 
    '<defs><clipPath id="__lottie_element_80"><rect width="24" height="24" x="0" y="0"></rect></clipPath></defs><g clip-path="url(#__lottie_element_80)"><g style="display: block;" transform="matrix(1,0,0,1,12,12)" opacity="1"><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path fill-opacity="1" d=" M0,-4 C-2.2100000381469727,-4 -4,-2.2100000381469727 -4,0 C-4,2.2100000381469727 -2.2100000381469727,4 0,4 C2.2100000381469727,4 4,2.2100000381469727 4,0 C4,-2.2100000381469727 2.2100000381469727,-4 0,-4z"></path></g></g><g style="display: block;" transform="matrix(1,0,0,1,12,12)" opacity="1"><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path fill-opacity="1" d=" M0,6 C-3.309999942779541,6 -6,3.309999942779541 -6,0 C-6,-3.309999942779541 -3.309999942779541,-6 0,-6 C3.309999942779541,-6 6,-3.309999942779541 6,0 C6,3.309999942779541 3.309999942779541,6 0,6z M8,-3.309999942779541 C8,-3.309999942779541 8,-8 8,-8 C8,-8 3.309999942779541,-8 3.309999942779541,-8 C3.309999942779541,-8 0,-11.3100004196167 0,-11.3100004196167 C0,-11.3100004196167 -3.309999942779541,-8 -3.309999942779541,-8 C-3.309999942779541,-8 -8,-8 -8,-8 C-8,-8 -8,-3.309999942779541 -8,-3.309999942779541 C-8,-3.309999942779541 -11.3100004196167,0 -11.3100004196167,0 C-11.3100004196167,0 -8,3.309999942779541 -8,3.309999942779541 C-8,3.309999942779541 -8,8 -8,8 C-8,8 -3.309999942779541,8 -3.309999942779541,8 C-3.309999942779541,8 0,11.3100004196167 0,11.3100004196167 C0,11.3100004196167 3.309999942779541,8 3.309999942779541,8 C3.309999942779541,8 8,8 8,8 C8,8 8,3.309999942779541 8,3.309999942779541 C8,3.309999942779541 11.3100004196167,0 11.3100004196167,0 C11.3100004196167,0 8,-3.309999942779541 8,-3.309999942779541z"></path></g></g></g>' : 
    '<defs><clipPath id="__lottie_element_263"><rect width="24" height="24" x="0" y="0"></rect></clipPath></defs><g clip-path="url(#__lottie_element_263)"><g style="display: block;" transform="matrix(1.5,0,0,1.5,7,12)" opacity="1"><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path fill-opacity="1" d=" M0,-4 C-2.2100000381469727,-4 -1.2920000553131104,-2.2100000381469727 -1.2920000553131104,0 C-1.2920000553131104,2.2100000381469727 -2.2100000381469727,4 0,4 C2.2100000381469727,4 4,2.2100000381469727 4,0 C4,-2.2100000381469727 2.2100000381469727,-4 0,-4z"></path></g></g><g style="display: block;" transform="matrix(-1,0,0,-1,12,12)" opacity="1"><g opacity="1" transform="matrix(1,0,0,1,0,0)"><path fill-opacity="1" d=" M0,6 C-3.309999942779541,6 -6,3.309999942779541 -6,0 C-6,-3.309999942779541 -3.309999942779541,-6 0,-6 C3.309999942779541,-6 6,-3.309999942779541 6,0 C6,3.309999942779541 3.309999942779541,6 0,6z M8,-3.309999942779541 C8,-3.309999942779541 8,-8 8,-8 C8,-8 3.309999942779541,-8 3.309999942779541,-8 C3.309999942779541,-8 0,-11.3100004196167 0,-11.3100004196167 C0,-11.3100004196167 -3.309999942779541,-8 -3.309999942779541,-8 C-3.309999942779541,-8 -8,-8 -8,-8 C-8,-8 -8,-3.309999942779541 -8,-3.309999942779541 C-8,-3.309999942779541 -11.3100004196167,0 -11.3100004196167,0 C-11.3100004196167,0 -8,3.309999942779541 -8,3.309999942779541 C-8,3.309999942779541 -8,8 -8,8 C-8,8 -3.309999942779541,8 -3.309999942779541,8 C-3.309999942779541,8 0,11.3100004196167 0,11.3100004196167 C0,11.3100004196167 3.309999942779541,8 3.309999942779541,8 C3.309999942779541,8 8,8 8,8 C8,8 8,3.309999942779541 8,3.309999942779541 C8,3.309999942779541 11.3100004196167,0 11.3100004196167,0 C11.3100004196167,0 8,-3.309999942779541 8,-3.309999942779541z"></path></g></g></g>';
  
  const LightDarkModeButton = stringToHTML(`
    <button class="addedButton DarkLightButton tooltip" id="LightDarkModeButton">
      <svg xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>
      <div class="tooltiptext topmenutooltip" id="darklighttooliptext">${tooltipString}</div>
    </button>
  `);
  
  let ContentDiv = document.getElementById('content');
  ContentDiv!.append(LightDarkModeButton.firstChild!);
  
  updateAllColors();
  
  document.getElementById('LightDarkModeButton')!.addEventListener('click', async () => {
    settingsState.DarkMode = !settingsState.DarkMode;
    
    updateAllColors();
    
    const darklightText = document.getElementById('darklighttooliptext');
    darklightText!.innerText = GetLightDarkModeString(!settingsState.DarkMode);
  });
}

function customizeMenuToggle() {
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.innerHTML = '';
  }

  const line = document.createElement('div');
  line.className = 'hamburger-line';

  for (let i = 0; i < 3; i++) {
    menuToggle!.appendChild(line);
  }
}