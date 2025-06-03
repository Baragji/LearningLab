#!/bin/bash

# Cost Monitoring Setup for 3-Month Credit Optimization
# Sætter op budget alerts og cost tracking

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ID="code-assistant-rag"
TOTAL_CREDIT=2000
MONTHS_REMAINING=3
MONTHLY_BUDGET=$((TOTAL_CREDIT / MONTHS_REMAINING))

echo -e "${BLUE}💰 Setting up cost monitoring for 3-month credit optimization${NC}"

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Create billing account budget
echo -e "${BLUE}📊 Creating budget alerts...${NC}"

# Get billing account ID
BILLING_ACCOUNT=$(gcloud billing accounts list --format="value(name)" --limit=1)

if [ -z "$BILLING_ACCOUNT" ]; then
    print_warning "No billing account found. Please set up billing first."
    exit 1
fi

# Create budget configuration
cat > budget-config.yaml << EOF
displayName: "Code Assistant RAG - 3 Month Budget"
budgetFilter:
  projects:
    - "projects/$PROJECT_ID"
amount:
  specifiedAmount:
    currencyCode: "DKK"
    units: "$MONTHLY_BUDGET"
thresholdRules:
  - thresholdPercent: 0.5
    spendBasis: CURRENT_SPEND
  - thresholdPercent: 0.8
    spendBasis: CURRENT_SPEND
  - thresholdPercent: 0.9
    spendBasis: CURRENT_SPEND
  - thresholdPercent: 1.0
    spendBasis: CURRENT_SPEND
allUpdatesRule:
  pubsubTopic: "projects/$PROJECT_ID/topics/budget-alerts"
  schemaVersion: "1.0"
EOF

# Create Pub/Sub topic for alerts
gcloud pubsub topics create budget-alerts --quiet || print_warning "Topic may already exist"

# Create budget
gcloud billing budgets create \
    --billing-account=$BILLING_ACCOUNT \
    --budget-from-file=budget-config.yaml \
    --quiet

print_status "Budget created: ${MONTHLY_BUDGET} DKK/month"

# Create cost monitoring dashboard
echo -e "${BLUE}📈 Creating cost monitoring dashboard...${NC}"

cat > cost-dashboard.json << EOF
{
  "displayName": "Code Assistant RAG - Cost Monitoring",
  "mosaicLayout": {
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Daily Spend",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"billing_account\"",
                    "aggregation": {
                      "alignmentPeriod": "86400s",
                      "perSeriesAligner": "ALIGN_SUM"
                    }
                  }
                }
              }
            ]
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "xPos": 6,
        "widget": {
          "title": "Credit Remaining",
          "scorecard": {
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"billing_account\""
              }
            },
            "sparkChartView": {
              "sparkChartType": "SPARK_LINE"
            }
          }
        }
      }
    ]
  }
}
EOF

# Create monitoring dashboard
gcloud monitoring dashboards create --config-from-file=cost-dashboard.json --quiet

print_status "Cost monitoring dashboard created"

# Create alert policies
echo -e "${BLUE}🚨 Creating alert policies...${NC}"

# Daily spend alert
cat > daily-spend-alert.yaml << EOF
displayName: "High Daily Spend Alert"
conditions:
  - displayName: "Daily spend > 50 DKK"
    conditionThreshold:
      filter: 'resource.type="billing_account"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 50
      duration: 3600s
notificationChannels: []
alertStrategy:
  autoClose: 86400s
EOF

gcloud alpha monitoring policies create --policy-from-file=daily-spend-alert.yaml --quiet

# Weekly spend alert  
cat > weekly-spend-alert.yaml << EOF
displayName: "Weekly Spend Alert"
conditions:
  - displayName: "Weekly spend > 350 DKK"
    conditionThreshold:
      filter: 'resource.type="billing_account"'
      comparison: COMPARISON_GREATER_THAN
      thresholdValue: 350
      duration: 3600s
notificationChannels: []
alertStrategy:
  autoClose: 604800s
EOF

gcloud alpha monitoring policies create --policy-from-file=weekly-spend-alert.yaml --quiet

print_status "Alert policies created"

# Create cost optimization script
echo -e "${BLUE}⚙️ Creating cost optimization script...${NC}"

cat > optimize-costs.sh << 'EOF'
#!/bin/bash

# Daily cost optimization script
PROJECT_ID="code-assistant-rag"
SERVICE_NAME="code-assistant-rag"
REGION="europe-west1"

echo "🔍 Checking current costs..."

# Get current spend
CURRENT_SPEND=$(gcloud billing budgets list --billing-account=$(gcloud billing accounts list --format="value(name)" --limit=1) --format="value(amount.specifiedAmount.units)")

echo "Current monthly spend: $CURRENT_SPEND DKK"

# Check if it's night time (22:00 - 06:00 CET)
HOUR=$(date +%H)
if [ $HOUR -ge 22 ] || [ $HOUR -le 6 ]; then
    echo "🌙 Night time detected - scaling down to save costs"
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --min-instances=0 \
        --max-instances=1 \
        --quiet
else
    echo "☀️ Day time - ensuring normal scaling"
    gcloud run services update $SERVICE_NAME \
        --region=$REGION \
        --min-instances=0 \
        --max-instances=3 \
        --quiet
fi

# Check for unused resources
echo "🧹 Checking for unused resources..."

# List unused Cloud Storage buckets
gsutil ls -L -b gs://* | grep "Time created" | head -5

# Check for old container images
gcloud container images list --repository=gcr.io/$PROJECT_ID

echo "✅ Cost optimization check complete"
EOF

chmod +x optimize-costs.sh

# Create cron job for daily optimization
echo -e "${BLUE}⏰ Setting up daily cost optimization...${NC}"

# Add to crontab (runs daily at 9 AM and 10 PM)
(crontab -l 2>/dev/null; echo "0 9,22 * * * $(pwd)/optimize-costs.sh") | crontab -

print_status "Daily cost optimization scheduled"

# Create credit tracking script
cat > track-credit.sh << 'EOF'
#!/bin/bash

# Credit tracking script for 3-month optimization
TOTAL_CREDIT=2000
START_DATE="2024-01-01"  # Update this to your actual start date
MONTHS_REMAINING=3

echo "💰 Google Cloud Credit Tracking"
echo "================================"

# Calculate days remaining
END_DATE=$(date -d "$START_DATE + 3 months" +%Y-%m-%d)
DAYS_REMAINING=$(( ($(date -d "$END_DATE" +%s) - $(date +%s)) / 86400 ))

echo "📅 Days remaining: $DAYS_REMAINING"
echo "💳 Total credit: $TOTAL_CREDIT DKK"

# Get current billing info (requires billing API)
echo "📊 Current usage:"
gcloud billing budgets list --billing-account=$(gcloud billing accounts list --format="value(name)" --limit=1) --format="table(displayName,amount.specifiedAmount.units,amount.specifiedAmount.currencyCode)"

# Calculate daily budget
DAILY_BUDGET=$(echo "scale=2; $TOTAL_CREDIT / ($DAYS_REMAINING + 1)" | bc)
echo "📈 Recommended daily budget: $DAILY_BUDGET DKK"

# Recommendations
if [ $DAYS_REMAINING -lt 30 ]; then
    echo "⚠️  WARNING: Less than 30 days remaining!"
    echo "💡 Consider preparing exit strategy"
fi

echo ""
echo "🎯 Optimization tips:"
echo "- Use GPU during development hours (9-17)"
echo "- Scale to zero during nights"
echo "- Export data weekly for backup"
echo "- Monitor daily spend < $DAILY_BUDGET DKK"
EOF

chmod +x track-credit.sh

print_status "Credit tracking script created"

# Summary
echo
echo -e "${GREEN}🎉 Cost monitoring setup completed!${NC}"
echo
echo -e "${BLUE}📋 What was created:${NC}"
echo "✅ Monthly budget: ${MONTHLY_BUDGET} DKK"
echo "✅ Budget alerts at 50%, 80%, 90%, 100%"
echo "✅ Cost monitoring dashboard"
echo "✅ Daily/weekly spend alerts"
echo "✅ Automated cost optimization (cron job)"
echo "✅ Credit tracking script"
echo
echo -e "${BLUE}🔧 Available commands:${NC}"
echo "Check credit status: ./track-credit.sh"
echo "Manual optimization: ./optimize-costs.sh"
echo "View dashboard: https://console.cloud.google.com/monitoring/dashboards"
echo "View billing: https://console.cloud.google.com/billing"
echo
echo -e "${YELLOW}💡 Pro tips for 3-month optimization:${NC}"
echo "1. Run ./track-credit.sh weekly"
echo "2. Use GPU during active development"
echo "3. Scale down during nights/weekends"
echo "4. Export data monthly as backup"
echo "5. Monitor alerts daily"

# Cleanup temp files
rm -f budget-config.yaml cost-dashboard.json daily-spend-alert.yaml weekly-spend-alert.yaml

print_status "Cost monitoring is now active!"