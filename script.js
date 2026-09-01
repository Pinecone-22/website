const bootLines = [
  ["PINECONE PERSONAL COMPUTER", "plain"],
  ["BIOS DATE 09/01/26  VER 1.0.0", "plain"],
  ["CPU: RETRO HARDWARE / ONLINE", "plain"],
  ["MEMORY CHECK ...............................", "pending"],
  ["MEMORY CHECK ............................... OK", "ok"],
  ["MOUNTING PROJECT ARCHIVE ................... OK", "ok"],
  ["LOADING HOMEBREW MODULES ................... OK", "ok"],
  ["STARTING PINECONE_ARCHIVE.EXE", "plain"],
];

const bios = document.querySelector("#bios");
const bootLog = document.querySelector("#boot-log");
const bootProgress = document.querySelector("#boot-progress");
const site = document.querySelector("#site");
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

let bootTimer;
let hasBooted = false;

function bootLine([text, state]) {
  const line = document.createElement("p");
  line.textContent = text || " ";
  line.className = state;
  bootLog.appendChild(line);
}

function finishBoot() {
  if (hasBooted) return;

  hasBooted = true;
  clearTimeout(bootTimer);

  bootProgress.textContent = "100%";
  bios.classList.add("is-done");
  site.classList.add("is-ready");
  site.removeAttribute("aria-hidden");
  document.body.classList.remove("is-booting");
}

function startBoot() {
  hasBooted = false;
  bootLog.replaceChildren();
  bootProgress.textContent = "0%";
  bios.classList.remove("is-done");
  site.classList.remove("is-ready");
  site.setAttribute("aria-hidden", "true");
  document.body.classList.add("is-booting");

  const step = reduceMotion ? 0 : 175;

  bootLines.forEach((line, index) => {
    setTimeout(() => {
      if (hasBooted) return;

      bootLine(line);
      bootProgress.textContent =
        `${Math.round(((index + 1) / bootLines.length) * 100)}%`;
    }, index * step);
  });

  bootTimer = setTimeout(
    finishBoot,
    reduceMotion ? 80 : bootLines.length * step + 420,
  );
}

document.querySelector("#skip-boot").addEventListener(
  "click",
  finishBoot,
);

window.addEventListener("keydown", (event) => {
  if (!hasBooted && event.key !== "Tab") {
    finishBoot();
  }
});

document.querySelector("#replay-boot").addEventListener(
  "click",
  () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setTimeout(startBoot, 240);
  },
);

document.querySelector("#year").textContent =
  new Date().getFullYear();

const clock = document.querySelector("#clock");

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format();
}

updateClock();
setInterval(updateClock, 1000);

const output = document.querySelector("#terminal-output");
const input = document.querySelector("#command-input");
const form = document.querySelector("#command-form");

const commands = {
  help: "COMMANDS: ABOUT, PROJECTS, GITHUB, CLEAR, HELP",
  about:
    "PINECONE MAKES REVIVAL PROJECTS, PORTS, AND TOOLS FOR OLD HARDWARE.",
  projects:
    "[01] WIIMART HOSTER  [02] REVTENDO (RIP)  [03] REN'3DSPY  [04] DDLC3DS-NATIVE",
  github: "GITHUB.COM/PINECONE-22",
};

function writeLine(text, type = "response") {
  const line = document.createElement("p");
  line.textContent = text;

  if (type === "error") {
    line.style.color = "#77b87d";
  }

  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function runCommand(rawCommand) {
  const command = rawCommand.trim().toLowerCase();

  if (!command) return;

  writeLine(
    `PINECONE@ARCHIVE:~$ ${command.toUpperCase()}`,
  );

  if (command === "clear") {
    output.replaceChildren();
    return;
  }

  if (commands[command]) {
    writeLine(commands[command]);

    const target =
      command === "projects"
        ? "#projects"
        : command === "github"
          ? "#contact"
          : command === "about"
            ? "#about"
            : null;

    if (target) {
      document.querySelector(target).scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  } else {
    writeLine(
      `COMMAND NOT FOUND: ${command.toUpperCase()} / TYPE HELP`,
      "error",
    );
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runCommand(input.value);
  input.value = "";
});

document.querySelectorAll(".inline-command").forEach(
  (button) => {
    button.addEventListener("click", () => {
      runCommand(button.dataset.command);
    });
  },
);


/* AUDIO */

const playlists = {
  wiimart: [
    {
      audioId: "wiimart-audio",
      label: "SHOP CHANNEL THEME",
    },
  ],

  ddlc: [
    {
      audioId: "ddlc-01-audio",
      label: "01 / MAIN THEME",
    },
    {
      audioId: "ddlc-02-audio",
      label: "02 / OHAYOU SAYORI!",
    },
    {
      audioId: "ddlc-03-audio",
      label: "03 / DREAMS OF LOVE AND LITERATURE",
    },
    {
      audioId: "ddlc-04-audio",
      label: "04 / OKAY, EVERYONE!",
    },
    {
      audioId: "ddlc-05-audio",
      label: "05 / PLAY WITH ME",
    },
    {
      audioId: "ddlc-06-audio",
      label: "06 / POEM PANIC!",
    },
    {
      audioId: "ddlc-07-audio",
      label: "07 / DAIJOUBU!",
    },
    {
      audioId: "ddlc-08-audio",
      label: "08 / MY FEELINGS",
    },
    {
      audioId: "ddlc-09-audio",
      label: "09 / MY CONFESSION",
    },
    {
      audioId: "ddlc-10-audio",
      label: "10 / SAYO-NARA",
    },
    {
      audioId: "ddlc-11-audio",
      label: "11 / JUST MONIKA.",
    },
    {
      audioId: "ddlc-12-audio",
      label: "12 / I STILL LOVE YOU",
    },
    {
      audioId: "ddlc-13-audio",
      label: "13 / YOUR REALITY",
    },
  ],
};

let activeCard = null;
let vhsFadeTimer = null;
let vhsStopTimer = null;

const vhsAudio = document.querySelector("#vhs-audio");
const selectionSfx = document.querySelector(
  "#ddlc-select-sfx",
);

function selectedTrack(card) {
  const playlist = playlists[card.dataset.playlist];

  if (!playlist || playlist.length === 0) {
    throw new Error(
      `Unknown playlist: ${card.dataset.playlist}`,
    );
  }

  const parsedIndex = Number.parseInt(
    card.dataset.trackIndex ?? "0",
    10,
  );

  const index =
    Number.isInteger(parsedIndex) && parsedIndex >= 0
      ? parsedIndex % playlist.length
      : 0;

  return playlist[index];
}

function playSelectionSfx() {
  if (!selectionSfx) return;

  selectionSfx.pause();
  selectionSfx.currentTime = 0;
  selectionSfx.volume = 0.38;

  void selectionSfx.play().catch((error) => {
    console.warn(
      "Selection SFX playback failed:",
      error,
    );
  });
}

function fadeVhs(targetVolume, duration = 160) {
  if (!vhsAudio) return;

  window.clearInterval(vhsFadeTimer);

  const startVolume = vhsAudio.volume;
  const steps = Math.max(
    1,
    Math.ceil(duration / 20),
  );

  let step = 0;

  vhsFadeTimer = window.setInterval(() => {
    step += 1;

    const progress = Math.min(step / steps, 1);

    vhsAudio.volume =
      startVolume +
      (targetVolume - startVolume) * progress;

    if (step >= steps) {
      window.clearInterval(vhsFadeTimer);
      vhsFadeTimer = null;
      vhsAudio.volume = targetVolume;
    }
  }, 20);
}

function startVhs() {
  if (!vhsAudio) return;

  window.clearTimeout(vhsStopTimer);

  vhsAudio.currentTime = 0;
  vhsAudio.volume = 0;

  void vhsAudio.play().catch((error) => {
    console.warn(
      "VHS audio playback failed:",
      error,
    );
  });

  fadeVhs(0.14, 190);
}

function stopVhs() {
  if (!vhsAudio) return;

  fadeVhs(0, 130);

  window.clearTimeout(vhsStopTimer);

  vhsStopTimer = window.setTimeout(() => {
    if (vhsAudio.volume <= 0.001) {
      vhsAudio.pause();
      vhsAudio.currentTime = 0;
      vhsAudio.volume = 0;
    }
  }, 150);
}

function stopAudioElement(audio) {
  if (!(audio instanceof HTMLMediaElement)) return;

  audio.pause();
  audio.currentTime = 0;
  audio.playbackRate = 1;
  audio.volume = 0.22;
}

function updateTrackPresentation(card) {
  const track = selectedTrack(card);
  const control = card.querySelector(
    ".project__media",
  );

  const mediaLabel = card.querySelector(
    ".project__media-label",
  );

  const trackName = card.querySelector(
    ".track-name",
  );

  if (!control) return;

  const isPlaying = activeCard === card;

  control.setAttribute(
    "aria-label",
    `${isPlaying ? "Stop" : "Play"} ${track.label}`,
  );

  control.setAttribute(
    "aria-pressed",
    String(isPlaying),
  );

  if (mediaLabel) {
    mediaLabel.textContent =
      `${isPlaying ? "PLAYING" : "HOVER OR CLICK"}: ${track.label}`;
  }

  if (trackName) {
    trackName.textContent = track.label;
  }
}

function setPinned(card, isPinned) {
  card.dataset.pinned = String(isPinned);

  const pinControl = card.querySelector(
    ".keep-playing",
  );

  if (!pinControl) return;

  pinControl.setAttribute(
    "aria-pressed",
    String(isPinned),
  );

  pinControl.textContent = isPinned
    ? "STOP PLAYING"
    : "KEEP PLAYING";
}

function stopActiveCard() {
  if (!activeCard) return;

  const card = activeCard;
  const audioId = card.dataset.activeAudio;

  card.classList.remove("is-playing");

  if (audioId) {
    stopAudioElement(
      document.querySelector(`#${audioId}`),
    );
  }

  stopVhs();

  card.dataset.activeAudio = "";
  activeCard = null;

  setPinned(card, false);
  updateTrackPresentation(card);
}

async function startProjectAudio(card) {
  if (activeCard === card) return;

  let track = null;

  try {
    if (activeCard) {
      stopActiveCard();
    }

    track = selectedTrack(card);

    const audio = document.querySelector(
      `#${track.audioId}`,
    );

    if (!(audio instanceof HTMLMediaElement)) {
      throw new Error(
        `Audio element #${track.audioId} was not found`,
      );
    }

    activeCard = card;
    card.dataset.activeAudio = track.audioId;

    card.classList.add("is-playing");
    updateTrackPresentation(card);

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0.22;
    audio.playbackRate = 1;

    await audio.play();

    if (activeCard === card) {
      startVhs();
    }
  } catch (error) {
    console.error(
      `Project audio failed${
        track ? ` (${track.label})` : ""
      }:`,
      error,
    );

    if (activeCard === card) {
      stopActiveCard();
    }
  }
}

function stopProjectAudio(card, force = false) {
  if (
    activeCard !== card ||
    (!force &&
      card.dataset.pinned === "true")
  ) {
    return;
  }

  stopActiveCard();
}

document
  .querySelectorAll(".audio-project")
  .forEach((card) => {
    const mediaControl =
      card.querySelector(".project__media");

    const pinControl =
      card.querySelector(".keep-playing");

    const switchControl =
      card.querySelector(".track-switch");

    if (!mediaControl) return;

    setPinned(card, false);
    updateTrackPresentation(card);

    card.addEventListener(
      "pointerenter",
      () => {
        void startProjectAudio(card);
      },
    );

    card.addEventListener(
      "pointerleave",
      () => {
        stopProjectAudio(card);
      },
    );

    mediaControl.addEventListener(
      "click",
      () => {
        if (activeCard === card) {
          stopProjectAudio(card, true);
        } else {
          void startProjectAudio(card);
        }
      },
    );

    pinControl?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        if (
          activeCard === card &&
          card.dataset.pinned === "true"
        ) {
          stopProjectAudio(card, true);
          return;
        }

        setPinned(card, true);
        void startProjectAudio(card);
      },
    );

    switchControl?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        const tracks =
          playlists[card.dataset.playlist];

        if (!tracks || tracks.length === 0) {
          return;
        }

        const wasPlaying =
          activeCard === card;

        const wasPinned =
          card.dataset.pinned === "true";

        if (wasPlaying) {
          stopProjectAudio(card, true);
        }

        const currentIndex =
          Number.parseInt(
            card.dataset.trackIndex ?? "0",
            10,
          );

        const nextIndex =
          Number.isInteger(currentIndex) &&
          currentIndex >= 0
            ? (currentIndex + 1) % tracks.length
            : 0;

        card.dataset.trackIndex =
          String(nextIndex);

        playSelectionSfx();
        updateTrackPresentation(card);

        if (wasPinned) {
          setPinned(card, true);
        }

        if (wasPlaying) {
          void startProjectAudio(card);
        }
      },
    );
  });

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.15 },
);

document
  .querySelectorAll(".reveal")
  .forEach((element) => {
    observer.observe(element);
  });

startBoot();
