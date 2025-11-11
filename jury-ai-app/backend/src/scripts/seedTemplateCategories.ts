/**
 * Seed Script: Populate Template Categories
 * Run this script to create sample templates for each category
 * 
 * Usage: ts-node src/scripts/seedTemplateCategories.ts
 */

import mongoose from 'mongoose';
import Template from '../models/Template';
import User from '../models/User';
import { TEMPLATE_CATEGORIES, getCategoryDescription } from '../config/templateCategories';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jury-ai';

// Sample template content for each category
const templateSamples: Record<string, { title: string; description: string; content: string }> = {
  'Sales Documents and Forms': {
    title: 'Sales Agreement Template',
    description: 'Comprehensive sales agreement for goods and services with payment terms and delivery conditions.',
    content: `SALES AGREEMENT

This Sales Agreement is entered into on {{date}} between:

Seller: {{sellerName}}
Address: {{sellerAddress}}

Buyer: {{buyerName}}
Address: {{buyerAddress}}

1. PRODUCTS/SERVICES
The Seller agrees to sell and the Buyer agrees to purchase the following:
{{productDescription}}

2. PRICE AND PAYMENT
Total Purchase Price: {{price}}
Payment Terms: {{paymentTerms}}

3. DELIVERY
Delivery Date: {{deliveryDate}}
Delivery Location: {{deliveryLocation}}

4. WARRANTIES
{{warranties}}

Seller Signature: _________________  Date: _______
Buyer Signature: _________________   Date: _______`
  },
  'Policy and Compliance Documents': {
    title: 'Company Privacy Policy Template',
    description: 'GDPR-compliant privacy policy template for websites and mobile applications.',
    content: `PRIVACY POLICY

Last Updated: {{lastUpdated}}

{{companyName}} ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.

1. INFORMATION WE COLLECT
We collect the following types of information:
- Personal identification information
- Usage data
- Cookies and tracking data

2. HOW WE USE YOUR INFORMATION
{{dataUsage}}

3. DATA SHARING
{{dataSharingPolicy}}

4. YOUR RIGHTS
{{userRights}}

5. CONTACT US
{{contactInformation}}`
  },
  'Letters and Notices Templates': {
    title: 'Formal Business Letter Template',
    description: 'Professional business letter template for various corporate communications.',
    content: `{{senderName}}
{{senderAddress}}
{{senderCity}}, {{senderState}} {{senderZip}}
{{senderEmail}}
{{senderPhone}}

{{date}}

{{recipientName}}
{{recipientTitle}}
{{recipientCompany}}
{{recipientAddress}}
{{recipientCity}}, {{recipientState}} {{recipientZip}}

Dear {{recipientName}},

{{letterBody}}

{{closingParagraph}}

Sincerely,

{{senderName}}
{{senderTitle}}`
  },
  'Web & Technology Agreements': {
    title: 'Website Terms of Service',
    description: 'Comprehensive terms of service for websites and web applications.',
    content: `TERMS OF SERVICE

Effective Date: {{effectiveDate}}

1. ACCEPTANCE OF TERMS
By accessing {{websiteName}}, you agree to be bound by these Terms of Service.

2. USER ACCOUNTS
{{accountTerms}}

3. INTELLECTUAL PROPERTY
{{ipRights}}

4. USER CONDUCT
Users agree not to:
- Violate any laws or regulations
- Infringe on intellectual property rights
- {{additionalProhibitions}}

5. LIMITATION OF LIABILITY
{{liabilityClause}}

6. GOVERNING LAW
{{governingLaw}}`
  },
  'Proposal Templates': {
    title: 'Business Proposal Template',
    description: 'Professional business proposal template for service offerings and project bids.',
    content: `BUSINESS PROPOSAL

Prepared for: {{clientName}}
Prepared by: {{companyName}}
Date: {{date}}

EXECUTIVE SUMMARY
{{executiveSummary}}

PROJECT SCOPE
{{projectScope}}

DELIVERABLES
{{deliverables}}

TIMELINE
{{timeline}}

PRICING
{{pricingDetails}}

TERMS AND CONDITIONS
{{termsAndConditions}}

Contact: {{contactPerson}}
Email: {{email}}
Phone: {{phone}}`
  },
  'Financial Agreements': {
    title: 'Loan Agreement Template',
    description: 'Personal or business loan agreement with repayment terms and interest rates.',
    content: `LOAN AGREEMENT

This Loan Agreement is made on {{date}} between:

Lender: {{lenderName}}
Address: {{lenderAddress}}

Borrower: {{borrowerName}}
Address: {{borrowerAddress}}

1. LOAN AMOUNT
Principal Amount: {{loanAmount}}

2. INTEREST RATE
Annual Interest Rate: {{interestRate}}%

3. REPAYMENT TERMS
Payment Schedule: {{paymentSchedule}}
Payment Amount: {{paymentAmount}}
Due Date: {{dueDate}}

4. DEFAULT
{{defaultTerms}}

5. GOVERNING LAW
{{governingLaw}}

Lender Signature: _________________  Date: _______
Borrower Signature: _________________  Date: _______`
  },
  'Family Law': {
    title: 'Child Custody Agreement',
    description: 'Custody arrangement agreement for separated or divorced parents.',
    content: `CHILD CUSTODY AGREEMENT

This agreement is made on {{date}} between:

Parent A: {{parent1Name}}
Parent B: {{parent2Name}}

Regarding the minor child(ren): {{childrenNames}}

1. LEGAL CUSTODY
{{legalCustodyArrangement}}

2. PHYSICAL CUSTODY
{{physicalCustodySchedule}}

3. VISITATION SCHEDULE
{{visitationSchedule}}

4. DECISION MAKING
{{decisionMakingAuthority}}

5. CHILD SUPPORT
{{childSupportTerms}}

Parent A Signature: _________________  Date: _______
Parent B Signature: _________________  Date: _______`
  },
  'Employment Legal Templates': {
    title: 'Employment Contract Template',
    description: 'Comprehensive employment agreement covering terms, compensation, and responsibilities.',
    content: `EMPLOYMENT AGREEMENT

This Employment Agreement is entered into on {{date}} between:

Employer: {{employerName}}
Employee: {{employeeName}}

1. POSITION
Job Title: {{jobTitle}}
Department: {{department}}
Start Date: {{startDate}}

2. COMPENSATION
Base Salary: {{salary}}
Payment Schedule: {{paymentSchedule}}

3. BENEFITS
{{benefits}}

4. DUTIES AND RESPONSIBILITIES
{{responsibilities}}

5. CONFIDENTIALITY
{{confidentialityClause}}

6. TERMINATION
{{terminationTerms}}

Employer Signature: _________________  Date: _______
Employee Signature: _________________  Date: _______`
  },
  'Real Estate': {
    title: 'Real Estate Purchase Agreement',
    description: 'Property purchase agreement with terms, conditions, and closing details.',
    content: `REAL ESTATE PURCHASE AGREEMENT

Date: {{date}}

Buyer: {{buyerName}}
Seller: {{sellerName}}

PROPERTY DESCRIPTION
Address: {{propertyAddress}}
Legal Description: {{legalDescription}}

PURCHASE PRICE: {{purchasePrice}}

1. DEPOSIT
Earnest Money Deposit: {{depositAmount}}

2. FINANCING
{{financingTerms}}

3. CLOSING DATE
{{closingDate}}

4. CONTINGENCIES
{{contingencies}}

5. INCLUSIONS/EXCLUSIONS
{{inclusions}}

Buyer Signature: _________________  Date: _______
Seller Signature: _________________  Date: _______`
  },
  'B2B Legal Documents': {
    title: 'B2B Service Agreement',
    description: 'Business-to-business service agreement for commercial partnerships.',
    content: `B2B SERVICE AGREEMENT

Effective Date: {{effectiveDate}}

Service Provider: {{providerName}}
Client: {{clientName}}

1. SERVICES
{{serviceDescription}}

2. TERM
Agreement Duration: {{duration}}

3. COMPENSATION
{{compensationTerms}}

4. DELIVERABLES
{{deliverables}}

5. INTELLECTUAL PROPERTY
{{ipTerms}}

6. CONFIDENTIALITY
{{confidentialityClause}}

Provider Signature: _________________  Date: _______
Client Signature: _________________  Date: _______`
  },
  'Business Document': {
    title: 'Business Partnership Agreement',
    description: 'Partnership agreement outlining roles, responsibilities, and profit sharing.',
    content: `PARTNERSHIP AGREEMENT

This Partnership Agreement is made on {{date}} between:

Partners:
1. {{partner1Name}}
2. {{partner2Name}}

1. BUSINESS PURPOSE
{{businessPurpose}}

2. CAPITAL CONTRIBUTIONS
{{capitalContributions}}

3. PROFIT AND LOSS SHARING
{{profitSharingRatio}}

4. MANAGEMENT AND DUTIES
{{managementStructure}}

5. DECISION MAKING
{{decisionMakingProcess}}

6. DISSOLUTION
{{dissolutionTerms}}

Partner 1 Signature: _________________  Date: _______
Partner 2 Signature: _________________  Date: _______`
  },
  'Last Will and Testament': {
    title: 'Last Will and Testament Template',
    description: 'Comprehensive will template for estate planning and asset distribution.',
    content: `LAST WILL AND TESTAMENT

I, {{testatorName}}, of {{address}}, being of sound mind, do hereby declare this to be my Last Will and Testament.

1. REVOCATION
I revoke all prior wills and codicils.

2. EXECUTOR
I appoint {{executorName}} as Executor of this Will.

3. BENEFICIARIES
{{beneficiaryDesignations}}

4. SPECIFIC BEQUESTS
{{specificBequests}}

5. RESIDUARY ESTATE
{{residuaryClause}}

6. GUARDIANSHIP
{{guardianshipProvisions}}

Testator Signature: _________________  Date: _______

Witness 1: _________________  Date: _______
Witness 2: _________________  Date: _______`
  },
  'Bill of Sale': {
    title: 'General Bill of Sale',
    description: 'Bill of sale for transferring ownership of personal property or vehicles.',
    content: `BILL OF SALE

Date: {{date}}

Seller: {{sellerName}}
Address: {{sellerAddress}}

Buyer: {{buyerName}}
Address: {{buyerAddress}}

ITEM DESCRIPTION
{{itemDescription}}

PURCHASE PRICE: {{purchasePrice}}

CONDITION: {{condition}}

PAYMENT METHOD: {{paymentMethod}}

The Seller hereby transfers ownership of the above-described property to the Buyer.

WARRANTIES
{{warranties}}

Seller Signature: _________________  Date: _______
Buyer Signature: _________________  Date: _______`
  },
  'Power of Attorney (POA)': {
    title: 'General Power of Attorney',
    description: 'Power of attorney document granting legal authority to act on behalf of another.',
    content: `POWER OF ATTORNEY

I, {{principalName}} (Principal), residing at {{principalAddress}}, hereby appoint {{agentName}} (Agent) as my attorney-in-fact.

1. GRANT OF AUTHORITY
The Agent is authorized to act on my behalf in the following matters:
{{authorizedActions}}

2. EFFECTIVE DATE
This Power of Attorney is effective {{effectiveDate}}

3. DURATION
{{durationTerms}}

4. LIMITATIONS
{{limitations}}

5. REVOCATION
{{revocationTerms}}

Principal Signature: _________________  Date: _______

Notary Public: _________________  Date: _______
[Notary Seal]`
  },
  'Eviction Notice': {
    title: 'Eviction Notice Template',
    description: 'Formal eviction notice for tenants with legal grounds and timeframes.',
    content: `EVICTION NOTICE

Date: {{date}}

To: {{tenantName}}
Property Address: {{propertyAddress}}

From: {{landlordName}}
Landlord Address: {{landlordAddress}}

NOTICE TO VACATE

You are hereby notified that you must vacate the premises within {{noticePeriod}} days from the date of this notice.

REASON FOR EVICTION:
{{evictionReason}}

AMOUNT OWED (if applicable):
{{amountOwed}}

You have until {{vacateDate}} to vacate the premises. Failure to comply will result in legal action.

Landlord Signature: _________________  Date: _______

Certificate of Service:
Delivered by: {{deliveryMethod}}
Date Delivered: {{deliveryDate}}`
  },
  'NDA (Non-Disclosure Agreements)': {
    title: 'Non-Disclosure Agreement (NDA)',
    description: 'Confidentiality agreement to protect sensitive business information.',
    content: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement is entered into on {{date}} between:

Disclosing Party: {{disclosingParty}}
Receiving Party: {{receivingParty}}

1. CONFIDENTIAL INFORMATION
{{confidentialInfoDefinition}}

2. OBLIGATIONS
The Receiving Party agrees to:
- Maintain confidentiality
- Not disclose to third parties
- Use only for authorized purposes

3. TERM
This agreement shall remain in effect for {{termDuration}}.

4. EXCEPTIONS
{{exceptions}}

5. RETURN OF MATERIALS
{{returnClause}}

Disclosing Party: _________________  Date: _______
Receiving Party: _________________  Date: _______`
  },
  'Lease Agreement': {
    title: 'Residential Lease Agreement',
    description: 'Comprehensive residential lease agreement for rental properties.',
    content: `RESIDENTIAL LEASE AGREEMENT

Date: {{date}}

Landlord: {{landlordName}}
Tenant: {{tenantName}}

PROPERTY ADDRESS: {{propertyAddress}}

1. LEASE TERM
Start Date: {{startDate}}
End Date: {{endDate}}

2. RENT
Monthly Rent: {{monthlyRent}}
Due Date: {{rentDueDate}}
Late Fee: {{lateFee}}

3. SECURITY DEPOSIT
Amount: {{securityDeposit}}

4. UTILITIES
{{utilitiesResponsibility}}

5. MAINTENANCE
{{maintenanceTerms}}

6. RULES AND REGULATIONS
{{propertyRules}}

7. TERMINATION
{{terminationClause}}

Landlord Signature: _________________  Date: _______
Tenant Signature: _________________  Date: _______`
  }
};

async function seedTemplates() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an admin or lawyer user to assign as creator
    let creator = await User.findOne({ role: { $in: ['admin', 'lawyer'] } });
    
    if (!creator) {
      console.log('⚠️  No admin or lawyer user found. Creating default admin...');
      creator = await User.create({
        name: 'System Admin',
        email: 'admin@juryai.com',
        password: '$2a$10$dummyHashedPassword', // This should be properly hashed
        role: 'admin',
        isVerified: true,
        isEmailVerified: true,
        isActive: true
      });
      console.log('✅ Created default admin user');
    }

    console.log(`\n📋 Creating sample templates for ${TEMPLATE_CATEGORIES.length} categories...\n`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const category of TEMPLATE_CATEGORIES) {
      // Check if template already exists for this category
      const existingTemplate = await Template.findOne({ category, isActive: true });
      
      if (existingTemplate) {
        console.log(`⏭️  Skipping "${category}" - template already exists`);
        skippedCount++;
        continue;
      }

      const sample = templateSamples[category];
      
      if (!sample) {
        console.log(`⚠️  No sample template defined for "${category}"`);
        continue;
      }

      const template = new Template({
        title: sample.title,
        description: sample.description,
        category: category,
        content: sample.content,
        fields: extractFields(sample.content),
        downloads: 0,
        createdBy: creator._id,
        isActive: true
      });

      await template.save();
      console.log(`✅ Created: ${sample.title} (${category})`);
      createdCount++;
    }

    console.log('\n📊 Seed Summary:');
    console.log(`   ✅ Created: ${createdCount} templates`);
    console.log(`   ⏭️  Skipped: ${skippedCount} templates`);
    console.log(`   📁 Total Categories: ${TEMPLATE_CATEGORIES.length}`);
    
    console.log('\n✨ Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

/**
 * Extract field names from template content ({{fieldName}} format)
 */
function extractFields(content: string): Array<{ name: string; type: string; required: boolean }> {
  const fieldRegex = /\{\{(\w+)\}\}/g;
  const matches = content.matchAll(fieldRegex);
  const fieldNames = new Set<string>();
  
  for (const match of matches) {
    fieldNames.add(match[1]);
  }
  
  return Array.from(fieldNames).map(name => ({
    name,
    type: 'text',
    required: true
  }));
}

// Run the seed script
seedTemplates();
