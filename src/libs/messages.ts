export const messages = {
  auth: {
    signup: {
      success: 'Account created successfully',
      failed: 'Email already registered',
      invalidData: 'Invalid signup data',
    },

    login: {
      success: 'Logged in successfully',
      failed: 'Invalid email or password',
      unauthorized: 'You are not authorized',
    },

    logout: {
      success: 'Logged out successfully',
      failed: 'Logout failed',
    },

    me: {
      success: 'User fetched successfully',
      notFound: 'User not found',
      unauthorized: 'Unauthorized access',
    },

    token: {
      invalid: 'Invalid or expired token',
      missing: 'Token is missing',
    },
  },

  user: {
    getAllUsers: {
      success: 'Users fetched successfully',
      failed: 'Failed to fetch users',
    },
    getUser: {
      success: 'User fetched successfully',
      notFound: 'User not found',
      failed: 'Failed to fetch user',
    },
    deleteUser: {
      success: 'User deleted successfully',
      notFound: 'User not found',
      failed: 'Failed to delete user',
    },

    updateRole: {
      success: 'User role updated successfully',
      unauthorized: 'Only administrators are allowed',
      invalidRole: 'Invalid role provided',
      notFound: 'User not found',
    },

    avatar: {
      success: 'Avatar updated successfully',
      fileRequired: 'Avatar file is required',
      notFound: 'User not found',
    },

    identity: {
      success: 'Identity submitted successfully',
      fileRequired: 'Both images are required',
      alreadyVerified: 'You are already verified',
      notFound: 'User not found',
    },

    verification: {
      invalidStatus: 'Invalid status provided',
      notFound: 'User not found',
      forbidden: 'Only administrators are allowed',
    },

    requests: {
      success: 'Verification requests fetched successfully',
      forbidden: 'Only administrators are allowed',
    },
  },

  freelancer: {
    notFound: 'Freelancer Profile not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    success: 'Freelancer profile updated successfully',
    update: {
      noData: 'No data provided for update',
      invalidSkills: '"No skills" must be the only value when selected',
    },
  },

  client: {
    insufficientBalance: 'Insufficient balance to accept this proposal',
    notFound: 'Client Profile not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    success: 'Client profile updated successfully',
    update: {
      noData: 'No data was provided for the update',
    },
  },

  freelancerProject: {
    forbidden: 'Forbidden',
    notFound: 'Freelancer project not found',
    success: 'Project completed successfully',
    imageRequired: 'At least one image is required',
    projectLimit: 'You can only create up to 5 projects',
  },

  project: {
    notFound: 'Project not found',
    forbidden: 'You are not the owner of this project',
    create: {
      success: 'Project created successfully',
      failed: 'Failed to create project',
    },
    review: {
      invalidStatus: 'Invalid project status for review',
      success: 'Project review completed successfully',
    },
    delete: {
      forbidden: 'You are not the owner of this project',
      success: 'Project deleted successfully',
    },
  },

  proposal: {
    notAccepted: 'Proposal has not been accepted',
    notFound: 'Proposal not found',
    alreadyExists: 'You have already submitted a proposal for this project',
    forbidden: 'You are not the owner of this proposal',
    updateStatus: {
      forbidden: 'Only the project owner can update the proposal status',
      invalidStatus: 'This offer has already been processed',
      success: 'Proposal status updated successfully',
    },
    create: {
      success: 'Proposal created successfully',
      failed: 'Failed to create proposal',
    },
    update: {
      alreadyPending: 'You have already submitted an update for this proposal',
      success: 'Proposal update submitted successfully',
    },
    delete: {
      forbidden: 'only the administrator can delete this proposal',
      success: 'Proposal deleted successfully',
    },
    approve: {
      forbidden: 'Only the client can approve this proposal',
      success: 'Proposal approved successfully',
    },
    accept: {
      insufficientFunds: 'Insufficient funds to accept this proposal',
    },
  },

  contract: {
    invalidStatus: 'Contract is not active',
    cancelAlreadyRequested: 'Contract cancellation has already been requested',
    completed: 'Contract completed successfully',
    alreadyCompleted: 'This contract has already been completed',
    alreadyExists: 'A contract for this proposal already exists',
    notFound: 'Contract not found',
    forbidden: 'You are not authorized to perform this action',
    create: {
      success: 'Contract created successfully',
      failed: 'Failed to create contract',
    },
    delete: {
      success: 'Contract deleted successfully',
      failed: 'Failed to delete contract',
    },
    request: {
      success: 'Contract cancellation requested successfully',
    },
    review: {
      forbidden: 'Only administrators can review cancellation requests',
      invalidRequest: 'No pending cancellation request for this contract',
      rejected: 'Contract cancellation rejected',
      success: 'Contract cancellation approved successfully',
    },
  },

  message: {
    forbidden: 'forbidden',
    notFound: 'Message not found',
    required: 'The message must contain at least one text or image.',
    send: {
      success: 'Message sent successfully',
    },
    delete: {
      success: 'Message deleted successfully',
    },
    read: {
      success: 'Messages have been successfully marked as "read".',
    },
  },
  payment: {
    invalidAmount: 'Invalid amount',
    admin: 'Admin only',
    notFound: 'Payment not found',
    create: {
      success: 'Payment created successfully',
    },
  },

  notification: {
    notFound: 'Notification not found',
    read: {
      success: 'All notifications have been successfully marked as "read".',
    },
    delete: {
      success: 'Notification deleted successfully',
    },
  },
};
