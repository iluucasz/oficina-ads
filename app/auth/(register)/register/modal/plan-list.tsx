"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation, EffectCoverflow } from "swiper/modules";
import { X, Check } from "lucide-react";

const plans = [
  {
    title: "Plano Básico",
    price: "Free",
    description:
      "Ideal para usuário que desejam fazer simulação de venda.",
    benefits: [
      "Acesso a ánalise de precificação",
      "Simulação de vendas",
      "Sugestão de compras e vendas",
      "Métricas e gráficos de venda",
    ],
  },
  {
    title: "Plano Premium",
    price: "R$59,99/mês",
    description:
      "Perfeito para usuários frequentes que desejam aproveitar benefícios exclusivos.",
    benefits: [
      "Todos os recursos do Plano Básico",
      "Integração com Google Ads, Google Analytics, Facebook Ads",
      "Suporte prioritário",
      "Acesso antecipado a novas funcionalidades",
    ],
  },
  {
    title: "Plano Empresarial",
    price: "R$149,99/mês",
    description:
      "Ideal para empresas e comerciantes que desejam ampliar seus negócios na plataforma.",
    benefits: [
      "Todos os recursos do Plano básico e Premium",
      "Gestão de múltiplas contas",
      "Consultoria empresarial",
      "Ofertas personalizadas",
    ],
  },
];

const PlanList = () => {
  return (
    <section className="py-16" id="plans">
      <div className="container mx-auto">
        <h2 className="text-center text-xl xl:text-3xl font-semibold text-gray-900 mb-3">
          Benefícios de <span className="text-blue-600">Cada Plano</span>
        </h2>
        <p className="text-xs md:text-base xl:leading-7 text-center text-gray-600 mb-12">
          Passe pelos planos para ver os benefícios oferecidos.
        </p>

        <Swiper
          modules={[Pagination, Navigation, EffectCoverflow]}
          effect="coverflow"
          grabCursor={true}
          pagination={{ clickable: true }}
          navigation={true} // Habilita as setas laterais
          centeredSlides={true} // Centraliza o slide ativo
          coverflowEffect={{
            rotate: 50, // Rotação dos slides laterais
            stretch: 0, // Distância entre os slides
            depth: 200, // Profundidade dos slides
            modifier: 1, // Intensidade do efeito
            slideShadows: true, // Sombra em slides laterais
          }}
        //   keyboard={true}
        //   mousewheel={true}
          loop={true}
          breakpoints={{
            640: {
              slidesPerView: 1.5, 
            },
            1024: {
              slidesPerView: 2.5, 
            },
            1440: {
              slidesPerView: 3, 
            },
          }}
          className="w-full max-w-5xl mx-auto"
        >
          {plans.map((plan, index) => (
            <SwiperSlide key={index}>
              <div className="bg-gray-100 rounded-xl p-8 flex flex-col items-center text-center">
                <h4 className="text-xl xl:text-2xl font-semibold text-gray-900">
                  {plan.title}
                </h4>
                <span className="text-xl xl:text-2xl font-semibold text-blue-600 mb-4">
                  {plan.price}
                </span>
                <p className="text-xs md:text-base w-[200px] md:w-full xl:leading-7 text-center text-gray-600 mb-12">
                  {plan.description}
                </p>

                <ul className="space-y-3 text-left">
                  {plan.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-3 ">
                      {benefit.includes("Sem") ? (
                        <X className="w-4 h-4 text-red-600" />
                      ) : (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                      <span className="text-sm xl:text-base text-gray-900">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default PlanList;
