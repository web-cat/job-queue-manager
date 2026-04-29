import { select, input, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import ora from "ora";
import { api } from "../api.js";

export async function assignmentsMenu(): Promise<void> {
  const action = await select({
    message: chalk.cyan("Assignments"),
    choices: [
      { name: "List my assignments", value: "list" },
      { name: "View assignment details", value: "show" },
      { name: "View estimated wait time", value: "waittime" },
      { name: "Create assignment", value: "create" },
      { name: "Update assignment", value: "update" },
      { name: "← Back", value: "back" },
    ],
  });

  if (action === "back") return;

  if (action === "list") {
    const spinner = ora("Fetching assignments...").start();
    const res = await api.get<{ data: any[] }>("/assignments");
    spinner.stop();

    if (!res.ok) {
      if (res.status === 403) {
        console.log(
          chalk.red("✖ Access denied — instructor or admin role required"),
        );
      } else {
        console.log(chalk.red(`Error: ${res.error}`));
      }
      return;
    }

    const assignments = res.data?.data ?? [];
    if (assignments.length === 0) {
      console.log(chalk.yellow("No assignments found."));
      return;
    }

    console.log("");
    assignments.forEach((a: any) => {
      const pub = a.isPublic ? chalk.green("public") : chalk.gray("private");
      console.log(
        `  ${chalk.bold(a.id.toString().padEnd(4))} ${a.name.padEnd(40)} [${pub}]`,
      );
    });
    console.log("");
  }

  if (action === "show") {
    const id = await input({ message: "Assignment ID:" });
    const spinner = ora("Fetching assignment...").start();
    const res = await api.get<any>(`/assignments/${id}`);
    spinner.stop();

    if (!res.ok) {
      if (res.status === 403) {
        console.log(
          chalk.red("✖ Access denied — instructor or admin role required"),
        );
      } else {
        console.log(chalk.red(`Error: ${res.error}`));
      }
      return;
    }

    const a = res.data;
    console.log("");
    console.log(chalk.bold("  Assignment Details"));
    console.log(`  ID:          ${a.id}`);
    console.log(`  Name:        ${a.name}`);
    console.log(`  Description: ${a.description ?? "—"}`);
    console.log(
      `  Docker Image:${a.dockerImageTag ?? chalk.yellow(" not set")}`,
    );
    console.log(`  Public:      ${a.isPublic ? "yes" : "no"}`);
    console.log("");
  }

  if (action === "waittime") {
    const id = await input({ message: "Assignment ID:" });
    const spinner = ora("Fetching wait time estimate...").start();
    const res = await api.get<any>(`/assignments/${id}/wait-time`);
    spinner.stop();

    if (!res.ok) {
      console.log(chalk.red(`Error: ${res.error}`));
      return;
    }

    if (!res.data.estimatedWaitSeconds) {
      console.log(
        chalk.yellow("No execution history yet for this assignment."),
      );
      return;
    }

    console.log("");
    console.log(
      `  Estimated wait: ${chalk.bold(res.data.estimatedWaitSeconds + "s")}`,
    );
    console.log(`  Based on:       ${res.data.sampleSize} recent submissions`);
    console.log("");
  }

  if (action === "create") {
    const name = await input({ message: "Assignment name:" });
    const dockerImage = await input({
      message: "Docker image tag (e.g. vt-cs/java-grader:cs2114):",
    });
    const description = await input({ message: "Description (optional):" });
    const policyId = await input({
      message: "Submission policy ID (default: 1):",
      default: "1",
    });

    const spinner = ora("Creating assignment...").start();
    const res = await api.post<any>("/assignments", {
      name,
      dockerImageTag: dockerImage || null,
      description: description || null,
      submissionPolicyId: parseInt(policyId),
    });
    spinner.stop();

    if (!res.ok) {
      if (res.status === 403) {
        console.log(
          chalk.red("✖ Access denied — instructor or admin role required"),
        );
      } else {
        console.log(chalk.red(`Error: ${res.error}`));
      }
      return;
    }

    console.log(
      chalk.green(
        `✔ Created assignment: ${res.data.name} (ID: ${res.data.id})`,
      ),
    );
  }

  if (action === "update") {
    const id = await input({ message: "Assignment ID to update:" });
    const name = await input({ message: "New name (leave blank to keep):" });
    const dockerImage = await input({
      message: "New Docker image tag (leave blank to keep):",
    });

    const body: Record<string, string> = {};
    if (name) body.name = name;
    if (dockerImage) body.dockerImageTag = dockerImage;

    const spinner = ora("Updating assignment...").start();
    const res = await api.patch<any>(`/assignments/${id}`, body);
    spinner.stop();

    if (!res.ok) {
      if (res.status === 403) {
        console.log(
          chalk.red("✖ Access denied — instructor or admin role required"),
        );
      } else {
        console.log(chalk.red(`Error: ${res.error}`));
      }
      return;
    }

    console.log(chalk.green(`✔ Updated assignment: ${res.data.name}`));
  }
}
