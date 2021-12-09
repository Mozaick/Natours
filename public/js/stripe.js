/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51Iv8sgEUCGgxXSjHbq3mNcv4ZIVpDf5TpxdkldcJxaX440EfE5Gdz6SNYGMeCjU2YHMGoJjzntlmZZVekqziR06p00vbgfrFvu'
);

export const bookTour = async (tourId) => {
  try {
    // 1) get checkout session from API
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );

    // 2) create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
