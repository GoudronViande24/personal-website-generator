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
	"projects-preview",
	"skills-add",
	"skill-template",
	"skills",
	"skills-preview",
	"achievements-add",
	"achievement-template",
	"achievements",
	"achievements-preview",
	"contact-infos-add",
	"contact-info-template",
	"contact-infos",
	"contact-infos-preview"
].forEach(element => form[element] = document.getElementById(element));

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

// ############################
// #         ABOUT ME         #
// ############################

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

// ############################
// #         PROJECTS         #
// ############################

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

// ############################
// #          SKILLS          #
// ############################

/**
 * List of all skills
 * @type {Element[]}
 */
const skills = [];

// Add a skill button listener
form["skills-add"].addEventListener("click", addSkill);

/**
 * Add a skill to the list
 * @param {Boolean} updatePreview - Update or not the preview
 * @returns {Element} - The new skill in the form
 */
function addSkill(updatePreview) {
	const clone = form["skill-template"].cloneNode(true);
	clone.id = "";
	const newSkill = form["skills"].appendChild(clone);
	skills.push(newSkill);
	newSkill.querySelector("button.skill-remove").addEventListener("click", removeSkill, { once: true });
	// Set event listeners for the inputs to refresh the preview
	[
		"skill-name",
		"skill-icon"
	].forEach(item => newSkill.querySelector(`input.${item}`).addEventListener("keyup", updateSkillsPreview));
	newSkill.querySelector(`input.skill-percentage`).addEventListener("change", updateSkillPercentage);
	if (updatePreview) updateSkillsPreview();
	return newSkill
};


/**
 * Update the percentage of a skill
 * @param {Event} event
 */
function updateSkillPercentage(event) {
	event.target.parentNode.parentNode.querySelector(`span.skill-percentage-value`).innerText = `${event.target.value}%`;
	updateSkillsPreview();
};

/**
 * Remove a skill from the list
 * @param {Event} event
 */
async function removeSkill(event) {
	skills.forEach((skill, i) => {
		if (skill == event.target.parentNode) skills.splice(i, 1);
	});
	event.target.parentNode.remove();
	updateSkillsPreview();
};

/**
 * Remove all skills in the form
 */
async function removeAllSkills() {
	skills.forEach(skill => skill.remove());
	skills.length = 0;
	updateSkillsPreview();
};

/**
 * Update the preview of the skills section
 */
function updateSkillsPreview() {
	const previews = [];

	skills.forEach(skill => {
		previews.push(`
		<div class="mb-5">
			<i class="bi bi-${skill.querySelector("input.skill-icon").value.toLowerCase()} fs-1"></i>
			<div class="progress my-3">
				<div class="progress-bar" role="progressbar" style="width: ${skill.querySelector("input.skill-percentage").value}%" aria-valuenow="${skill.querySelector("input.skill-percentage").value}" aria-valuemin="0"
					aria-valuemax="100"></div>
			</div>
			<h5>${skill.querySelector("input.skill-name").value}</h5>
		</div>
		`);
	});

	form["skills-preview"].innerHTML = previews.join("\n");
};

// ############################
// #       ACHIEVEMENTS       #
// ############################

/**
 * List of all achievements
 * @type {Element[]}
 */
const achievements = [];

// Add a achievement button listener
form["achievements-add"].addEventListener("click", addAchievement);

/**
 * Add a achievement to the list
 * @param {Boolean} updatePreview - Update or not the preview
 * @returns {Element} - The new achievement in the form
 */
function addAchievement(updatePreview) {
	const clone = form["achievement-template"].cloneNode(true);
	clone.id = "";
	const newAchievement = form["achievements"].appendChild(clone);
	achievements.push(newAchievement);
	newAchievement.querySelector("button.achievement-remove").addEventListener("click", removeAchievement, { once: true });
	// Set event listeners for the inputs to refresh the preview
	[
		"achievement-name",
		"achievement-icon",
		"achievement-school",
		"achievement-description",
		"achievement-link",
		"achievement-date"
	].forEach(item => newAchievement.querySelector(`input.${item}`).addEventListener("keyup", updateAchievementsPreview));
	if (updatePreview) updateAchievementsPreview();
	return newAchievement
};

/**
 * Remove a achievement from the list
 * @param {Event} event
 */
async function removeAchievement(event) {
	achievements.forEach((achievement, i) => {
		if (achievement == event.target.parentNode) achievements.splice(i, 1);
	});
	event.target.parentNode.remove();
	updateAchievementsPreview();
};

/**
 * Remove all achievements in the form
 */
async function removeAllAchievements() {
	achievements.forEach(achievement => achievement.remove());
	achievements.length = 0;
	updateAchievementsPreview();
};

/**
 * Update the preview of the achievements section
 */
function updateAchievementsPreview() {
	const previews = [];

	achievements.forEach(achievement => {
		previews.push(`
		<div class="card mb-3">
			<div class="card-header">
				${achievement.querySelector("input.achievement-school").value}
			</div>
			<div class="card-body">
				<h5 class="card-title">${achievement.querySelector("input.achievement-name").value}</h5>
				<i class="bi bi-${achievement.querySelector("input.achievement-icon").value.toLowerCase()}"></i>
				<p class="card-text">${achievement.querySelector("input.achievement-description").value}</p>
				<a href="${achievement.querySelector("input.achievement-link").value}" target="_blank" class="btn btn-secondary">
					See certificate
				</a>
			</div>
			<div class="card-footer text-muted">${achievement.querySelector("input.achievement-date").value}</div>
		</div>
		`);
	});

	form["achievements-preview"].innerHTML = previews.join("\n");
};

// ############################
// #       CONTACT INFO       #
// ############################

/**
 * List of all contact methods
 * @type {Element[]}
 */
const contactMethods = [];

// Add a contact method button listener
form["contact-infos-add"].addEventListener("click", addContactMethod);

/**
 * Add a contact method to the list
 * @param {Boolean} updatePreview - Update or not the preview
 * @returns {Element} - The new contact method in the form
 */
function addContactMethod(updatePreview) {
	const clone = form["contact-info-template"].cloneNode(true);
	clone.id = "";
	const newContactMethod = form["contact-infos"].appendChild(clone);
	contactMethods.push(newContactMethod);
	newContactMethod.querySelector("button.contact-info-remove").addEventListener("click", removeContactMethod, { once: true });
	// Set event listeners for the inputs to refresh the preview
	[
		"contact-info-name",
		"contact-info-icon",
		"contact-info-link"
	].forEach(item => newContactMethod.querySelector(`input.${item}`).addEventListener("keyup", updateContactMethodsPreview));
	if (updatePreview) updateContactMethodsPreview();
	return newContactMethod
};

/**
 * Remove a contact method from the list
 * @param {Event} event
 */
async function removeContactMethod(event) {
	contactMethods.forEach((contactMethod, i) => {
		if (contactMethod == event.target.parentNode) contactMethods.splice(i, 1);
	});
	event.target.parentNode.remove();
	updateContactMethodsPreview();
};

/**
 * Remove all contact methods in the form
 */
async function removeAllContactMethods() {
	contactMethods.forEach(contactMethod => contactMethod.remove());
	contactMethods.length = 0;
	updateContactMethodsPreview();
};

/**
 * Update the preview of the contact methods section
 */
function updateContactMethodsPreview() {
	const previews = [];

	contactMethods.forEach(contactMethod => {
		previews.push(`
		<a class="text-reset text-decoration-none" href="${contactMethod.querySelector("input.contact-info-link").value}" target="_blank">
			<div class="card mb-3 py-3">
				<div class="card-body">
					<h5 class="card-title">
						<i class="bi bi-${contactMethod.querySelector("input.contact-info-icon").value.toLowerCase()} fs-1"></i>
					</h5>
					<h5 class="card-text">
						${contactMethod.querySelector("input.contact-info-name").value}
					</h5>
				</div>
			</div>
		</a>
		`);
	});

	form["contact-infos-preview"].innerHTML = previews.join("\n");
};

// ############################
// #        RESET FORM        #
// ############################

/**
 * Reset the entire form. All data will be lost!
 */
function resetEverything() {
	if (confirm("Are you really really sure you want to reset everything?")) {

		// Reset the sidebar section
		const formSidebar = document.getElementById("form-sidebar");
		formSidebar.querySelectorAll("input[type='text']").forEach(element => element.value = "");

		// Reset the about me section
		form["about-me"].innerText = "";
		form["about-me-mode-text"].checked = true;
		updateAboutMeMode();

		// Reset projects section
		form["projects"].querySelectorAll("button.project-remove").forEach(element => element.click());

		// Reset skills section
		form["skills"].querySelectorAll("button.skill-remove").forEach(element => element.click());

		// Reset achievements section
		form["achievements"].querySelectorAll("button.achievement-remove").forEach(element => element.click());

		// Reset contact informations section
		form["contact-infos"].querySelectorAll("button.contact-info-remove").forEach(element => element.click());
	}
};

// Assign the function to the button
document.getElementById("reset-form").addEventListener("click", resetEverything);

// ############################
// #      EXPORT TO JSON      #
// ############################

