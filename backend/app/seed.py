from __future__ import annotations

from sqlalchemy.orm import Session

from .models import QuizQuestion


QUESTION_BANK: dict[str, list[dict]] = {
    "AWS DevOps": [
        {
            "prompt": "Which AWS service is commonly used to run containerized workloads without managing servers?",
            "options": ["EC2", "ECS Fargate", "S3", "CloudFront"],
            "correct_option_index": 1,
        },
        {
            "prompt": "What does CI/CD stand for in DevOps?",
            "options": [
                "Code Integration / Code Delivery",
                "Continuous Integration / Continuous Delivery",
                "Cloud Infrastructure / Cloud Deployment",
                "Core Iteration / Core Design",
            ],
            "correct_option_index": 1,
        },
        {
            "prompt": "Which AWS service is best suited for infrastructure as code?",
            "options": ["CloudFormation", "Route 53", "DynamoDB", "SNS"],
            "correct_option_index": 0,
        },
        {
            "prompt": "Which AWS service is used for serverless compute?",
            "options": ["Lambda", "RDS", "SQS", "IAM"],
            "correct_option_index": 0,
        },
        {
            "prompt": "Which AWS service can orchestrate containers on Kubernetes?",
            "options": ["EKS", "SES", "SQS", "CloudTrail"],
            "correct_option_index": 0,
        },
    ],
    "QA": [
        {
            "prompt": "Which test type focuses on verifying a single function in isolation?",
            "options": ["Unit test", "Load test", "Smoke test", "UI test"],
            "correct_option_index": 0,
        },
        {
            "prompt": "What does regression testing help detect?",
            "options": [
                "New hardware issues",
                "Bugs introduced by recent changes",
                "API latency only",
                "Network failures only",
            ],
            "correct_option_index": 1,
        },
        {
            "prompt": "What is the purpose of a smoke test?",
            "options": [
                "Check critical functionality quickly",
                "Find all security issues",
                "Measure database size",
                "Replace regression testing",
            ],
            "correct_option_index": 0,
        },
        {
            "prompt": "Which type of testing checks the system under high load?",
            "options": ["Performance testing", "Unit testing", "Acceptance testing", "Exploratory testing"],
            "correct_option_index": 0,
        },
        {
            "prompt": "What is the objective of UAT?",
            "options": [
                "Validate the product for business users",
                "Replace code review",
                "Increase CPU usage",
                "Benchmark the database",
            ],
            "correct_option_index": 0,
        },
    ],
    "Salesforce": [
        {
            "prompt": "Which Salesforce feature is used to automate business logic without code?",
            "options": ["Apex Trigger", "Flow", "Visualforce", "SOQL"],
            "correct_option_index": 1,
        },
        {
            "prompt": "What is the Salesforce language used for server-side logic?",
            "options": ["Apex", "LWC", "JavaScript", "Python"],
            "correct_option_index": 0,
        },
        {
            "prompt": "What is Lightning Web Components primarily used for?",
            "options": [
                "Building modern Salesforce UIs",
                "Database backups",
                "Server provisioning",
                "Data warehouse modeling",
            ],
            "correct_option_index": 0,
        },
        {
            "prompt": "Which language is commonly used to query Salesforce data?",
            "options": ["SOQL", "SQL Server", "KQL", "GraphQL only"],
            "correct_option_index": 0,
        },
        {
            "prompt": "What is the main purpose of validation rules in Salesforce?",
            "options": [
                "Enforce data quality constraints",
                "Deploy packages",
                "Create dashboards",
                "Manage permissions only",
            ],
            "correct_option_index": 0,
        },
    ],
}


def seed_questions(db: Session) -> None:
    # Always reseed so question count stays in sync with QUESTION_BANK.
    db.query(QuizQuestion).delete()

    for domain, questions in QUESTION_BANK.items():
        for position, question in enumerate(questions, start=1):
            db.add(
                QuizQuestion(
                    domain=domain,
                    prompt=question["prompt"],
                    options=question["options"],
                    correct_option_index=question["correct_option_index"],
                    position=position,
                )
            )

    db.commit()
