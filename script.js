import { Octokit } from "https://cdn.skypack.dev/@octokit/core";
import axios from "https://cdn.skypack.dev/axios";
import showdown from "https://cdn.skypack.dev/showdown";
const octokit = new Octokit();
const converter = new showdown.Converter({
	simplifiedAutoLink: true,
	underline: true,
	openLinksInNewWindow: true,
	backslashEscapesHTMLTages: true,
	emoji: true,
	ghMentions: true,
	headerLevelStart: 3,
	noHeaderId: true
});
converter.setFlavor("github");

// Import section
const githubButton = document.getElementById("githubButton");

// Form section
const form = {};
[
	"name",
	"nickname",
	"avatar",
	"facebook",
	"instagram",
	"youtube",
	"twitch",
	"discord",
	"linkedin",
	"paypal",
	"pinterest",
	"reddit",
	"snapchat",
	"telegram",
	"twitter",
	"github",
	"stack-overflow",
	"vimeo",
	"about-me",
	"about-me-mode",
	"about-me-mode-text",
	"about-me-mode-md",
	"about-me-mode-html"
].forEach(i => form[i] = document.getElementById(i));

// Import from GitHub
githubButton.addEventListener("click", async () => {
	const input = document.getElementById("githubInput").value;
	if (!githubInput.value) {
		return alert("Please enter a username.");
	};

	try {

		const githubUser = await octokit.request(`GET /users/${input}`);

		form.name.value = githubUser.data.name;
		form.nickname.value = githubUser.data.login;
		form.avatar.value = githubUser.data.avatar_url;
		form.github.value = githubUser.data.html_url;

		try {
			var githubUserRepo = await octokit.request(`GET /repos/${input}/${input}`);
			if (githubUserRepo) {
				var readme = await axios.get(`https://raw.githubusercontent.com/${githubUserRepo.data.full_name}/${githubUserRepo.data.default_branch}/README.md`);
			};
		} catch (e) {
			// Rethrow non-404 error code
			if (e != "HttpError: Not Found") throw e;
		};

		if (readme) {
			form["about-me"].innerText = readme.data;
			form["about-me-mode-md"].checked = true;
			updateAboutMeMode();
		} else if (githubUser.data.bio) {
			form["about-me"].innerText = githubUser.data.bio;
			form["about-me-mode-text"].checked = true;
			updateAboutMeMode();
		};

		const githubPinned = await axios.get(`https://github-pinned-repo-api.herokuapp.com/?username=${githubUser.data.login}`);

		

	} catch (e) {
		if (e == "HttpError: Not Found") return alert("User not found.");
		alert("An error occured.");
		console.error(e);
	};
});

// About me
form["about-me"].addEventListener("keyup", updateAboutMePreview);
form["about-me-mode"].addEventListener("click", updateAboutMeMode);

/**
 * Update the "About me" preview
 */
async function updateAboutMePreview() {
	const preview = document.getElementById("about-me-preview");
	const mode = document.querySelector("input[name='about-me-mode']:checked").value;

	if (mode == "text") {
		preview.innerText = form["about-me"].innerText;
	} else if (mode == "md") {
		preview.innerHTML = converter.makeHtml(form["about-me"].innerText);
	} else {
		preview.innerHTML = form["about-me"].innerText;
	};
};

/**
 * Update the "About me" mode
 */
async function updateAboutMeMode() {
	const mode = document.querySelector("input[name='about-me-mode']:checked").value;
	if (mode == "text") {
		form["about-me"].classList.remove("font-monospace");
	} else {
		form["about-me"].classList.add("font-monospace");
	};

	updateAboutMePreview();
};