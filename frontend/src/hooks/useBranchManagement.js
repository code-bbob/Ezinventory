import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAxios from '@/utils/useAxios';
import { 
  saveSelectedBranch, 
  getSelectedBranch, 
  clearSelectedBranch, 
  hasBranchSelected,
  getSelectedBranchId 
} from '@/utils/branchUtils';

/**
 * Custom hook for managing branch selection
 */
export const useBranchManagement = () => {
  const api = useAxios();
  const navigate = useNavigate();
  const [currentBranch, setCurrentBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load current branch from localStorage on mount
  useEffect(() => {
    const savedBranch = getSelectedBranch();
    if (savedBranch) {
      setCurrentBranch(savedBranch);
    }
    setLoading(false);
  }, []);

  // Fetch all available branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get('enterprise/branch/');
      setBranches(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to load branches');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Select a branch and save it
  const selectBranch = (branch) => {
    try {
      saveSelectedBranch(branch);
      setCurrentBranch(branch);
      return true;
    } catch (error) {
      console.error('Error selecting branch:', error);
      setError('Failed to select branch');
      return false;
    }
  };

  // Clear selected branch
  const clearBranch = () => {
    clearSelectedBranch();
    setCurrentBranch(null);
  };

  // Navigate to a page with the current branch
  const navigateWithBranch = (path, isMobile = false) => {
    const branchId = getSelectedBranchId();
    if (!branchId) {
      console.error('No branch selected');
      navigate('/select-branch');
      return;
    }
    
    const fullPath = isMobile 
      ? `/mobile/${path}/branch/${branchId}`
      : `/${path}/branch/${branchId}`;
    
    navigate(fullPath);
  };

  // Check if user needs to select a branch
  const requiresBranchSelection = () => {
    return !hasBranchSelected();
  };

  return {
    currentBranch,
    branches,
    loading,
    error,
    fetchBranches,
    selectBranch,
    clearBranch,
    navigateWithBranch,
    requiresBranchSelection,
    branchId: getSelectedBranchId(),
    hasBranch: hasBranchSelected()
  };
};
