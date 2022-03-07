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

/**
 * Object containing all the parts of the form
 * @type {Object.<string, Element>}
 * 
 */
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
	"about-me-mode-html",
	"projects-add",
	"project-template",
	"projects",
	"projects-preview"
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

		// Import projects
		const githubPinned = await axios.get(`https://github-pinned-repo-api.herokuapp.com/?username=${githubUser.data.login}`);
		if (githubPinned.data) {
			await removeAllProjects();
			githubPinned.data.forEach(async (pin) => {
				const languagesRequest = await octokit.request(`GET /repos/${pin.owner}/${pin.repo}/languages`);
				const languages = [];
				for (const language in languagesRequest.data) languages.push(language);
				const project = addProject();

				project.querySelector("input.project-name").value = pin.repo;
				project.querySelector("input.project-icon").value = "github";
				project.querySelector("input.project-description").value = (pin.description ? pin.description : "");
				project.querySelector("input.project-skills").value = (languages ? languages.join(", ") : "");
				project.querySelector("input.project-url").value = pin.link;
				project.querySelector("input.project-thumbnail").value = pin.image;

				updateProjectsPreview();
			});
		};

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

/**
 * List of all projects
 * @type {Element[]}
 */
const projects = [];

// Add a project button listener
form["projects-add"].addEventListener("click", addProject);

/**
 * Add a project to the list
 * @param {Boolean} updatePreview - Update or not the preview
 * @returns {Element} - The new project in the form
 */
function addProject(updatePreview) {
	const clone = form["project-template"].cloneNode(true);
	clone.id = "";
	const newProject = form["projects"].appendChild(clone);
	projects.push(newProject);
	newProject.querySelector("button.project-remove").addEventListener("click", removeProject, { once: true });
	// Set event listeners for the inputs to refresh the preview
	[
		"project-name",
		"project-icon",
		"project-description",
		"project-skills",
		"project-url",
		"project-thumbnail"
	].forEach(item => newProject.querySelector(`input.${item}`).addEventListener("keyup", updateProjectsPreview));
	if (updatePreview) updateProjectsPreview();
	return newProject
};

/**
 * Remove a project from the list
 * @param {Event} event
 */
async function removeProject(event) {
	projects.forEach((project, i) => {
		if (project == event.target.parentNode) projects.splice(i, 1);
	});
	event.target.parentNode.remove();
	updateProjectsPreview();
};

/**
 * Remove all projects in the form
 */
async function removeAllProjects() {
	projects.forEach(project => project.remove());
	projects.length = 0;
	updateProjectsPreview();
};

/**
 * Update the preview of the projects section
 */
function updateProjectsPreview() {
	const previews = [];

	projects.forEach(project => {
		previews.push(`
		<a class="text-reset text-decoration-none"
			href="${project.querySelector("input.project-url").value}" target="_blank">
			<div class="card mb-3">
				<div class="card-img-top"
					style="background-image: url('${project.querySelector("input.project-thumbnail").value}');"></div>
				<div class="card-body">
					<h5 class="card-title">
						<i class="bi bi-${project.querySelector("input.project-icon").value.toLowerCase()} me-3"></i>${project.querySelector("input.project-name").value}
					</h5>
					<p class="card-text">
						${project.querySelector("input.project-description").value}
					</p>
					<p class="card-text">
						<small class="text-muted">${project.querySelector("input.project-skills").value}</small>
					</p>
				</div>
			</div>
		</a>
		`);
	});

	form["projects-preview"].innerHTML = previews.join("\n");
}; 