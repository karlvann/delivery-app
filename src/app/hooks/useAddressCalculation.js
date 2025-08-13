import { useCallback } from 'react';
import { calculateDistance, getAutocompleteService, extractStateFromAddress } from '../services/googleMapsService';
import { extractPostcode, isCorridorPostcode, getPostcodeZone } from '../services/postcodeService';
import { calculateDeliveryFee } from '../services/priceCalculator';

// Hook for address calculation - like a sous chef handling all the prep work
export function useAddressCalculation() {
  
  const processAddress = useCallback(async (address, includeTwoPerson = false) => {
    if (!address) {
      throw new Error('Address is required');
    }

    try {
      // Extract postcode - the key ingredient
      const postcode = extractPostcode(address);
      
      // Check corridors - the special menu items
      const sydBrisCorridor = postcode ? await isCorridorPostcode(postcode, 'sydney-brisbane') : false;
      const sydMelbCorridor = postcode ? await isCorridorPostcode(postcode, 'sydney-melbourne') : false;
      
      // Detect city from address - finding the right kitchen
      const state = extractStateFromAddress(address);
      let detectedCity = null;
      
      if (state) {
        if (['NSW', 'New South Wales'].includes(state)) detectedCity = 'sydney';
        else if (['QLD', 'Queensland'].includes(state)) detectedCity = 'brisbane';
        else if (['VIC', 'Victoria'].includes(state)) detectedCity = 'melbourne';
      }

      let result = {
        postcode,
        city: detectedCity,
        corridor: null,
        distance: null,
        fee: null,
        type: null,
        zone: null
      };

      // Handle corridor delivery - the express service
      if (sydBrisCorridor || sydMelbCorridor) {
        const corridorType = sydBrisCorridor ? 'sydney-brisbane' : 'sydney-melbourne';
        const feeInfo = calculateDeliveryFee({ 
          corridor: corridorType,
          city: detectedCity,
          includeTwoPerson 
        });
        
        result.corridor = corridorType;
        result.fee = feeInfo.deliveryFee;
        result.type = 'corridor';
      } 
      // Handle local delivery - the standard service
      else if (detectedCity) {
        const distanceResult = await calculateDistance(address, detectedCity);
        
        if (distanceResult.distanceInKm) {
          const feeInfo = calculateDeliveryFee({
            distanceInKm: distanceResult.distanceInKm,
            city: detectedCity,
            includeTwoPerson
          });
          
          result.distance = distanceResult.distanceInKm;
          result.fee = feeInfo.deliveryFee;
          result.type = 'local';
          
          // Get zone for Sydney deliveries
          if (detectedCity === 'sydney' && postcode) {
            result.zone = await getPostcodeZone(postcode);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Address calculation error:', error);
      throw error;
    }
  }, []);

  return { processAddress };
}