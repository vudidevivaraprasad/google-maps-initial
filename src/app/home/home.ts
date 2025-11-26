import { CommonModule } from '@angular/common';
import { AfterViewInit, Component,ElementRef,NgZone,OnInit,ViewChild } from '@angular/core';
import { GoogleMap, GoogleMapsModule, MapDirectionsResponse, MapDirectionsService } from '@angular/google-maps';
import { map, Observable } from 'rxjs';


@Component({
  selector: 'app-home',
  imports: [GoogleMapsModule,CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit {
  @ViewChild(GoogleMap) mapRef! :GoogleMap;
  @ViewChild('searchBox') search! :ElementRef;

  directionsService!:google.maps.DirectionsService;
  directionsRenderer!:google.maps.DirectionsRenderer;
  timedistanceservice!:google.maps.DistanceMatrixService;

  center:google.maps.LatLngLiteral = {lat:10,lng:10}
  livelocation:google.maps.LatLngLiteral = {} as google.maps.LatLngLiteral;
  markerdlocaton:google.maps.LatLngLiteral = {} as google.maps.LatLngAltitude;
  searhcedpos:google.maps.LatLngLiteral = {} as google.maps.LatLngLiteral;
  zoom = 12;
  time:string = '';
  distance:string = '';
  userIneractingMaps:boolean=false;

  constructor(private zone:NgZone,private directionservice:MapDirectionsService){
        this.getlivelocation()
  }

  ngAfterViewInit(): void {
    const autocomplete = new google.maps.places.Autocomplete(this.search.nativeElement, {
      fields: ['geometry', 'name'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;

      if (location) {
        const pos = {
          lat: location.lat(),
          lng: location.lng(),
        };
        this.searhcedpos = pos
        // this.mapRef.googleMap?.panTo(pos);
        console.log("search",this.livelocation.lat?this.livelocation:this.markerdlocaton,this.searhcedpos)
        this.directions(this.searhcedpos)
        // this.startlivetracking(this.livelocation)
      }
    });

    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.mapRef.googleMap!)
    this.timedistanceservice = new google.maps.DistanceMatrixService();
    this.directionsService = new google.maps.DirectionsService();
  }

  getlivelocation(){
    if(navigator.geolocation){
      navigator.geolocation.watchPosition(
      pos => {
        if(pos.coords){
          this.livelocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          }
          // this.mapRef.googleMap?.panTo(this.livelocation);
          this.searhcedpos.lat && !this.userIneractingMaps?this.directions(this.searhcedpos):''

          console.log("position",pos.coords.longitude,pos.coords.altitude)
          console.log("livelocation",this.livelocation)
        }
      },err => console.log('error while getting location'),
      {
        enableHighAccuracy:true,
        maximumAge:0,
        timeout:5000
      })
    }
    else{
      alert('Geolocation not supported')
    }
  }

  mapClick(event:google.maps.MapMouseEvent){
    if(event.latLng){
      this.markerdlocaton = event.latLng?.toJSON()
      this.livelocation = {} as google.maps.LatLngLiteral;
      this.searhcedpos.lat?this.directions(this.searhcedpos):''
    }
  }

  directions(destination:google.maps.LatLngLiteral){
    let origin = this.livelocation.lat?this.livelocation:this.markerdlocaton

    this.directionsService.route(
      {origin,destination,travelMode:google.maps.TravelMode.DRIVING},
      (result,status) => {
        if(status === 'OK' && result){
          this.directionsRenderer.setDirections(result)
        }
      }
    )

    this.timedistanceservice.getDistanceMatrix(
      {origins:[origin],destinations:[destination],travelMode:google.maps.TravelMode.DRIVING},
      (result,status) => {
        if(status === 'OK' && result){
          const data = result.rows[0].elements[0]
          console.log('data',data)
          this.zone.run(() => {
            this.time = data.duration.text
            this.distance = data.distance.text
          });
          console.log('data',this.time)
          console.log('data',this.distance)

        }
      }
    )
  }

  // startlivetracking(origin:google.maps.LatLngLiteral){
  //   let destination = this.searhcedpos
  //   this.directionsService.route(
  //     {origin,destination,travelMode:google.maps.TravelMode.DRIVING},
  //     (result,status) => {
  //       if(status === 'OK' && result){
  //         this.directionsRenderer.setDirections(result)
  //       }
  //     }
  //   )

  //   this.timedistanceservice.getDistanceMatrix(
  //     {origins:[origin],destinations:[destination],travelMode:google.maps.TravelMode.DRIVING},
  //     (result,status) => {
  //       if(status === 'OK' && result){
  //         const data = result.rows[0].elements[0]
  //         console.log('data',data)
  //         this.zone.run(() => {
  //           this.time = data.duration.text
  //           this.distance = data.distance.text
  //         });
  //         console.log('data',this.time)
  //         console.log('data',this.distance)

  //       }
  //     }
  //   )
  // }

  onUserMove(){
    this.userIneractingMaps = true
  }

  userLiveDirectionsBtnClick(){
    this.userIneractingMaps = false
  }

}
