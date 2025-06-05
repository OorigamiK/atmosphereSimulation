#version 330 core
out vec4 FragColor;

in vec3 VPos;

uniform sampler2D texture1;

uniform float playerData[10];

vec3 rotate(vec3 rayDir, vec2 rot){
    vec3 newDir=rayDir;
    newDir.y=rayDir.y*sin(rot.y)+rayDir.z*cos(rot.y);
    newDir.z=rayDir.y*cos(rot.y)-rayDir.z*sin(rot.y);
    newDir.x=rayDir.x*cos(rot.x)-newDir.z*sin(rot.x);
    newDir.z=rayDir.x*sin(rot.x)+newDir.z*cos(rot.x);
    return newDir;
}

float phase(float cosTheta, float g){
    float subRes1=1.5*(1-g*g)/(2*(2+g*g));
    float subRes2=(1+cosTheta*cosTheta)/(1+g*g-2*g*cosTheta);
    return subRes1*subRes2;
}

vec2 rayBallIntersection(vec3 rayDir, vec3 rayPos, vec3 spherePos, float r) {
    vec3 oc = rayPos - spherePos;

    float b = dot(rayDir, oc);
    float c = dot(oc, oc) - r * r;
    float discriminant = b * b - c;

    vec2 res = vec2(-1.0); // Default: no intersection
    if (discriminant > 0.0) {
        float sqrtDisc = sqrt(discriminant);
        float t1 = -b - sqrtDisc;
        float t2 = -b + sqrtDisc;
        res = vec2(max(0,t1), max(0,t2));
    }
    return res;
}

float scattering(float lambda, float strength){
    float res=strength/pow(lambda,4);
    return res;
}

float sunlightIntensity(float lambda) {
    // Approximate sun spectrum: red > green > blue
    if (lambda > 0.6) return 1.0;
    else if (lambda > 0.5) return 0.95;
    else return 0.85;
}

float scatteringStrength(vec3 P, vec3 sunPos, vec3 normal){
    vec3 B=(P-sunPos)/length(P-sunPos);
    return 0.5*(1+pow(dot(B,normal),2));
}

float outScattering(vec3 P1, vec3 P2, float strength, float lambda, float avgAtmosDensHeight, int numberOfIterations, vec3 spherePos, float atmosphereR, float planetR){
    float integral=0;
    for (int i=0;i<numberOfIterations;i++){
        float t=float(i + 0.5)/numberOfIterations;
        vec3 P=(1-t)*P1+t*P2;
        float distToSpherePos=length(spherePos-P);
        float height= (distToSpherePos-planetR)/(atmosphereR-planetR);
        height=max(0,min(1,height));

        integral+=exp(-1*height/avgAtmosDensHeight)*(1-height);
        
    
    }
    return integral*length(P1-P2)/(2*atmosphereR)*scattering(lambda, strength)/numberOfIterations;
}

vec3 toSun(vec3 P, vec3 sunPos, vec3 spherePos, float atmosphereR, float planetR){
    vec3 rayDir=(sunPos-P)/length(sunPos-P);
    vec2 distances=rayBallIntersection(rayDir, P, spherePos, atmosphereR);
    return P+rayDir*distances.y;
}

//I_v(\lambda) = I_s(\lambda) \times K(\lambda) \times F(\theta, g) \times \int_{P_a}^{P_b} \exp\left(\frac{-h}{H_0}\right) \times \exp\left(-t(P{P_c}, \lambda) - t(P{P_a}, \lambda)\right) \, ds
float inScattering(float strength, float lambda, float avgAtmosDensHeight, float g, vec3 P1, vec3 P2, int numberOfIterations1, int numberOfIterations2, vec3 spherePos, vec3 sunPos, float atmosphereR, float planetR){
    float integral=0;
    for (int i=0;i<numberOfIterations1;i++){
        float t=float(i + 0.5)/numberOfIterations1;
        vec3 P=(1-t)*P1+t*P2;
        vec3 PToSun=toSun(P, sunPos, spherePos, atmosphereR, planetR);
        float distToSpherePos=length(spherePos-P);
        float height= (distToSpherePos-planetR)/(atmosphereR-planetR);
        height=max(0,min(1, height));
        float t1=exp(-height/avgAtmosDensHeight)*(1-height);
        float t2 = outScattering(P, PToSun, strength, lambda, avgAtmosDensHeight,  numberOfIterations2, spherePos, atmosphereR, planetR);

        /*float toPlanet=rayBallIntersection(rayDir, P, spherePos, planetR).x;
        if (toPlanet==0){
            t2=0;
        }*/

        float t3 = outScattering(P, P1, strength, lambda, avgAtmosDensHeight, numberOfIterations2, spherePos, atmosphereR, planetR);
        integral+=t1*exp(-t2-t3);
    }

    float cosTheta=abs(dot(sunPos-P1, P2-P1))/length(sunPos-P1)/length(P2-P1);

    return sunlightIntensity(lambda) * scattering(lambda, strength) * phase(cosTheta,g) * integral*length(P1-P2)/(2*atmosphereR) / numberOfIterations1;
}

float surfaceScattering(float reflection, float strength, float lambda, float avgAtmosDensHeight, float g, vec3 P1, vec3 P2, int numberOfIterations1, int numberOfIterations2, vec3 spherePos, vec3 sunPos, float atmosphereR, float planetR){
    float I_v = inScattering(strength, lambda, avgAtmosDensHeight, g, P1, P2, numberOfIterations1, numberOfIterations2,spherePos, sunPos, atmosphereR,planetR);

    vec3 normal = -normalize(spherePos-P2);

    vec3 sunDir=-normalize(spherePos-sunPos);

    float cosTheta=max(0, dot(normal, sunDir));

    float scatterStrength=reflection*cosTheta*scattering(lambda, strength)*exp(-outScattering(P1, toSun(P1,sunPos, spherePos, atmosphereR, planetR), strength, lambda, avgAtmosDensHeight,  numberOfIterations2, spherePos, atmosphereR, planetR));

    return I_v+scatterStrength*exp(-outScattering(P1, P2, strength, lambda, avgAtmosDensHeight, numberOfIterations2, spherePos, atmosphereR, planetR));
}

float totalScattering(float reflection, float strength, float lambda, float avgAtmosDensHeight, float g, vec3 P1, vec3 P2, int numberOfIterations1, int numberOfIterations2, vec3 spherePos, vec3 sunPos, float atmosphereR, float planetR){
    vec2 d=rayBallIntersection((P2-P1)/length(P2-P1), P1, spherePos, planetR);
    if (d.y>0){
        P2=P1+d.x*(P2-P1)/length(P2-P1);
        return surfaceScattering(reflection, strength, lambda, avgAtmosDensHeight, g, P1, P2, numberOfIterations1, numberOfIterations2, spherePos, sunPos, atmosphereR, planetR);
    }
    else{
        return inScattering(strength, lambda, avgAtmosDensHeight, g, P1, P2, numberOfIterations1, numberOfIterations2, spherePos, sunPos, atmosphereR, planetR);
    }
}

void main()
{
    float time=playerData[0];
    vec3 sunPos=vec3(10000*cos(2*3.141*time),0,10000*sin(2*3.141*time));
    vec3 spherePos=vec3(0,0,1500);
    float planetR=800;
    float atmosphereR=1200;
    
    float g=0;
    float avgAtmosDensHeight=0.03125;

    //float lambdaR=0.650;
    //float lambdaG=0.550;
    //float lambdaB=0.450;

    float lambdaR=playerData[7];
    float lambdaG=playerData[8];
    float lambdaB=playerData[9];

    float scatterStrength=playerData[6];

    int numberOfIterations1=10;
    int numberOfIterations2=10;

    vec3 rayPos=vec3(playerData[1],playerData[2],playerData[3]);
    vec3 rayDir=normalize(vec3(VPos.x, VPos.y, 1));

    rayDir=rotate(rayDir, vec2(playerData[4], playerData[5]));

    vec2 d=rayBallIntersection(rayDir, rayPos, spherePos, atmosphereR);

    vec2 dPlanet=rayBallIntersection(rayDir,rayPos,spherePos,planetR);

    vec3 P1=d.x*rayDir+rayPos;
    vec3 P2=d.y*rayDir+rayPos;

    float tPlanet=min(dPlanet.x, dPlanet.y);

    vec3 Q=tPlanet*rayDir+rayPos-spherePos;

    vec4 planetColor=vec4(0,0,0,0);
    vec4 planetColorNoShadow=planetColor;
    if (tPlanet>0){
        vec3 lightDir=sunPos-Q;
        lightDir=lightDir/length(lightDir);
        Q=Q/length(Q);
        float theta=atan(Q.z,Q.x);
        float phi=acos(Q.y);
        float u=(theta+3.141592)/(2*3.141592)+time*0;
        float v=phi/3.141592;
        planetColor=vec4(texture(texture1, vec2(u,v)));
        planetColorNoShadow=planetColor;
        float lightRes=max(0,dot(lightDir,Q));
        planetColor=planetColor*lightRes;
        //planetColor=vec4(1,1,1,1);
                planetColorNoShadow=planetColor;


    }
    else{
        planetColor=vec4(0,0,0,0);
    }
    vec4 atmosphereColor=vec4(0,0,0,0);
    if ((d.x>0 || d.y>0) /*&& dPlanet.x<=0 && dPlanet.y<=0*/){
        float red=totalScattering(planetColorNoShadow.x, scatterStrength, lambdaR, avgAtmosDensHeight, g, P1, P2, numberOfIterations1, numberOfIterations2, spherePos, sunPos, atmosphereR, planetR);
        float green=totalScattering(planetColorNoShadow.y, scatterStrength, lambdaG, avgAtmosDensHeight, g, P1, P2, numberOfIterations1, numberOfIterations2, spherePos, sunPos, atmosphereR, planetR);
        float blue=totalScattering(planetColorNoShadow.z, scatterStrength, lambdaB, avgAtmosDensHeight, g, P1, P2, numberOfIterations1, numberOfIterations2, spherePos, sunPos, atmosphereR, planetR);
        atmosphereColor=vec4(red, green, blue,1);
    }

    float strengthR=scattering(lambdaR, scatterStrength)*exp(-outScattering(P1,P2, scatterStrength, lambdaR, avgAtmosDensHeight, numberOfIterations1, spherePos, atmosphereR,planetR));
    float strengthG=scattering(lambdaG, scatterStrength)*exp(-outScattering(P1,P2, scatterStrength, lambdaG, avgAtmosDensHeight, numberOfIterations1, spherePos, atmosphereR,planetR));
    float strengthB=scattering(lambdaB, scatterStrength)*exp(-outScattering(P1,P2, scatterStrength, lambdaB, avgAtmosDensHeight, numberOfIterations1, spherePos, atmosphereR,planetR));
    vec3 strength=vec3(strengthR, strengthG, strengthB);
    FragColor=mix(planetColor, atmosphereColor, vec4(strength,1));

    //gamma correction
    const float gamma = 2.2;
    FragColor.rgb = pow(FragColor.rgb, vec3(1.0 / gamma));
}