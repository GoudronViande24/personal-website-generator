import { Octokit } from "https://cdn.skypack.dev/@octokit/core";
import axios from "https://cdn.skypack.dev/axios";
import showdown from "https://cdn.skypack.dev/showdown";
const octokit = new Octokit();
const converter = new showdown.Converter();

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
	"vimeo"
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
		} catch (e) {
			// Rethrow non-404 error code
			if (e != "HttpError: Not Found") throw e;
		};

		if (githubUserRepo) {
			var readme = await axios.get(`https://raw.githubusercontent.com/${githubUserRepo.data.full_name}/${githubUserRepo.data.default_branch}/README.md`);
		};



	} catch (e) {
		if (e == "HttpError: Not Found") return alert("User not found.");
		alert("An error occured.");
		console.error(e);
	};
});