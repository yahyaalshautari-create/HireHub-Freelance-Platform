import { Test, TestingModule } from '@nestjs/testing';
import { ProposalHelper } from 'src/libs/proposal.helper';
import { ProposalStatus } from 'src/enums/proposal.enum';
import { ProjectStatus } from 'src/enums/project.enum';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockProposalRepository = {
  findAll: jest.fn(),
  update: jest.fn(),
};

const mockProjectRepository = {
  update: jest.fn(),
};

const mockFreelancerRepository = {
  update: jest.fn(),
};

const mockClientRepository = {
  update: jest.fn(),
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const buildId = (id: string) => ({ toString: () => id });

const buildProposal = (id: string, freelancerId: string, overrides = {}) => ({
  _id: buildId(id),
  projectId: 'project-id-1',
  freelancerId,
  status: ProposalStatus.PENDING,
  ...overrides,
});

const buildProject = (overrides = {}) => ({
  _id: buildId('project-id-1'),
  clientId: 'client-id-1',
  ...overrides,
});

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('ProposalHelper', () => {
  let helper: ProposalHelper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposalHelper,
        {
          provide: 'IProposalOptionRepository',
          useValue: mockProposalRepository,
        },
        { provide: 'IProjectRepository', useValue: mockProjectRepository },
        {
          provide: 'IFreelancerRepository',
          useValue: mockFreelancerRepository,
        },
        { provide: 'IClientRepository', useValue: mockClientRepository },
      ],
    }).compile();

    helper = module.get<ProposalHelper>(ProposalHelper);
    jest.clearAllMocks();
  });

  describe('acceptProposalFlow', () => {
    it('should update project to IN_PROGRESS', async () => {
      const acceptedProposal = buildProposal(
        'proposal-id-1',
        'freelancer-id-1',
      );
      const project = buildProject();

      mockProposalRepository.findAll.mockResolvedValue([acceptedProposal]);
      mockProjectRepository.update.mockResolvedValue(true);
      mockFreelancerRepository.update.mockResolvedValue(true);
      mockClientRepository.update.mockResolvedValue(true);

      await helper.acceptProposalFlow(acceptedProposal as any, project as any);

      expect(mockProjectRepository.update).toHaveBeenCalledWith(
        'project-id-1',
        {
          status: ProjectStatus.IN_PROGRESS,
        },
      );
    });

    it('should reject all other proposals when there are competitors', async () => {
      const acceptedProposal = buildProposal(
        'proposal-id-1',
        'freelancer-id-1',
      );
      const otherProposal = buildProposal('proposal-id-2', 'freelancer-id-2');
      const project = buildProject();

      mockProposalRepository.findAll.mockResolvedValue([
        acceptedProposal,
        otherProposal,
      ]);
      mockProjectRepository.update.mockResolvedValue(true);
      mockProposalRepository.update.mockResolvedValue(true);
      mockFreelancerRepository.update.mockResolvedValue(true);
      mockClientRepository.update.mockResolvedValue(true);

      await helper.acceptProposalFlow(acceptedProposal as any, project as any);

      // Should update other proposals to REJECTED
      expect(mockProposalRepository.update).toHaveBeenCalledWith(
        { status: ProposalStatus.REJECTED },
        expect.objectContaining({ _id: expect.anything() }),
      );
    });

    it('should update accepted freelancer stats (pending -1, underImplementation +1)', async () => {
      const acceptedProposal = buildProposal(
        'proposal-id-1',
        'freelancer-id-1',
      );
      const project = buildProject();

      mockProposalRepository.findAll.mockResolvedValue([acceptedProposal]);
      mockProjectRepository.update.mockResolvedValue(true);
      mockFreelancerRepository.update.mockResolvedValue(true);
      mockClientRepository.update.mockResolvedValue(true);

      await helper.acceptProposalFlow(acceptedProposal as any, project as any);

      expect(mockFreelancerRepository.update).toHaveBeenCalledWith(
        { freelancerId: 'freelancer-id-1' },
        expect.objectContaining({
          $inc: expect.objectContaining({
            pendingProposal: -1,
            underImplementationProject: 1,
          }),
        }),
      );
    });

    it('should update client pendingProposals counter', async () => {
      const acceptedProposal = buildProposal(
        'proposal-id-1',
        'freelancer-id-1',
      );
      const project = buildProject();

      mockProposalRepository.findAll.mockResolvedValue([acceptedProposal]);
      mockProjectRepository.update.mockResolvedValue(true);
      mockFreelancerRepository.update.mockResolvedValue(true);
      mockClientRepository.update.mockResolvedValue(true);

      await helper.acceptProposalFlow(acceptedProposal as any, project as any);

      expect(mockClientRepository.update).toHaveBeenCalledWith(
        { clientId: 'client-id-1' },
        { $inc: { pendingProposals: -1 } },
      );
    });

    it('should not update proposals or rejected-freelancers when no other proposals', async () => {
      const acceptedProposal = buildProposal(
        'proposal-id-1',
        'freelancer-id-1',
      );
      const project = buildProject();

      // Only the accepted proposal is returned → filtered is empty
      mockProposalRepository.findAll.mockResolvedValue([acceptedProposal]);
      mockProjectRepository.update.mockResolvedValue(true);
      mockFreelancerRepository.update.mockResolvedValue(true);
      mockClientRepository.update.mockResolvedValue(true);

      await helper.acceptProposalFlow(acceptedProposal as any, project as any);

      // proposalRepository.update should NOT be called for rejection (no other proposals)
      expect(mockProposalRepository.update).not.toHaveBeenCalledWith(
        { status: ProposalStatus.REJECTED },
        expect.anything(),
      );
    });
  });
});
