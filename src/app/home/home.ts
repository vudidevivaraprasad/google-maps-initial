import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component,ElementRef,NgZone,OnInit,ViewChild } from '@angular/core';
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
  walkingPath: google.maps.Polyline | null = null;
  initailliveshow:boolean=true
  zoom = 12;
  time:string = '';
  distance:string = '';
  userIneractingMaps:boolean=false;

  // marker option objects you can bind to <map-marker [options]="...">
  liveMarker:string = '/human.svg'
  destionMarker:string = '/destination.svg'

  constructor(private zone:NgZone,private directionservice:MapDirectionsService,private cdr:ChangeDetectorRef){
        this.getlivelocation()
  }

  ngAfterViewInit(): void {
    const autocomplete = new google.maps.places.Autocomplete(this.search.nativeElement, {
      fields: ['geometry', 'name'],
    });

    autocomplete.addListener('place_changed', () => {
      this.zone.run(() => {
        const place = autocomplete.getPlace();
        const location = place.geometry?.location;

        if (location) {
          const pos = {
            lat: location.lat(),
            lng: location.lng(),
          };
          this.searhcedpos = pos
          this.initailliveshow = false
          this.cdr.detectChanges()
          // this.mapRef.googleMap?.panTo(pos);
          console.log("search",this.livelocation.lat?this.livelocation:this.markerdlocaton,this.searhcedpos)
          this.directions(this.searhcedpos)

          const bounds = new google.maps.LatLngBounds();
          bounds.extend(this.livelocation);   // source
          bounds.extend(this.searhcedpos);    // destination

          this.mapRef.googleMap?.fitBounds(bounds);

          // this.mapRef.googleMap?.panTo(this.livelocation);
          // this.startlivetracking(this.livelocation)
        }
      })
    });

    this.directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true   // VERY IMPORTANT — prevents zoom flicker
      });
    this.directionsRenderer.setMap(this.mapRef.googleMap!)
    this.timedistanceservice = new google.maps.DistanceMatrixService();
    this.directionsService = new google.maps.DirectionsService();
  }

  getlivelocation(){
    if(navigator.geolocation){
      navigator.geolocation.watchPosition(
      pos => {
        this.zone.run(() => {
          if(pos.coords){
            this.livelocation = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            }
            this.initailliveshow ? this.mapRef.googleMap?.moveCamera({center: this.livelocation,zoom: 18,}):''

            if(this.searhcedpos.lat && !this.userIneractingMaps){
              this.directions(this.searhcedpos);
              this.mapRef.googleMap?.moveCamera({center: this.livelocation,zoom: 18,});
              // this.mapRef.googleMap?.setZoom(18);
            }

            this.cdr.detectChanges()

            console.log("position",pos.coords.longitude,pos.coords.altitude)
            console.log("livelocation",this.livelocation)
          }
        })
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
        this.zone.run(() => {
          if(status === 'OK' && result){
            const startLiteral: google.maps.LatLngLiteral = {
              lat: result.routes[0].legs[0].start_location.lat(),
              lng: result.routes[0].legs[0].start_location.lng()
            };

            this.drawWalkingDots(origin,startLiteral)
            this.directionsRenderer.setDirections(result)
          }
        })
      }
    )

    this.timedistanceservice.getDistanceMatrix(
      {origins:[origin],destinations:[destination],travelMode:google.maps.TravelMode.DRIVING},
      (result,status) => {
        if(status === 'OK' && result){
          this.zone.run(() => {
            const data = result.rows[0].elements[0]
            console.log('data',data)
            this.zone.run(() => {
              this.time = data.duration.text
              this.distance = data.distance.text
              this.cdr.detectChanges()
            });
            console.log('data',this.time)
            console.log('data',this.distance)
          })

        }
      }
    )
  }

  drawWalkingDots(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral) {
    if (this.walkingPath) this.walkingPath.setMap(null); // remove old line

    this.walkingPath = new google.maps.Polyline({
      path: [from, to],
      map: this.mapRef.googleMap!,
      strokeColor: "#0000FF",
      strokeOpacity: 0,
      icons: [
        {
          icon: {
            path: "M 0,-1 0,1",   // dot
            strokeOpacity: 1,
            scale: 3,
          },
          offset: "0",
          repeat: "10px",        // spacing between dots
        },
      ],
    });
  }

  onUserMove(){
    this.userIneractingMaps = true
  }

  userLiveDirectionsBtnClick(){
    this.mapRef.googleMap?.moveCamera({center: this.livelocation,zoom: 18,});
    // this.mapRef.googleMap?.setZoom(18);
    this.userIneractingMaps = false
  }

}
