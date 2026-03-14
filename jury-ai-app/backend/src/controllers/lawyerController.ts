import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../types/interfaces';

const parseCsv = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const mapLawyerPublic = (lawyer: any) => ({
  id: lawyer._id,
  name: lawyer.name,
  email: lawyer.email,
  phone: lawyer.profile?.phone || '',
  bio: lawyer.profile?.bio || '',
  specialization: lawyer.specialization || [],
  experience: lawyer.experience || 0,
  barNumber: lawyer.barNumber || '',
  city: lawyer.city || '',
  consultationFee: lawyer.consultationFee || 0,
  languages: lawyer.languages || [],
  verificationStatus: lawyer.lawyerVerificationStatus || (lawyer.isEmailVerified ? 'verified' : 'pending'),
  verified: (lawyer.lawyerVerificationStatus || (lawyer.isEmailVerified ? 'verified' : 'pending')) === 'verified',
  availability: 'Contact for availability'
});

export const getPublicLawyers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = Math.min(parseInt((req.query.limit as string) || '12', 10), 50);
    const search = (req.query.search as string) || '';
    const specialization = (req.query.specialization as string) || '';
    const verifiedOnly = (req.query.verifiedOnly as string) === 'true';

    const skip = (page - 1) * limit;

    const query: any = { role: 'lawyer', isActive: true };

    if (verifiedOnly) {
      query.lawyerVerificationStatus = 'verified';
    }

    if (specialization) {
      query.specialization = { $in: [specialization] };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { specialization: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }

    const [lawyers, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ lawyerVerificationStatus: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    const allSpecializations = await User.distinct('specialization', { role: 'lawyer' });

    res.json({
      lawyers: lawyers.map(mapLawyerPublic),
      filters: {
        specializations: allSpecializations.filter(Boolean)
      },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: skip + lawyers.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get public lawyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lawyer network'
    });
  }
};

export const getFeaturedLawyers = async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '6', 10), 12);

    const lawyers = await User.find({
      role: 'lawyer',
      isActive: true,
      lawyerVerificationStatus: 'verified'
    })
      .select('-password')
      .sort({ experience: -1, createdAt: -1 })
      .limit(limit);

    res.json({
      lawyers: lawyers.map(mapLawyerPublic)
    });
  } catch (error) {
    console.error('Get featured lawyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured lawyers'
    });
  }
};

export const applyAsLawyer = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const {
      specialization,
      experience,
      barNumber,
      city,
      consultationFee,
      languages,
      phone,
      bio
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const specializationList = Array.isArray(specialization)
      ? specialization.map((item: string) => item.trim()).filter(Boolean)
      : parseCsv(specialization);

    const languageList = Array.isArray(languages)
      ? languages.map((item: string) => item.trim()).filter(Boolean)
      : parseCsv(languages);

    if (!barNumber || specializationList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bar number and at least one specialization are required'
      });
    }

    user.role = 'lawyer';
    user.specialization = specializationList;
    user.experience = Math.max(0, Number(experience) || 0);
    user.barNumber = barNumber;
    user.city = city || '';
    user.consultationFee = Math.max(0, Number(consultationFee) || 0);
    user.languages = languageList;
    user.lawyerVerificationStatus = 'pending';
    user.isEmailVerified = false;

    if (!user.profile) user.profile = {};
    if (phone !== undefined) user.profile.phone = phone;
    if (bio !== undefined) user.profile.bio = bio;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Lawyer application submitted. Awaiting admin verification.',
      application: {
        status: user.lawyerVerificationStatus,
        specialization: user.specialization,
        barNumber: user.barNumber,
        submittedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Apply as lawyer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit lawyer application'
    });
  }
};

export const getMyLawyerProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'lawyer') {
      return res.status(403).json({
        success: false,
        message: 'You are not registered as a lawyer'
      });
    }

    res.json({
      success: true,
      lawyer: mapLawyerPublic(user),
      verificationNotes: user.verificationNotes || ''
    });
  } catch (error) {
    console.error('Get my lawyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lawyer profile'
    });
  }
};
