import { input, confirm } from "@inquirer/prompts";
import chalk from "chalk";
import {
  saveCredentials,
  clearCredentials,
  getCredentials,
  getConfigPath,
} from "../config.js";
import { api } from "../api.js";
import ora from "ora";

export async function setupMenu(): Promise<void> {
  console.log("");
  console.log(chalk.bold("  JQM CLI Setup"));
  console.log(chalk.gray("  Credentials are stored at: " + getConfigPath()));
  console.log("");
  console.log("  To get your credentials:");
  console.log("    1. Log into the JQM frontend");
  console.log("    2. Go to Settings → API Credentials");
  console.log('    3. Click "Generate new credentials"');
  console.log("    4. Copy the client_id and client_secret (shown once)");
  console.log("");

  const serverUrl = await input({
    message: "Server URL:",
    default: "https://webcatmaxxers.discovery.cs.vt.edu",
  });

  const clientId = await input({ message: "Client ID (UUID):" });
  const clientSecret = await input({ message: "Client Secret:" });

  const spinner = ora("Verifying credentials...").start();

  // Temporarily save to test the connection
  saveCredentials({ clientId, clientSecret, serverUrl });

  const res = await api.get("/auth/me");
  spinner.stop();

  if (!res.ok) {
    clearCredentials();
    console.log(chalk.red(`✖ Connection failed: ${res.error}`));
    console.log(chalk.gray("  Check your credentials and server URL"));
    return;
  }

  const user = res.data as any;
  console.log(
    chalk.green(
      `✔ Connected as: ${user.firstName} ${user.lastName} (${user.email})`,
    ),
  );
  console.log(chalk.gray(`  Credentials saved to ${getConfigPath()}`));
  console.log("");
}

export async function showCurrentUser(): Promise<void> {
  const creds = getCredentials();
  if (!creds) {
    console.log(chalk.yellow("Not configured. Run setup first."));
    return;
  }

  const spinner = ora("Fetching user info...").start();
  const res = await api.get<any>("/auth/me");
  spinner.stop();

  if (!res.ok) {
    console.log(chalk.red(`Error: ${res.error}`));
    return;
  }

  const user = res.data;
  const roleNames: Record<number, string> = {
    1: "Admin",
    2: "Instructor",
    3: "Student",
  };
  console.log("");
  console.log(chalk.bold("  Current User"));
  console.log(`  Name:   ${user.firstName} ${user.lastName}`);
  console.log(`  Email:  ${user.email}`);
  console.log(`  Role:   ${roleNames[user.globalRoleId] ?? user.globalRoleId}`);
  console.log(`  Server: ${creds.serverUrl}`);
  console.log("");
}
