import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * Configuration validation tests for production deployment workflow
 * 
 * These tests validate that the GitHub Actions workflow for production
 * is correctly configured according to the design specifications.
 */

interface WorkflowStep {
  name: string;
  uses?: string;
  run?: string;
  if?: string;
  with?: Record<string, unknown>;
}

interface WorkflowJob {
  'runs-on': string;
  environment?: string;
  env?: Record<string, string>;
  steps: WorkflowStep[];
}

interface Workflow {
  name: string;
  on: {
    push?: {
      branches: string[];
    };
    pull_request?: {
      branches: string[];
    };
  };
  jobs: {
    [key: string]: WorkflowJob;
  };
}

describe('Production Deployment Workflow Configuration', () => {
  let workflow: Workflow;

  // Load and parse the workflow file before running tests
  const workflowPath = path.join(process.cwd(), '.github/workflows/deploy-production.yml');
  const workflowContent = fs.readFileSync(workflowPath, 'utf8');
  workflow = yaml.load(workflowContent) as Workflow;

  /**
   * Example 2: Production workflow triggers on main branch
   * Validates: Requirements 3.5
   */
  it('should trigger on push to main branch', () => {
    expect(workflow.on.push).toBeDefined();
    expect(workflow.on.push?.branches).toContain('main');
  });

  /**
   * Example 4: Production workflow uses correct Supabase project
   * Validates: Requirements 4.2
   */
  it('should use production Supabase project ID', () => {
    const deployJob = workflow.jobs.deploy;
    expect(deployJob).toBeDefined();
    expect(deployJob.env).toBeDefined();
    expect(deployJob.env?.SUPABASE_PROJECT_ID).toBe('fkjbvwbnbxslornufhlp');
  });

  /**
   * Example 9: Production workflow deploys to Vercel production
   * Validates: Requirements 7.2
   */
  it('should deploy to Vercel production environment', () => {
    const deployJob = workflow.jobs.deploy;
    const vercelStep = deployJob.steps.find(step => 
      step.name?.includes('Vercel Production') || 
      (step.run?.includes('vercel') && step.run?.includes('prod'))
    );
    
    expect(vercelStep).toBeDefined();
    expect(vercelStep?.run).toBeDefined();
    expect(vercelStep?.run).toContain('--prod');
  });

  /**
   * Additional validation: Secrets configuration
   * Validates: Requirements 9.1, 9.2
   */
  describe('should reference required secrets', () => {
    it('should reference SUPABASE_ACCESS_TOKEN_PROD secret', () => {
      const deployJob = workflow.jobs.deploy;
      const accessToken = deployJob.env?.SUPABASE_ACCESS_TOKEN;
      expect(accessToken).toBeDefined();
      expect(accessToken).toContain('secrets.SUPABASE_ACCESS_TOKEN_PROD');
    });

    it('should reference VERCEL_TOKEN secret', () => {
      const deployJob = workflow.jobs.deploy;
      const vercelToken = deployJob.env?.VERCEL_TOKEN;
      expect(vercelToken).toBeDefined();
      expect(vercelToken).toContain('secrets.VERCEL_TOKEN');
    });

    it('should reference VERCEL_ORG_ID secret', () => {
      const deployJob = workflow.jobs.deploy;
      const vercelOrgId = deployJob.env?.VERCEL_ORG_ID;
      expect(vercelOrgId).toBeDefined();
      expect(vercelOrgId).toContain('secrets.VERCEL_ORG_ID');
    });

    it('should reference VERCEL_PROJECT_ID secret', () => {
      const deployJob = workflow.jobs.deploy;
      const vercelProjectId = deployJob.env?.VERCEL_PROJECT_ID;
      expect(vercelProjectId).toBeDefined();
      expect(vercelProjectId).toContain('secrets.VERCEL_PROJECT_ID');
    });
  });

  /**
   * Additional validation: Workflow structure
   */
  describe('workflow structure validation', () => {
    it('should have correct workflow name', () => {
      expect(workflow.name).toBe('Deploy to Production');
    });

    it('should run on ubuntu-latest', () => {
      const deployJob = workflow.jobs.deploy;
      expect(deployJob['runs-on']).toBe('ubuntu-latest');
    });

    it('should have production environment configured', () => {
      const deployJob = workflow.jobs.deploy;
      expect(deployJob.environment).toBe('production');
    });

    it('should checkout code as first step', () => {
      const deployJob = workflow.jobs.deploy;
      const firstStep = deployJob.steps[0];
      expect(firstStep.uses).toContain('actions/checkout');
    });

    it('should setup Supabase CLI', () => {
      const deployJob = workflow.jobs.deploy;
      const supabaseStep = deployJob.steps.find(step => 
        step.uses?.includes('supabase/setup-cli')
      );
      expect(supabaseStep).toBeDefined();
    });

    it('should install Vercel CLI', () => {
      const deployJob = workflow.jobs.deploy;
      const vercelInstallStep = deployJob.steps.find(step => 
        step.run?.includes('npm install -g vercel')
      );
      expect(vercelInstallStep).toBeDefined();
    });
  });

  /**
   * Additional validation: Step ordering and dependencies
   */
  describe('step ordering and dependencies', () => {
    it('should run migrations before edge functions deployment', () => {
      const deployJob = workflow.jobs.deploy;
      const migrationIndex = deployJob.steps.findIndex(step => 
        step.name?.includes('migration') || step.run?.includes('db push')
      );
      const functionsIndex = deployJob.steps.findIndex(step => 
        step.name?.includes('Edge Functions') || step.run?.includes('functions deploy')
      );
      
      expect(migrationIndex).toBeGreaterThan(-1);
      expect(functionsIndex).toBeGreaterThan(-1);
      expect(migrationIndex).toBeLessThan(functionsIndex);
    });

    it('should run edge functions deployment before Vercel deployment', () => {
      const deployJob = workflow.jobs.deploy;
      const functionsIndex = deployJob.steps.findIndex(step => 
        step.name?.includes('Edge Functions') || step.run?.includes('functions deploy')
      );
      const vercelIndex = deployJob.steps.findIndex(step => 
        step.name?.includes('Vercel') && step.run?.includes('vercel deploy')
      );
      
      expect(functionsIndex).toBeGreaterThan(-1);
      expect(vercelIndex).toBeGreaterThan(-1);
      expect(functionsIndex).toBeLessThan(vercelIndex);
    });

    it('should have success conditions on deployment steps', () => {
      const deployJob = workflow.jobs.deploy;
      const functionsStep = deployJob.steps.find(step => 
        step.name?.includes('Edge Functions')
      );
      const vercelStep = deployJob.steps.find(step => 
        step.name?.includes('Vercel Production')
      );
      
      expect(functionsStep?.if).toBe('success()');
      expect(vercelStep?.if).toBe('success()');
    });
  });

  /**
   * Additional validation: Migration step configuration
   */
  describe('migration step configuration', () => {
    it('should run migration step before Vercel deployment', () => {
      const deployJob = workflow.jobs.deploy;
      const migrationIndex = deployJob.steps.findIndex(step => 
        step.name?.includes('migration') || step.run?.includes('db push')
      );
      const vercelIndex = deployJob.steps.findIndex(step => 
        step.name?.includes('Vercel') && step.run?.includes('vercel deploy')
      );
      
      expect(migrationIndex).toBeGreaterThan(-1);
      expect(vercelIndex).toBeGreaterThan(-1);
      expect(migrationIndex).toBeLessThan(vercelIndex);
    });

    it('should prevent Vercel deployment if migrations fail', () => {
      const deployJob = workflow.jobs.deploy;
      const vercelStep = deployJob.steps.find(step => 
        step.name?.includes('Vercel Production')
      );
      
      expect(vercelStep).toBeDefined();
      expect(vercelStep?.if).toBe('success()');
    });

    it('should prevent edge functions deployment if migrations fail', () => {
      const deployJob = workflow.jobs.deploy;
      const functionsStep = deployJob.steps.find(step => 
        step.name?.includes('Edge Functions')
      );
      
      expect(functionsStep).toBeDefined();
      expect(functionsStep?.if).toBe('success()');
    });

    it('should execute supabase db push command', () => {
      const deployJob = workflow.jobs.deploy;
      const migrationStep = deployJob.steps.find(step => 
        step.name?.includes('migration')
      );
      
      expect(migrationStep).toBeDefined();
      expect(migrationStep?.run).toBeDefined();
      expect(migrationStep?.run).toContain('supabase db push');
    });

    it('should link to correct Supabase project before migrations', () => {
      const deployJob = workflow.jobs.deploy;
      const migrationStep = deployJob.steps.find(step => 
        step.name?.includes('migration')
      );
      
      expect(migrationStep).toBeDefined();
      expect(migrationStep?.run).toBeDefined();
      expect(migrationStep?.run).toContain('supabase link');
      expect(migrationStep?.run).toContain('$SUPABASE_PROJECT_ID');
    });

    it('should include logging for debugging', () => {
      const deployJob = workflow.jobs.deploy;
      const migrationStep = deployJob.steps.find(step => 
        step.name?.includes('migration')
      );
      
      expect(migrationStep).toBeDefined();
      expect(migrationStep?.run).toBeDefined();
      // Check for echo statements that provide logging
      expect(migrationStep?.run).toMatch(/echo/);
    });
  });

  /**
   * Additional validation: Edge Functions deployment step
   */
  describe('edge functions deployment step configuration', () => {
    it('should prevent Vercel deployment if edge functions deployment fails', () => {
      const deployJob = workflow.jobs.deploy;
      const functionsIndex = deployJob.steps.findIndex(step => 
        step.name?.includes('Edge Functions')
      );
      const vercelIndex = deployJob.steps.findIndex(step => 
        step.name?.includes('Vercel Production')
      );
      
      // Verify functions step exists and runs before Vercel
      expect(functionsIndex).toBeGreaterThan(-1);
      expect(vercelIndex).toBeGreaterThan(-1);
      expect(functionsIndex).toBeLessThan(vercelIndex);
      
      // Verify Vercel step has success condition to prevent execution if functions fail
      const vercelStep = deployJob.steps[vercelIndex];
      expect(vercelStep.if).toBe('success()');
    });

    it('should execute supabase functions deploy command', () => {
      const deployJob = workflow.jobs.deploy;
      const functionsStep = deployJob.steps.find(step => 
        step.name?.includes('Edge Functions')
      );
      
      expect(functionsStep).toBeDefined();
      expect(functionsStep?.run).toBeDefined();
      expect(functionsStep?.run).toContain('supabase functions deploy');
    });

    it('should deploy functions to correct Supabase project', () => {
      const deployJob = workflow.jobs.deploy;
      const functionsStep = deployJob.steps.find(step => 
        step.name?.includes('Edge Functions')
      );
      
      expect(functionsStep).toBeDefined();
      expect(functionsStep?.run).toBeDefined();
      expect(functionsStep?.run).toContain('--project-ref $SUPABASE_PROJECT_ID');
    });

    it('should only run after successful migrations', () => {
      const deployJob = workflow.jobs.deploy;
      const functionsStep = deployJob.steps.find(step => 
        step.name?.includes('Edge Functions')
      );
      
      expect(functionsStep).toBeDefined();
      expect(functionsStep?.if).toBe('success()');
    });
  });
});
