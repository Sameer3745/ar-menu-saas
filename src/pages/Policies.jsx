 import React from "react";

export default function Policies() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 space-y-8">
        <h1 className="text-3xl font-bold text-center text-yellow-600">
          Policies & Legal Information
        </h1>

        {/* About Us */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">About Us</h2>
          <p>
            ArMenu is a restaurant menu platform that helps
            restaurants showcase their dishes in stunning  view and allows customers
            to order easily from their table. We aim to enhance dining
            experiences with immersive technology and smooth payment options.
          </p>
        </section>

        {/* Pricing Policy */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Pricing Policy</h2>
          <p>
            Prices of menu items are set by respective restaurants. Platform fee
            of ₹1 to ₹50 may be charged on UPI transactions. All prices are inclusive
            of applicable taxes unless stated otherwise.
          </p>
        </section>

        {/* Contact Us */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
          <p>
            Email: ar.menu.saas@gmail.com<br />
            Phone: +91 9424374517<br />
            Address: Singrauli,Madhya pardesh,India
          </p>
        </section>

        {/* Terms & Conditions */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Terms & Conditions</h2>
          <p>
            By using ArMenu, you agree to provide accurate order details,
            respect restaurant policies, and make timely payments. We are only a
            technology provider and not responsible for food quality or delivery
            time. Restaurants are solely responsible for their listed items.
          </p>
        </section>

        {/* Privacy Policy */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">Privacy Policy</h2>
          <p>
            We value your privacy. Customer data such as name, phone, and email
            is used only for order processing and communication. We do not sell
            or share your personal data with third parties, except as required
            for payment processing or by law.
          </p>
        </section>

        {/* Cancellation & Refund Policy */}
        <section>
          <h2 className="text-2xl font-semibold mb-2">
            Cancellation & Refund Policy
          </h2>
          <p>
            Orders once placed cannot be cancelled after confirmation. Refunds
            will only be issued if the restaurant is unable to deliver your
            order or in case of failed payments. Refunds (if approved) will be
            processed to your original payment method within 5–7 working days.
          </p>
        </section>

        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ArMenu. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
