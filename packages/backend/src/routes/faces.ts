import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../index';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

// Get face groups (people)
router.get('/groups', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const faceGroups = await prisma.faceGroup.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        faces: {
          include: {
            photo: {
              select: {
                id: true,
                thumbnailUrl: true,
                dateTaken: true
              }
            }
          },
          take: 5 // Preview faces
        },
        _count: {
          select: {
            faces: true
          }
        }
      },
      orderBy: {
        confidence: 'desc'
      }
    });

    res.json({
      success: true,
      data: faceGroups
    });
  } catch (error) {
    next(error);
  }
});

// Update face group name
router.patch('/groups/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { name } = req.body;

    const faceGroup = await prisma.faceGroup.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!faceGroup) {
      return res.status(404).json({
        success: false,
        error: 'Face group not found'
      });
    }

    const updatedGroup = await prisma.faceGroup.update({
      where: { id: req.params.id },
      data: { name }
    });

    res.json({
      success: true,
      data: updatedGroup,
      message: 'Face group updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;