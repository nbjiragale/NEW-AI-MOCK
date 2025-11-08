import React from 'react';

const testimonials = [
  {
    quote: "InterviewAI completely changed how I prepare for interviews. The AI feedback was brutally honest but incredibly helpful. I landed my dream job at a FAANG company!",
    name: "Sarah L.",
    title: "Software Engineer",
    imageUrl: "https://i.pravatar.cc/100?u=sarah"
  },
  {
    quote: "As a product manager, communication is key. This tool helped me refine my storytelling and present my case studies more effectively. A must-have for any PM.",
    name: "David C.",
    title: "Product Manager",
    imageUrl: "https://i.pravatar.cc/100?u=david"
  },
  {
    quote: "I used to be so nervous before interviews. Practicing with the AI in a safe environment built my confidence immensely. I felt so prepared on the actual day.",
    name: "Emily R.",
    title: "UX Designer",
    imageUrl: "https://i.pravatar.cc/100?u=emily"
  }
];

const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 md:py-32 bg-dark">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Trusted by Aspiring Professionals</h2>
          <p className="mt-4 text-lg text-gray-400">
            See what our users have to say about their experience and success with InterviewAI.
          </p>
        </div>
        <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 flex flex-col">
              <div className="flex-grow mb-6">
                <p className="text-gray-300 italic">"{testimonial.quote}"</p>
              </div>
              <div className="flex items-center">
                <img className="w-12 h-12 rounded-full mr-4 object-cover" src={testimonial.imageUrl} alt={testimonial.name} />
                <div>
                  <p className="font-bold text-white">{testimonial.name}</p>
                  <p className="text-sm text-primary">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;