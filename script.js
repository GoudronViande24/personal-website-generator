import { Octokit } from "https://cdn.skypack.dev/@octokit/core";
const octokit = new Octokit();

// Input section
const githubButton = document.getElementById("githubButton");

// Form section


// Handle the imports
githubButton.addEventListener("click", async () => {
	const input = document.getElementById("githubInput").value;
	if (!githubInput.value) {
		return alert("Please enter a username.");
	};

	try {

		const githubUser = await octokit.request(`GET /users/${input}`);
		try {
			var githubUserRepo = await octokit.request(`GET /repos/${input}/${input}`);
		} catch (e) {
			// Rethrow non-404 error code
			if (e != "HttpError: Not Found") throw e;
		};
		
		console.log("ok");

	} catch (e) {
		if (e == "HttpError: Not Found") return alert("User not found.");
		alert("An error occured.");
		console.error(e);
	};
});