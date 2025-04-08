/**
 * Utility functions for CMS authentication and authorization
 */

/**
 * Verify if a user has access to the specified repository
 * This checks multiple access methods: direct collaborator, organization member, team member
 * 
 * @param {string} accessToken - GitHub OAuth access token
 * @param {string} username - GitHub username
 * @param {string} repoOwner - Repository owner (user or organization)
 * @param {string} repoName - Repository name
 * @returns {Promise<boolean>} - Whether the user has access
 */
export async function verifyRepositoryAccess(accessToken, username, repoOwner, repoName) {
  try {
    // Check if user is a direct collaborator
    const collaboratorResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${username}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    // Status 204 means the user is a collaborator
    if (collaboratorResponse.status === 204) {
      return true;
    }
    
    // If repo owner is the same as username, they have access
    if (repoOwner.toLowerCase() === username.toLowerCase()) {
      return true;
    }
    
    // Check if repo is in an organization and user is a member
    const orgMemberResponse = await fetch(`https://api.github.com/orgs/${repoOwner}/members/${username}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    // Status 204 means the user is an organization member
    if (orgMemberResponse.status === 204) {
      // Check repository permissions for this user
      const repoPermissionResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      if (repoPermissionResponse.ok) {
        const repoData = await repoPermissionResponse.json();
        // Check if user has at least push access
        if (repoData.permissions && (repoData.permissions.push || repoData.permissions.admin)) {
          return true;
        }
      }
    }
    
    // User doesn't have access
    return false;
  } catch (error) {
    console.error('Error verifying repository access:', error);
    return false;
  }
}

/**
 * Get user information from GitHub API
 * 
 * @param {string} accessToken - GitHub OAuth access token
 * @returns {Promise<Object>} - User data or null if error
 */
export async function getGitHubUser(accessToken) {
  try {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    return await userResponse.json();
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    return null;
  }
}