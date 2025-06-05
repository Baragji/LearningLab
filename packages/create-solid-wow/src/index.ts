#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import ora from "ora";

const program = new Command();

// Define the CLI version and description
program
  .version("0.1.0")
  .description("Create a new LearningLab project")
  .argument("[project-directory]", "Directory to create the project in")
  .option("--use-npm", "Use npm instead of yarn")
  .option("--skip-git", "Skip git initialization")
  .option("--skip-install", "Skip installing dependencies")
  .option("--skip-seed", "Skip seeding the database")
  .parse(process.argv);

// Main function to run the CLI
async function run() {
  console.log(chalk.bold("\n🚀 Welcome to create-solid-wow!\n"));
  console.log("Let's set up your new LearningLab project.\n");

  // Get the project directory from the command line or prompt for it
  let projectDir = program.args[0];
  const options = program.opts();

  if (!projectDir) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "projectDir",
        message: "What is the name of your project?",
        default: "learning-lab",
        validate: (input) => {
          if (input.trim() === "") {
            return "Project name cannot be empty";
          }
          return true;
        },
      },
    ]);
    projectDir = answers.projectDir;
  }

  // Create the project directory
  const targetDir = path.resolve(process.cwd(), projectDir);

  if (fs.existsSync(targetDir)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: `Directory ${projectDir} already exists. Do you want to overwrite it?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.red("Aborting..."));
      return;
    }

    fs.removeSync(targetDir);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  // Clone the repository
  if (!options.skipGit) {
    const spinner = ora("Cloning repository...").start();
    try {
      execSync(
        `git clone --depth 1 https://github.com/yourusername/LearningLab.git ${targetDir}`,
        { stdio: "ignore" },
      );

      // Remove the .git directory to start fresh
      fs.removeSync(path.join(targetDir, ".git"));

      spinner.succeed("Repository cloned successfully");
    } catch (error) {
      spinner.fail("Failed to clone repository");
      console.error(chalk.red(`Error: ${error}`));
      return;
    }
  }

  // Initialize a new git repository
  if (!options.skipGit) {
    const spinner = ora("Initializing git repository...").start();
    try {
      execSync("git init", { cwd: targetDir, stdio: "ignore" });
      execSync("git add .", { cwd: targetDir, stdio: "ignore" });
      execSync('git commit -m "Initial commit from create-solid-wow"', {
        cwd: targetDir,
        stdio: "ignore",
      });
      spinner.succeed("Git repository initialized");
    } catch (error) {
      spinner.fail("Failed to initialize git repository");
      console.error(chalk.red(`Error: ${error}`));
      // Continue even if git initialization fails
    }
  }

  // Install dependencies
  if (!options.skipInstall) {
    const spinner = ora("Installing dependencies...").start();
    try {
      const useYarn = !options.useNpm;

      if (useYarn) {
        execSync("yarn install", { cwd: targetDir, stdio: "ignore" });
      } else {
        execSync("npm install", { cwd: targetDir, stdio: "ignore" });
      }

      spinner.succeed("Dependencies installed");
    } catch (error) {
      spinner.fail("Failed to install dependencies");
      console.error(chalk.red(`Error: ${error}`));
      return;
    }
  }

  // Seed the database
  if (!options.skipSeed) {
    const spinner = ora("Seeding the database...").start();
    try {
      const useYarn = !options.useNpm;

      if (useYarn) {
        execSync("yarn seed", { cwd: targetDir, stdio: "ignore" });
      } else {
        execSync("npm run seed", { cwd: targetDir, stdio: "ignore" });
      }

      spinner.succeed("Database seeded");
    } catch (error) {
      spinner.fail("Failed to seed the database");
      console.error(chalk.red(`Error: ${error}`));
      // Continue even if seeding fails
    }
  }

  // Success message
  console.log("\n");
  console.log(chalk.green("✅ Project created successfully!"));
  console.log("\n");
  console.log(`To get started, run the following commands:`);
  console.log(chalk.cyan(`  cd ${projectDir}`));

  const useYarn = !options.useNpm;
  if (useYarn) {
    console.log(chalk.cyan("  yarn dev"));
  } else {
    console.log(chalk.cyan("  npm run dev"));
  }

  console.log("\n");
  console.log("Happy coding! 🎉");
}

// Run the CLI
run().catch((error) => {
  console.error(chalk.red("Error:"), error);
  process.exit(1);
});
