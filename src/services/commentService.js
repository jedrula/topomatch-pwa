import { db } from './firebase';
import { getCurrentUser } from './authService';
import { formatTimeAgo } from '@/utils/dateUtils';

export const commentService = {
  /**
   * Add a comment to a video (ascent)
   * @param {string} ascentId - The ascent/video ID
   * @param {string} text - The comment text
   * @returns {Promise<Object>} The created comment
   */
  async addComment(ascentId, text) {
    try {
      const { collection, doc, setDoc, serverTimestamp, increment, updateDoc } = await import('firebase/firestore');
      const user = getCurrentUser();
      
      if (!user) {
        throw new Error('Must be logged in to comment');
      }

      if (!text || !text.trim()) {
        throw new Error('Comment text cannot be empty');
      }

      // Generate comment ID
      const commentId = crypto.randomUUID();
      
      // Create comment document
      const commentRef = doc(db, 'comments', commentId);
      const commentData = {
        id: commentId,
        ascentId,
        userId: user.uid,
        userName: user.displayName || user.email || 'Anonymous',
        text: text.trim(),
        createdAt: serverTimestamp()
      };
      
      await setDoc(commentRef, commentData);
      
      // Increment comment count on ascent
      const ascentRef = doc(db, 'ascents', ascentId);
      await updateDoc(ascentRef, {
        commentCount: increment(1)
      });
      
      return {
        ...commentData,
        createdAt: new Date() // Return local date for immediate UI update
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  /**
   * Get comments for a video (ascent)
   * @param {string} ascentId - The ascent/video ID
   * @returns {Promise<Array>} Array of comments
   */
  async getComments(ascentId) {
    try {
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('ascentId', '==', ascentId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const comments = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });
      
      return comments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  /**
   * Delete a comment (only by comment author or admin)
   * @param {string} commentId - The comment ID
   * @param {string} ascentId - The ascent ID (for updating count)
   * @returns {Promise<void>}
   */
  async deleteComment(commentId, ascentId) {
    try {
      const { doc, deleteDoc, increment, updateDoc } = await import('firebase/firestore');
      const user = getCurrentUser();
      
      if (!user) {
        throw new Error('Must be logged in to delete comment');
      }
      
      // Delete comment document
      const commentRef = doc(db, 'comments', commentId);
      await deleteDoc(commentRef);
      
      // Decrement comment count on ascent
      const ascentRef = doc(db, 'ascents', ascentId);
      await updateDoc(ascentRef, {
        commentCount: increment(-1)
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
};

export { formatTimeAgo };
export default commentService;
