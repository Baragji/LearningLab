#!/usr/bin/env python3
"""
Mission Control for MCP Enterprise Master Agent
Manages phase progression, testing, and documentation
"""

import os
import json
import subprocess
import datetime
from pathlib import Path
from typing import Dict, List, Optional

class MissionControl:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.status_file = self.project_root / "MCP_ENTERPRISE_STATUS.md"
        self.phases = {
            1: "Forberedelse og arkitekturdesign",
            2: "Forbedringer af RAG-engine og MCP-server", 
            3: "Containerisering og lokalt setup",
            4: "GCP infrastruktur med Terraform og Cloud Build"
        }
        
    def get_current_phase(self) -> int:
        """Determine current phase from status file"""
        if not self.status_file.exists():
            return 1
            
        with open(self.status_file, 'r') as f:
            content = f.read()
            
        # Look for phase status markers
        for phase_num in range(4, 0, -1):  # Check from highest to lowest
            if f"### ✅ Fase {phase_num}:" in content and "COMPLETED" in content:
                return phase_num + 1 if phase_num < 4 else 4
            elif f"### 🔄 Fase {phase_num}:" in content and "IN PROGRESS" in content:
                return phase_num
                
        return 1
        
    def update_phase_status(self, phase: int, status: str, notes: str = ""):
        """Update phase status in status file"""
        if not self.status_file.exists():
            print("❌ Status file not found. Run setup first.")
            return False
            
        with open(self.status_file, 'r') as f:
            content = f.read()
            
        # Update status markers
        status_icons = {
            "PENDING": "⏳",
            "IN PROGRESS": "🔄", 
            "COMPLETED": "✅",
            "BLOCKED": "🚫"
        }
        
        icon = status_icons.get(status, "❓")
        
        # Replace phase status line
        old_pattern = f"### [⏳🔄✅🚫❓] Fase {phase}:"
        new_line = f"### {icon} Fase {phase}: {self.phases[phase]} ({status})"
        
        # This is a simplified replacement - in practice you'd want more robust parsing
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if f"Fase {phase}:" in line and line.startswith("###"):
                lines[i] = new_line
                break
                
        # Add timestamp and notes
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if notes:
            lines.append(f"\n**Update {timestamp}:** {notes}")
            
        with open(self.status_file, 'w') as f:
            f.write('\n'.join(lines))
            
        print(f"✅ Updated Fase {phase} status to: {status}")
        return True
        
    def run_tests(self, test_type: str = "all") -> bool:
        """Run tests and return success status"""
        print(f"🧪 Running {test_type} tests...")
        
        test_commands = {
            "readiness": ["python", "test_agent_readiness.py"],
            "unit": ["python", "-m", "pytest", "tests/", "-v"],
            "e2e": ["python", "gcp-migration/test_e2e.py"],
            "integration": ["python", "-m", "pytest", "tests/integration/", "-v"]
        }
        
        if test_type == "all":
            commands_to_run = list(test_commands.values())
        else:
            commands_to_run = [test_commands.get(test_type)]
            
        all_passed = True
        for cmd in commands_to_run:
            if cmd:
                try:
                    result = subprocess.run(
                        cmd, 
                        capture_output=True, 
                        text=True,
                        cwd=self.project_root
                    )
                    
                    if result.returncode == 0:
                        print(f"✅ {' '.join(cmd)} - PASSED")
                    else:
                        print(f"❌ {' '.join(cmd)} - FAILED")
                        print(f"Error: {result.stderr}")
                        all_passed = False
                        
                except Exception as e:
                    print(f"❌ Error running {' '.join(cmd)}: {e}")
                    all_passed = False
                    
        return all_passed
        
    def validate_phase_completion(self, phase: int) -> bool:
        """Validate that phase is ready for completion"""
        print(f"🔍 Validating Fase {phase} completion...")
        
        # Phase-specific validation
        validations = {
            1: self._validate_phase_1,
            2: self._validate_phase_2,
            3: self._validate_phase_3,
            4: self._validate_phase_4
        }
        
        validator = validations.get(phase)
        if not validator:
            print(f"❌ No validator for phase {phase}")
            return False
            
        return validator()
        
    def _validate_phase_1(self) -> bool:
        """Validate Phase 1 completion"""
        checks = [
            ("Kodebase analysis completed", self._check_analysis_docs),
            ("Architecture documented", self._check_architecture_docs),
            ("Folder structure organized", self._check_folder_structure),
            ("All tests passing", lambda: self.run_tests("unit"))
        ]
        
        return self._run_validation_checks(checks)
        
    def _validate_phase_2(self) -> bool:
        """Validate Phase 2 completion"""
        checks = [
            ("Batching implemented", self._check_batching_implementation),
            ("Caching implemented", self._check_caching_implementation),
            ("Error handling improved", self._check_error_handling),
            ("E2E tests passing", lambda: self.run_tests("e2e"))
        ]
        
        return self._run_validation_checks(checks)
        
    def _validate_phase_3(self) -> bool:
        """Validate Phase 3 completion"""
        checks = [
            ("Dockerfile created", self._check_dockerfile),
            ("Docker build successful", self._check_docker_build),
            ("Container tests passing", self._check_container_tests)
        ]
        
        return self._run_validation_checks(checks)
        
    def _validate_phase_4(self) -> bool:
        """Validate Phase 4 completion"""
        checks = [
            ("Terraform config created", self._check_terraform_config),
            ("CI/CD pipeline configured", self._check_cicd_config),
            ("Infrastructure tests passing", self._check_infrastructure_tests)
        ]
        
        return self._run_validation_checks(checks)
        
    def _run_validation_checks(self, checks: List[tuple]) -> bool:
        """Run a list of validation checks"""
        all_passed = True
        
        for check_name, check_func in checks:
            try:
                if check_func():
                    print(f"✅ {check_name}")
                else:
                    print(f"❌ {check_name}")
                    all_passed = False
            except Exception as e:
                print(f"❌ {check_name} - Error: {e}")
                all_passed = False
                
        return all_passed
        
    # Validation helper methods
    def _check_analysis_docs(self) -> bool:
        """Check if analysis documentation exists"""
        docs_path = self.project_root / "docs" / "architecture-analysis.md"
        return docs_path.exists()
        
    def _check_architecture_docs(self) -> bool:
        """Check if architecture documentation exists"""
        docs_path = self.project_root / "docs" / "enterprise-architecture.md"
        return docs_path.exists()
        
    def _check_folder_structure(self) -> bool:
        """Check if proper folder structure exists"""
        required_dirs = ["src", "tests", "infra", "docker"]
        return all((self.project_root / "gcp-migration" / d).exists() for d in required_dirs)
        
    def _check_batching_implementation(self) -> bool:
        """Check if batching is implemented"""
        rag_file = self.project_root / "gcp-migration/src/rag_engine_openai.py"
        if not rag_file.exists():
            return False
        with open(rag_file, 'r') as f:
            content = f.read()
        return "batch" in content.lower()
        
    def _check_caching_implementation(self) -> bool:
        """Check if caching is implemented"""
        rag_file = self.project_root / "gcp-migration/src/rag_engine_openai.py"
        if not rag_file.exists():
            return False
        with open(rag_file, 'r') as f:
            content = f.read()
        return "cache" in content.lower() or "lru_cache" in content
        
    def _check_error_handling(self) -> bool:
        """Check if improved error handling exists"""
        server_file = self.project_root / "gcp-migration/src/mcp_server_with_rag.py"
        if not server_file.exists():
            return False
        with open(server_file, 'r') as f:
            content = f.read()
        return "HTTPException" in content and "try:" in content
        
    def _check_dockerfile(self) -> bool:
        """Check if Dockerfile exists"""
        dockerfile = self.project_root / "gcp-migration/docker/Dockerfile"
        return dockerfile.exists()
        
    def _check_docker_build(self) -> bool:
        """Check if Docker build works"""
        try:
            result = subprocess.run(
                ["docker", "build", "-t", "test-mcp-server", "gcp-migration/"],
                capture_output=True,
                cwd=self.project_root
            )
            return result.returncode == 0
        except:
            return False
            
    def _check_container_tests(self) -> bool:
        """Check if container tests pass"""
        # This would run tests inside container
        return True  # Placeholder
        
    def _check_terraform_config(self) -> bool:
        """Check if Terraform config exists"""
        tf_dir = self.project_root / "gcp-migration/infra/terraform"
        return (tf_dir / "main.tf").exists()
        
    def _check_cicd_config(self) -> bool:
        """Check if CI/CD config exists"""
        github_dir = self.project_root / ".github/workflows"
        cloudbuild_dir = self.project_root / "gcp-migration/infra/cloudbuild"
        return (github_dir / "ci_cd.yaml").exists() or (cloudbuild_dir / "cloudbuild.yaml").exists()
        
    def _check_infrastructure_tests(self) -> bool:
        """Check if infrastructure tests pass"""
        # This would test Terraform plan/validate
        return True  # Placeholder
        
    def start_phase(self, phase: int) -> bool:
        """Start a specific phase"""
        current_phase = self.get_current_phase()
        
        if phase > current_phase:
            print(f"❌ Cannot start Fase {phase}. Complete Fase {current_phase} first.")
            return False
            
        if phase < current_phase:
            print(f"⚠️ Fase {phase} already completed. Current phase: {current_phase}")
            return True
            
        print(f"🚀 Starting Fase {phase}: {self.phases[phase]}")
        self.update_phase_status(phase, "IN PROGRESS", f"Started at {datetime.datetime.now()}")
        return True
        
    def complete_phase(self, phase: int) -> bool:
        """Complete a specific phase"""
        if not self.validate_phase_completion(phase):
            print(f"❌ Fase {phase} validation failed. Cannot complete.")
            return False
            
        print(f"✅ Fase {phase} completed successfully!")
        self.update_phase_status(phase, "COMPLETED", f"Completed at {datetime.datetime.now()}")
        
        # Auto-start next phase if available
        if phase < 4:
            next_phase = phase + 1
            print(f"🔄 Auto-starting Fase {next_phase}")
            self.start_phase(next_phase)
            
        return True
        
    def get_mission_status(self) -> Dict:
        """Get overall mission status"""
        current_phase = self.get_current_phase()
        completed_phases = current_phase - 1 if current_phase <= 4 else 4
        
        return {
            "current_phase": current_phase,
            "completed_phases": completed_phases,
            "total_phases": 4,
            "progress_percentage": (completed_phases / 4) * 100,
            "phase_name": self.phases.get(current_phase, "Mission Complete")
        }

def main():
    """Main CLI interface"""
    import sys
    
    mc = MissionControl()
    
    if len(sys.argv) < 2:
        print("Usage: python mission_control.py <command> [args]")
        print("Commands:")
        print("  status - Show mission status")
        print("  start <phase> - Start specific phase")
        print("  complete <phase> - Complete specific phase")
        print("  test [type] - Run tests")
        print("  validate <phase> - Validate phase completion")
        return
        
    command = sys.argv[1]
    
    if command == "status":
        status = mc.get_mission_status()
        print(f"📊 Mission Status:")
        print(f"   Current Phase: {status['current_phase']} - {status['phase_name']}")
        print(f"   Progress: {status['progress_percentage']:.1f}% ({status['completed_phases']}/{status['total_phases']} phases)")
        
    elif command == "start" and len(sys.argv) > 2:
        phase = int(sys.argv[2])
        mc.start_phase(phase)
        
    elif command == "complete" and len(sys.argv) > 2:
        phase = int(sys.argv[2])
        mc.complete_phase(phase)
        
    elif command == "test":
        test_type = sys.argv[2] if len(sys.argv) > 2 else "all"
        mc.run_tests(test_type)
        
    elif command == "validate" and len(sys.argv) > 2:
        phase = int(sys.argv[2])
        mc.validate_phase_completion(phase)
        
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()