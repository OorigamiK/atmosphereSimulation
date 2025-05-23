#version 330 core
out vec4 FragColor;

in vec3 VPos;

uniform sampler2D texture1;

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

float scattering(float lambda){
    float scatteringConstant=1;
    return scatteringConstant;
}

float sunlightIntensity(float lambda){
    float a=1;
    return a;
}

float outScattering(vec3 P1, vec3 P2, float lambda, float avgAtmosDensHeight, int numberOfIterations, vec3 spherePos, float atmosphereR, float planetR){
    float integral=0;
    for (int i=0;i<numberOfIterations;i++){
        float t=float(i + 0.5)/numberOfIterations;
        vec3 P=(1-t)*P1+t*P2;
        float distToSpherePos=length(spherePos-P);
        float height= (distToSpherePos-planetR)/(atmosphereR-planetR);

        height=max(0,min(1,height));

        integral+=exp(-height/avgAtmosDensHeight)*(1-height);
        
    
    }
    return integral*scattering(lambda)/numberOfIterations;
}

//I_v(\lambda) = I_s(\lambda) \times K(\lambda) \times F(\theta, g) \times \int_{P_a}^{P_b} \exp\left(\frac{-h}{H_0}\right) \times \exp\left(-t(P{P_c}, \lambda) - t(P{P_a}, \lambda)\right) \, ds
float inScattering(float lambda, float avgAtmosDensHeight, float g, vec3 P1, vec3 P2, int numberOfIterations1, int numberOfIterations2, vec3 spherePos, vec3 sunPos, float atmosphereR, float planetR){
    float integral=0;
    for (int i=0;i<numberOfIterations1;i++){
        float t=float(i + 0.5)/numberOfIterations1;
        vec3 P=(1-t)*P1+t*P2;

        float distToSpherePos=length(spherePos-P);
        float height= (distToSpherePos-planetR)/(atmosphereR-planetR);
        height=max(0,min(1, height));
        float t1=exp(-height/avgAtmosDensHeight);

        float t2 = outScattering(P, sunPos, lambda, avgAtmosDensHeight,  numberOfIterations2, spherePos, atmosphereR, planetR);
        float t3 = outScattering(P, P1, lambda, avgAtmosDensHeight, numberOfIterations2, spherePos, atmosphereR, planetR);

        integral+=t1*exp(-t2-t3);
    }

    float cosTheta=abs(dot(sunPos-P1, P2-P1))/length(sunPos-P1)/length(P2-P1);

    return sunlightIntensity(lambda) * scattering(lambda) * phase(cosTheta,g) * integral / numberOfIterations1;
}

void main()
{
    vec3 sunPos=vec3(1000,0,1000);
    vec3 spherePos=vec3(0,0,300);
    float planetR=100;
    float atmosphereR=200;
    
    float g=0;
    float lambda=0.55;
    float avgAtmosDensHeight=0.25;

    int numberOfIterations1=10;
    int numberOfIterations2=10;

    vec3 rayPos=vec3(0,0,0);
    vec3 rayDir=vec3(VPos.x, VPos.y, 1);

    rayDir=rayDir/length(rayDir);

    vec2 d=rayBallIntersection(rayDir, rayPos, spherePos, atmosphereR);

    vec2 dPlanet=rayBallIntersection(rayDir,rayPos,spherePos,planetR);

    vec3 P1=d.x*rayDir+rayPos;
    vec3 P2=d.y*rayDir+rayPos;

    float tPlanet=min(dPlanet.x, dPlanet.y);

    vec3 Q=tPlanet*rayDir+rayPos-spherePos;

    vec4 planetColor=vec4(0,0,0,0);

    if (tPlanet>0){
        Q=Q/length(Q);
        float theta=atan(Q.z,Q.x);
        float phi=acos(Q.y);
        float u=(theta+3.141592)/(2*3.141592);
        float v=phi/3.141592;
        planetColor=vec4(texture(texture1, vec2(u,v)));
    }
    else{
        planetColor=vec4(0,0,0,0);
    }

    vec4 atmosphereColor=vec4(0,0,0,0);
    if ((d.x>0 || d.y>0) /*&& dPlanet.x<=0 && dPlanet.y<=0*/){
        float value=0;
        value=inScattering(lambda, avgAtmosDensHeight, g, P1,P2, numberOfIterations1, numberOfIterations2, spherePos, sunPos, atmosphereR, planetR);
        if (value>0){
            atmosphereColor=vec4(value, value, value,0);
        }
    }

    FragColor=planetColor*0.5+atmosphereColor*0.5;
}