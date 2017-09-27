import { Component } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { AlertController } from 'ionic-angular';
import { SocialSharing } from '@ionic-native/social-sharing';
import { File } from '@ionic-native/file';

declare var cordova: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  cameraImage: any;

  constructor(private camera: Camera, private alertCtrl: AlertController, private socialSharing: SocialSharing, private file: File) {}

  takepicture() {

    const options: CameraOptions = {
      quality: 100,
      destinationType: this.camera.DestinationType.FILE_URI,
      encodingType: this.camera.EncodingType.JPEG,
      mediaType: this.camera.MediaType.PICTURE,
      sourceType: this.camera.PictureSourceType.CAMERA,
      targetHeight: 2000,
      targetWidth: 2000,
      correctOrientation: true,
      saveToPhotoAlbum: false
    };

    this.camera.getPicture(options).then((imagePath) =>{

      const currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
      const currentPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);

      const newName = new Date().getTime() + '.jpg'; // Storing the image with timestamp name
    
      // Storing the image in the Dedicated Application folder and then refreshing device gallery so that it would be visibile in the gallery immediately, rather than application's data folder (which may be public[externalDataDirectory] or private[dataDirectory] but not tracable by the android OS and thus does not appear in the gallery) 
      this.file.createDir(cordova.file.externalRootDirectory, 'Pic Sharer/', false).then(() => {
        this.createAlert('Directory created');
      }).catch(() => {
        this.createAlert('Directory already exists');
      });
    
      this.file.moveFile(currentPath, currentName, cordova.file.externalRootDirectory+'Pic Sharer/', newName).then(
        (success) => {

          this.cameraImage = cordova.file.externalRootDirectory + 'Pic Sharer/' +newName;

          /* Using a non ionic native plugin of cordova, whose method will be available on 'window' object of the browser at runtime. For more explanation see the notes below */
          (<any>window).refreshMedia.refresh(this.cameraImage);

          this.createAlert(this.cameraImage);
          this.createAlert('Image successfully stored in persistent storage');

        }).catch((err) => {
          this.createAlert(err);
        });

    }).catch((err) => {
      const alert = this.alertCtrl.create({
        title: 'Error Occured',
        message: err
      });
      alert.present();
    });

  }

  socialSharer() {
    this.socialSharing.share("Sharing Image", "Image", this.cameraImage, null).then((data) => {
      const alert = this.alertCtrl.create({
        title: 'Shared Successfully',
        message: data
      });
      alert.present();
    }).catch((err) => {
      const alert = this.alertCtrl.create({
        title: 'Error Occured',
        message: err.message
      });
      alert.present();
    });
  }

  createAlert(text: string) {
    const alert = this.alertCtrl.create({
      title: 'Notification',
      message: text
    });
    alert.present();
  }

}


/* File Storage Notes
=================================================================

The file is created successfully but I can't find that on my device because the dataDirectory path which I indicates to create the file, is a private path and my device file manager doesn't have access to it. Actually dataDirectory is an Internal Storage option.

Internal Storage: Store private data on the device memory.

You can save files directly on the device's internal storage. By default, files saved to the internal storage are private to your application and other applications cannot access them (nor can the user). When the user uninstalls your application, these files are removed.

How to create a public file?

So, to create a file on my device that I can access it with the file manager, I have to use one of public path options like:externalDataDirectory. Before, I was thinking it is for storing files on an external SD Card that I had not on my phone, so I didn't test it. But testing it today, it creates the file on my internal device storage in Android/data/<app-id>/files path which is public and I can access it with device file manager.

Actually the term internal and external was misleading for me while external storage can be a removable storage media (such as an SD card) or an internal (non-removable) storage(reference).

Android Gallery Refresher Cordova Plugin
=======================================================================

This plugin was made to refresh the gallery on android device. When you save an image on android device, this image does not appears on gallery. This plugin updates the image gallery.
=> cordova plugin add cordova-plugin-refresh-gallery

window.refreshMedia(imagePath)   // Clobbers in plugin.xml

Using a Plugin Not Included in Ionic Native
========================================================================

There are many plugins supported in Ionic Native already, but you’ll likely run into a situation where the plugin you want isn’t included (and depending on the plugin you want to use, it may never be).

The way in which you use a non Ionic Native plugin in Ionic 2 is the same as the way you would use it in any Cordova project, which is however the plugin’s documentation says you should use it. However, there are some extra steps you need to take because TypeScript will cause some problems.

TypeScript likes to know about everything in your application up front, so much so that it will refuse to even build your application if you try to use something that it doesn’t know about.

Unforuntately, most Cordova plugins are incorporated into your project when the project is built for a device, not when you are testing through the browser. In most cases you will access the plugins functionality through the plugins namespace on Window:

window.plugins.somePlugin.doSomething();

or through a global object that is made available by the plugin:

someGlobal.doSomething();

…but TypeScript doesn’t know about this, so it complains:

error TS2339: Property 'plugins' does not exist on type 'Window'.

Fortunately, there’s an easy way to get around this – we just need to tell TypeScript what’s up. To get around the issue with Window, you can just declare an any type directly on the window, i.e:

(<any>window).plugins.somePlugin.doSomething();

or in the case of a global object, you can declare it using:

declare var someGlobal;

above the @Component decorator. It is common to do this for the cordova global, i.e. 

declare var cordova; 

Using those two steps should get your around most TypeScript issues you will face. However, keep in mind that the functionality still doesn’t exist in the browser, so even though your application will build successfully (which is important to be able to deploy it to a device in the first place), if you are testing through the browser your application will still break if you are making a call to the plugin.

*/
