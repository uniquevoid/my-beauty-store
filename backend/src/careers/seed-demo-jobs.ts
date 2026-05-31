import type { SupabaseClient } from '@supabase/supabase-js';

export type WorkplaceType = 'remote' | 'hybrid' | 'in_office';

export type DemoJobSeed = {
  slug: string;
  title: string;
  department: string;
  location: string;
  workplace_type: WorkplaceType;
  employment_type: string;
  area_of_interest: string;
  description: string;
};

export const DEMO_JOBS: DemoJobSeed[] = [
  {
    slug: 'senior-software-engineer',
    title: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'Madrid, Spain',
    workplace_type: 'hybrid',
    employment_type: 'Full-time',
    area_of_interest: 'Development',
    description: `Build and scale products across our tech and gaming platforms. You will work with a cross-functional team on reliable, user-facing systems that serve millions of players and partners worldwide.

## Key job responsibilities
- Design, build, and maintain backend services and APIs with a focus on reliability and performance
- Collaborate with product, design, and QA to deliver features from concept through production
- Review code, mentor engineers, and raise engineering standards across the team
- Improve observability, deployment pipelines, and operational practices
- Participate in on-call rotation and incident response for critical systems

## Basic Qualifications
- 5+ years of professional software development experience
- Strong proficiency in at least one backend language (TypeScript, Go, or similar)
- Experience building and operating distributed systems in production
- Solid understanding of databases, caching, and API design

## Preferred Qualifications
- Experience with gaming, real-time, or high-traffic consumer platforms
- Familiarity with cloud infrastructure (AWS, GCP, or Azure)
- Track record of mentoring and technical leadership`,
  },
  {
    slug: 'qa-engineer',
    title: 'QA Engineer',
    department: 'Engineering',
    location: 'Remote · EU',
    workplace_type: 'remote',
    employment_type: 'Full-time',
    area_of_interest: 'Quality Assurance',
    description: `Design and execute test plans for web and mobile products. Partner with engineering to ship reliable releases through automation and exploratory testing across our platform portfolio.

## Key job responsibilities
- Create and maintain test plans, test cases, and regression suites for web and mobile products
- Perform exploratory testing to uncover edge cases before release
- Build and extend automated test coverage for critical user flows
- Partner with developers to reproduce, triage, and verify fixes
- Report on quality metrics and release readiness to stakeholders

## Basic Qualifications
- 3+ years of experience in software quality assurance
- Strong understanding of web application testing methodologies
- Experience writing clear bug reports and test documentation
- Familiarity with at least one test automation framework

## Preferred Qualifications
- Experience testing API-driven applications and mobile clients
- Knowledge of CI/CD integration for automated tests
- Background in gaming or consumer-facing products`,
  },
  {
    slug: 'solutions-consultant',
    title: 'Solutions Consultant',
    department: 'Professional Services',
    location: 'Barcelona, Spain',
    workplace_type: 'hybrid',
    employment_type: 'Full-time',
    area_of_interest: 'Consulting',
    description: `Advise enterprise clients on platform adoption and integration. Translate business requirements into technical recommendations and implementation plans that drive measurable outcomes.

## Key job responsibilities
- Lead discovery workshops to understand client goals, workflows, and integration needs
- Design solution architectures and implementation roadmaps tailored to each account
- Deliver product demonstrations and proof-of-concept engagements
- Coordinate with sales, engineering, and customer success during pre- and post-sale phases
- Document best practices and contribute to reusable solution playbooks

## Basic Qualifications
- 4+ years in solutions consulting, pre-sales engineering, or technical account management
- Strong presentation and stakeholder communication skills
- Ability to map business requirements to technical solutions
- Willingness to travel to client sites across Europe as needed

## Preferred Qualifications
- Experience with enterprise SaaS or platform integrations
- Background in API design, data migration, or identity management
- Fluency in English and Spanish`,
  },
  {
    slug: 'account-manager-enterprise',
    title: 'Enterprise Account Manager',
    department: 'Sales',
    location: 'Madrid, Spain',
    workplace_type: 'hybrid',
    employment_type: 'Full-time',
    area_of_interest: 'Account Management',
    description: `Own relationships with key enterprise accounts. Drive retention, expansion, and long-term partnership success across the customer lifecycle for our largest clients.

## Key job responsibilities
- Manage a portfolio of enterprise accounts with responsibility for retention and growth targets
- Develop account plans aligned to customer business objectives and renewal timelines
- Identify upsell and cross-sell opportunities in partnership with solutions and product teams
- Lead QBRs and executive business reviews with customer stakeholders
- Coordinate internal resources to resolve escalations and deliver on commitments

## Basic Qualifications
- 5+ years of enterprise account management or strategic sales experience
- Proven track record of meeting or exceeding renewal and expansion quotas
- Strong negotiation and relationship-building skills
- Experience selling B2B technology or SaaS solutions

## Preferred Qualifications
- Experience in gaming, media, or platform businesses
- Familiarity with CRM tools and sales forecasting processes
- Multilingual communication skills`,
  },
  {
    slug: 'devops-engineer',
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote',
    workplace_type: 'remote',
    employment_type: 'Full-time',
    area_of_interest: 'Development',
    description: `Improve CI/CD, observability, and cloud infrastructure. Help teams ship safely with automation and strong operational practices that keep our platform available and performant.

## Key job responsibilities
- Own CI/CD pipelines, deployment automation, and release tooling
- Build and maintain monitoring, alerting, and incident response workflows
- Partner with engineering teams on infrastructure design and cost optimization
- Automate operational tasks and improve developer self-service capabilities
- Participate in on-call rotation and lead post-incident reviews

## Basic Qualifications
- 3+ years in DevOps, platform engineering, or SRE roles
- Hands-on experience with cloud infrastructure (AWS, GCP, or Azure)
- Proficiency with infrastructure-as-code tools (Terraform, Pulumi, or CloudFormation)
- Experience with container orchestration (Kubernetes or similar)

## Preferred Qualifications
- Experience with observability stacks (Datadog, Prometheus, Grafana, or similar)
- Background supporting high-traffic or gaming workloads
- Scripting skills in Python, Bash, or TypeScript`,
  },
  {
    slug: 'automation-qa-lead',
    title: 'Automation QA Lead',
    department: 'Engineering',
    location: 'Remote',
    workplace_type: 'remote',
    employment_type: 'Full-time',
    area_of_interest: 'Quality Assurance',
    description: `Lead test automation strategy across product teams. Build frameworks, mentor QA engineers, and raise quality standards at scale for our web and platform products.

## Key job responsibilities
- Define and drive the test automation strategy across multiple product squads
- Design reusable automation frameworks and coding standards for QA engineers
- Mentor team members on automation best practices and code quality
- Partner with engineering leadership on quality gates in CI/CD pipelines
- Report on automation coverage, flakiness, and release quality metrics

## Basic Qualifications
- 5+ years in QA with at least 3 years focused on test automation
- Strong programming skills in TypeScript, JavaScript, or Python
- Experience leading or mentoring QA engineers
- Deep knowledge of API, UI, and integration testing approaches

## Preferred Qualifications
- Experience with Playwright, Cypress, or Selenium at scale
- Background in gaming or consumer platform testing
- Familiarity with performance and load testing tools`,
  },
  {
    slug: 'implementation-consultant',
    title: 'Implementation Consultant',
    department: 'Professional Services',
    location: 'Europe',
    workplace_type: 'in_office',
    employment_type: 'Full-time',
    area_of_interest: 'Consulting',
    description: `Guide customers through onboarding and rollout. Configure integrations, train stakeholders, and ensure successful go-live outcomes for enterprise deployments.

## Key job responsibilities
- Lead end-to-end implementation projects from kickoff through go-live
- Configure platform settings, integrations, and data migrations per project scope
- Deliver training sessions for customer administrators and end users
- Manage project timelines, risks, and status reporting for assigned accounts
- Hand off successfully launched customers to the customer success team

## Basic Qualifications
- 3+ years in implementation consulting, technical project management, or similar
- Experience managing multiple customer projects simultaneously
- Strong client communication and documentation skills
- Ability to troubleshoot integration and configuration issues

## Preferred Qualifications
- PMP or Agile certification
- Experience with REST APIs, SSO, or HRIS integrations
- Fluency in English plus one additional European language`,
  },
  {
    slug: 'frontend-developer',
    title: 'Frontend Developer',
    department: 'Engineering',
    location: 'Madrid, Spain',
    workplace_type: 'hybrid',
    employment_type: 'Full-time',
    area_of_interest: 'Development',
    description: `Craft responsive, accessible interfaces for our careers and platform products. Collaborate with design and backend teams on polished user experiences that convert visitors into applicants and power day-to-day platform workflows.

## Key job responsibilities
- Build and maintain React-based web applications with attention to performance and accessibility
- Translate design specs into responsive, pixel-accurate UI components
- Integrate with REST APIs and manage client-side state effectively
- Write unit and integration tests for critical UI flows
- Participate in code reviews and contribute to frontend architecture decisions

## Basic Qualifications
- 3+ years of professional frontend development experience
- Strong proficiency in React, TypeScript, and modern CSS
- Experience with responsive design and cross-browser compatibility
- Understanding of web accessibility standards (WCAG)

## Preferred Qualifications
- Experience with Tailwind CSS or similar utility-first frameworks
- Familiarity with SEO, analytics, or A/B testing for marketing sites
- Background building design systems or component libraries`,
  },
  {
    slug: 'client-success-manager',
    title: 'Client Success Manager',
    department: 'Customer Success',
    location: 'Remote · EU',
    workplace_type: 'remote',
    employment_type: 'Full-time',
    area_of_interest: 'Account Management',
    description: `Ensure customers achieve their goals with our platform. Proactively identify risks, coordinate internal teams, and champion customer outcomes throughout the post-sale lifecycle.

## Key job responsibilities
- Own customer health, adoption, and satisfaction for an assigned book of business
- Conduct regular check-ins, business reviews, and success planning sessions
- Identify churn risks early and develop mitigation plans with account teams
- Advocate for customer needs with product and engineering teams
- Track and report on retention, expansion, and NPS metrics

## Basic Qualifications
- 3+ years in customer success, account management, or client services
- Strong relationship management and problem-solving skills
- Experience with CRM and customer success platforms
- Ability to manage multiple accounts with competing priorities

## Preferred Qualifications
- Experience in B2B SaaS or technology platforms
- Background in gaming, esports, or community-driven products
- Data-driven approach to measuring customer outcomes`,
  },
  {
    slug: 'product-manager-gaming',
    title: 'Product Manager — Gaming Platform',
    department: 'Product',
    location: 'Barcelona, Spain',
    workplace_type: 'hybrid',
    employment_type: 'Full-time',
    area_of_interest: 'Development',
    description: `Define roadmap and priorities for features used by players, organizers, and partners. Translate user needs into clear specs for engineering and design on our gaming platform products.

## Key job responsibilities
- Own product roadmap, prioritization, and delivery for assigned platform areas
- Gather insights from users, partners, and internal stakeholders to inform decisions
- Write clear product requirements, user stories, and acceptance criteria
- Partner with engineering, design, and QA through discovery, build, and launch
- Define and track success metrics for shipped features

## Basic Qualifications
- 4+ years of product management experience in software or technology
- Strong analytical and prioritization skills with a user-centric mindset
- Excellent written and verbal communication across technical and non-technical audiences
- Experience working with agile development teams

## Preferred Qualifications
- Background in gaming, esports, or community platforms
- Experience with B2B and B2C product surfaces
- Familiarity with data analytics tools and A/B testing`,
  },
];

export async function seedDemoJobsForTenant(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<number> {
  let count = 0;

  for (const job of DEMO_JOBS) {
    const row = {
      tenant_id: tenantId,
      slug: job.slug,
      external_id: job.slug,
      title: job.title,
      department: job.department,
      location: job.location,
      workplace_type: job.workplace_type,
      employment_type: job.employment_type,
      area_of_interest: job.area_of_interest,
      description: job.description,
      status: 'published' as const,
      custom_fields: {},
    };

    const { data: existing } = await supabase
      .from('jobs')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', job.slug)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from('jobs').update(row).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('jobs').insert(row);
      if (error) throw error;
    }
    count++;
  }

  return count;
}
