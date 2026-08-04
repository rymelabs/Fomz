import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Default pre-built templates
export const BUILT_IN_TEMPLATES = [
  {
    id: 'contact-form',
    name: 'Contact Form',
    description: 'Collect contact information from visitors',
    category: 'business',
    icon: 'phone',
    form: {
      title: 'Contact Us',
      description: 'We\'d love to hear from you. Please fill out the form below.',
      questions: [
        {
          id: 'q1',
          type: 'short-text',
          title: 'Full Name',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'q2',
          type: 'email',
          title: 'Email Address',
          required: true,
          placeholder: 'your@email.com'
        },
        {
          id: 'q3',
          type: 'phone',
          title: 'Phone Number',
          required: false,
          placeholder: 'Enter your phone number'
        },
        {
          id: 'q4',
          type: 'dropdown',
          title: 'How did you hear about us?',
          required: false,
          options: ['Search Engine', 'Social Media', 'Friend/Referral', 'Advertisement', 'Other']
        },
        {
          id: 'q5',
          type: 'long-text',
          title: 'Message',
          required: true,
          placeholder: 'Tell us how we can help you...',
          validation: { minLength: 10 }
        }
      ],
      settings: {
        showProgressBar: true,
        randomizeQuestions: false
      },
      theme: 'minimal',
      style: {
        fontFamily: 'sans',
        fontSize: 'md',
        borderRadius: 'lg'
      }
    }
  },
  {
    id: 'feedback-survey',
    name: 'Feedback Survey',
    description: 'Gather feedback about your product or service',
    category: 'feedback',
    icon: 'star',
    form: {
      title: 'Feedback Survey',
      description: 'Your feedback helps us improve. Please take a moment to share your thoughts.',
      questions: [
        {
          id: 'q1',
          type: 'rating',
          title: 'Overall, how satisfied are you with our service?',
          required: true,
          maxRating: 5
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          title: 'How often do you use our product?',
          required: true,
          options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'First time']
        },
        {
          id: 'q3',
          type: 'slider',
          title: 'How likely are you to recommend us to a friend?',
          required: true,
          validation: { min: 0, max: 10, step: 1 }
        },
        {
          id: 'q4',
          type: 'checkbox',
          title: 'What features do you like most? (Select all that apply)',
          required: false,
          options: ['Ease of use', 'Customer support', 'Pricing', 'Feature set', 'Reliability', 'Speed']
        },
        {
          id: 'q5',
          type: 'long-text',
          title: 'What could we improve?',
          required: false,
          placeholder: 'Share your suggestions...'
        }
      ],
      settings: {
        showProgressBar: true
      },
      theme: 'violet',
      style: {
        fontFamily: 'serif',
        fontSize: 'md',
        borderRadius: 'xl'
      }
    }
  },
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Standard job application form template',
    category: 'hr',
    icon: 'briefcase',
    form: {
      title: 'Job Application',
      description: 'Thank you for your interest in joining our team!',
      questions: [
        {
          id: 'q1',
          type: 'short-text',
          title: 'Full Name',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'q2',
          type: 'email',
          title: 'Email Address',
          required: true,
          placeholder: 'your@email.com'
        },
        {
          id: 'q3',
          type: 'phone',
          title: 'Phone Number',
          required: true,
          placeholder: 'Your phone number'
        },
        {
          id: 'q4',
          type: 'address',
          title: 'Current Address',
          required: false
        },
        {
          id: 'q5',
          type: 'dropdown',
          title: 'Position Applied For',
          required: true,
          options: ['Software Developer', 'Designer', 'Product Manager', 'Marketing', 'Sales', 'Other']
        },
        {
          id: 'q6',
          type: 'number',
          title: 'Years of Experience',
          required: true,
          validation: { min: 0, max: 50 }
        },
        {
          id: 'q7',
          type: 'file',
          title: 'Upload Resume/CV',
          required: true
        },
        {
          id: 'q8',
          type: 'date',
          title: 'Earliest Start Date',
          required: false
        },
        {
          id: 'q9',
          type: 'long-text',
          title: 'Why do you want to work with us?',
          required: true,
          placeholder: 'Tell us about yourself and your motivation...',
          validation: { minLength: 50 }
        }
      ],
      settings: {
        showProgressBar: true
      },
      theme: 'slate',
      style: {
        fontFamily: 'sans',
        fontSize: 'sm',
        borderRadius: 'none'
      }
    }
  },
  {
    id: 'event-registration',
    name: 'Event Registration',
    description: 'Collect RSVPs and registration info for events',
    category: 'events',
    icon: 'calendar',
    form: {
      title: 'Event Registration',
      description: 'Register for our upcoming event',
      questions: [
        {
          id: 'q1',
          type: 'short-text',
          title: 'Full Name',
          required: true,
          placeholder: 'Your name'
        },
        {
          id: 'q2',
          type: 'email',
          title: 'Email Address',
          required: true,
          placeholder: 'your@email.com'
        },
        {
          id: 'q3',
          type: 'phone',
          title: 'Phone Number',
          required: false
        },
        {
          id: 'q4',
          type: 'multiple-choice',
          title: 'Will you be attending?',
          required: true,
          options: ['Yes, I will attend', 'No, I cannot attend', 'Maybe']
        },
        {
          id: 'q5',
          type: 'number',
          title: 'Number of Guests',
          required: false,
          placeholder: '0',
          validation: { min: 0, max: 10 }
        },
        {
          id: 'q6',
          type: 'checkbox',
          title: 'Dietary Restrictions',
          required: false,
          options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Nut allergy', 'Dairy-free', 'None']
        },
        {
          id: 'q7',
          type: 'dropdown',
          title: 'How did you hear about this event?',
          required: false,
          options: ['Email invitation', 'Social media', 'Word of mouth', 'Website', 'Other']
        },
        {
          id: 'q8',
          type: 'long-text',
          title: 'Any questions or special requirements?',
          required: false,
          placeholder: 'Let us know if you have any questions...'
        }
      ],
      settings: {
        showProgressBar: true
      },
      theme: 'coral',
      style: {
        fontFamily: 'display',
        fontSize: 'lg',
        borderRadius: '2xl'
      }
    }
  },
  {
    id: 'quiz-template',
    name: 'Quiz/Assessment',
    description: 'Create quizzes and assessments',
    category: 'education',
    icon: 'file-question',
    form: {
      title: 'Knowledge Quiz',
      description: 'Test your knowledge with this quick quiz!',
      questions: [
        {
          id: 'q1',
          type: 'short-text',
          title: 'Your Name',
          required: true,
          placeholder: 'Enter your name'
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          title: 'Question 1: What is 2 + 2?',
          required: true,
          options: ['3', '4', '5', '22']
        },
        {
          id: 'q3',
          type: 'multiple-choice',
          title: 'Question 2: Which planet is closest to the Sun?',
          required: true,
          options: ['Venus', 'Mercury', 'Mars', 'Earth']
        },
        {
          id: 'q4',
          type: 'checkbox',
          title: 'Question 3: Select all prime numbers',
          required: true,
          options: ['2', '3', '4', '5', '6', '7']
        },
        {
          id: 'q5',
          type: 'short-text',
          title: 'Question 4: What is the capital of France?',
          required: true,
          placeholder: 'Enter your answer'
        },
        {
          id: 'q6',
          type: 'slider',
          title: 'Question 5: Rate your confidence in your answers',
          required: false,
          validation: { min: 1, max: 10, step: 1 }
        }
      ],
      settings: {
        showProgressBar: true,
        randomizeQuestions: false
      },
      theme: 'teal',
      style: {
        fontFamily: 'mono',
        fontSize: 'md',
        borderRadius: 'lg'
      }
    }
  }
];

// Template categories for filtering
export const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: 'layout' },
  { id: 'business', name: 'Business', icon: 'briefcase' },
  { id: 'feedback', name: 'Feedback', icon: 'message-square' },
  { id: 'hr', name: 'HR & Recruiting', icon: 'users' },
  { id: 'events', name: 'Events', icon: 'calendar' },
  { id: 'education', name: 'Education', icon: 'graduation-cap' },
  { id: 'custom', name: 'My Templates', icon: 'star' }
];

// Get all templates (built-in + user's custom templates)
export async function getAllTemplates(userId = null) {
  const templates = [...BUILT_IN_TEMPLATES.map(t => ({ ...t, isBuiltIn: true }))];
  
  if (userId) {
    try {
      const q = query(collection(db, 'templates'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        templates.push({ 
          id: doc.id, 
          ...doc.data(), 
          isBuiltIn: false,
          category: 'custom'
        });
      });
    } catch (error) {
      console.error('Error fetching user templates:', error);
    }
  }
  
  return templates;
}

// Get a single template by ID
export async function getTemplateById(templateId, userId = null) {
  // Check built-in templates first
  const builtIn = BUILT_IN_TEMPLATES.find(t => t.id === templateId);
  if (builtIn) {
    return { ...builtIn, isBuiltIn: true };
  }
  
  // Check user templates
  if (userId) {
    try {
      const docRef = doc(db, 'templates', templateId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().userId === userId) {
        return { id: docSnap.id, ...docSnap.data(), isBuiltIn: false };
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  }
  
  return null;
}

// Save a form as a custom template
export async function saveAsTemplate(userId, name, description, form) {
  try {
    const templateData = {
      userId,
      name,
      description,
      icon: 'file-text',
      category: 'custom',
      form: {
        title: form.title,
        description: form.description,
        questions: form.questions.map(q => ({
          ...q,
          id: `q${Math.random().toString(36).substr(2, 9)}` // Generate new IDs
        })),
        settings: form.settings || {},
        theme: form.theme || 'blue',
        style: form.style || {
          fontFamily: 'sans',
          fontSize: 'md',
          borderRadius: 'lg'
        }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'templates'), templateData);
    return { id: docRef.id, ...templateData, isBuiltIn: false };
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
}

// Delete a custom template
export async function deleteTemplate(templateId, userId) {
  try {
    const docRef = doc(db, 'templates', templateId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Template not found');
    }
    
    if (docSnap.data().userId !== userId) {
      throw new Error('Not authorized to delete this template');
    }
    
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// Apply template to create a new form
export function applyTemplate(template) {
  // Generate new unique IDs for questions
  const questions = template.form.questions.map((q, index) => ({
    ...q,
    id: `q_${Date.now()}_${index}`
  }));
  
  return {
    title: template.form.title,
    description: template.form.description || '',
    questions,
    settings: template.form.settings || {},
    theme: template.form.theme || 'blue',
    style: template.form.style || {
      fontFamily: 'sans',
      fontSize: 'md',
      borderRadius: 'lg'
    }
  };
}
