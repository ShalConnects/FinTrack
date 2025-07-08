import React from 'react';
import { Check, Star } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  isPopular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    features: [
      'Basic financial tracking',
      'Up to 3 accounts',
      'Basic reports',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    currency: 'USD',
    features: [
      'Everything in Free',
      'Unlimited accounts',
      'Advanced analytics',
      'Multi-currency support',
      'Priority support',
      'Custom categories',
    ],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    currency: 'USD',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'Dedicated support',
      'Advanced security',
    ],
  },
];

export const Plans: React.FC = () => {
  const { user } = useAuthStore();
  const currentPlan = user?.subscription?.plan || 'free';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Select the perfect plan for your financial needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border ${
              plan.isPopular
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 shadow'
            } p-8 transition-all duration-200 hover:shadow-xl`}
          >
            {plan.isPopular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Star className="w-4 h-4 mr-1" />
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-4 flex items-baseline justify-center">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="ml-1 text-xl text-gray-500">/month</span>
              </div>
            </div>

            <ul className="mt-8 space-y-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  currentPlan === plan.id
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.isPopular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? 'Current Plan' : 'Get Started'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </div>
  );
}; 