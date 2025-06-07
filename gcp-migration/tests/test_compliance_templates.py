from pathlib import Path

def test_compliance_templates_exist():
    paths = [
        Path('gcp-migration/compliance/ISO_27001_template.md'),
        Path('gcp-migration/compliance/HIPAA_template.md'),
    ]
    for path in paths:
        assert path.exists(), f"Missing template: {path}"
