var app = angular.module('art', ['ui.router','ui.bootstrap','angular-jqcloud','ngResource','ngCookies','ngSanitize','ui.select','ngNotificationsBar','textAngular','ui.sortable']);

var setSmell = function(smell){ 
    var input = $('#smellname');
    input.val(smell);
    input.trigger('input');
};

app.controller('LoginController', ['UserService', 'ReplyErrorHandler', 'notifications', '$scope', '$state', 'currentUser', function(UserService, ReplyErrorHandler, notifications, $scope, $state, currentUser){
    $scope.logindata = {"email":"","password":"","keeploggedin":1};
    $scope.login = function(form) {
        UserService.login.login($scope.logindata,function(data, status, headers, config) {
            currentUser.profile = data;
            notifications.showSuccess("Logged in");
            $scope.logindata = {"email":"","password":"","keeploggedin":1};
            form.$setPristine();
            //$scope.loginform.$setPristine();
            if(currentUser.profile.startpage == "stay") {
                $state.go($state.current, {}, {reload: true});
                //$state.reload();
            } else {
                $state.go('root.' + currentUser.profile.startpage);
            }
        }, ReplyErrorHandler);
    };
}]);

app.controller('LogoutController', ['UserService', 'ReplyErrorHandler', 'notifications', '$scope', '$state', 'currentUser', function(UserService, ReplyErrorHandler, notifications, $scope, $state, currentUser){
    $scope.logout = function() {
        UserService.logout.logout({},function(data, status, headers, config) {
            notifications.showSuccess("Logged out");
            $scope.logindata = {"email":"","password":""};
            currentUser.profile = null;
            $state.go('root.home');
        }, ReplyErrorHandler);
    };
}]);

app.controller('UserViewController', ['UserService', 'ReplyErrorHandler', '$scope', '$stateParams', function(UserService, ReplyErrorHandler, $scope, $stateParams){
    $scope.startpages = ['home','arbrowser','smellbrowser','taskbrowser', 'stay'];
    $scope.user;
    $scope.getUser = function() {
        UserService.id.get({id: $stateParams.id},function(data, status, headers, config) {
            $scope.user = data;
        }, ReplyErrorHandler);
    };
    $scope.getUser();
}]);

app.controller('UserProfileController', ['UserService', 'RolesService', 'AvatarUploader', 'ReplyErrorHandler', 'PasswordValidator', 'notifications', '$scope','currentUser', '$state', function(UserService, RolesService, AvatarUploader, ReplyErrorHandler, PasswordValidator, notifications, $scope, currentUser, $state){
    $scope.startpages = ['home','arbrowser','smellbrowser','taskbrowser', 'stay'];
    $scope.user;
    $scope.pw;
    $scope.roles = [];
    $scope.pwcheck = [];
    RolesService.get({},function(data, status, headers, config) {
        $scope.roles = data;
    }, ReplyErrorHandler);
    
    UserService.id.get({id: currentUser.profile.id},function(data, status, headers, config) {
        $scope.user = data;
    }, ReplyErrorHandler);
    
    $scope.updateProfile = function() {
        UserService.noid.update({},$scope.user,function(data, status, headers, config) {
            notifications.showSuccess("Profile saved successful.");
        }, ReplyErrorHandler);
    }
    
    $scope.changePassword = function() {
        UserService.pw.update({},$scope.pw,function(data, status, headers, config) {
            notifications.showSuccess("Password has been changed.");
            $scope.pw = null;
            $scope.pwUpdateForm.$setPristine();
        }, ReplyErrorHandler);
    }
    
    $scope.getTime = function() {
        return new Date();
    }
    
    $scope.uploadAvatar = function() {
        AvatarUploader.upload($scope.avatarimage).success(function(data,status,headers,config){
            notifications.showSuccess("Avatar image has been uploaded.");
            $scope.avatarimage = null;
            $state.go($state.current, {}, {reload: true});
        }).error(function(data,status,headers,config){
            $scope.avatarimage = null;
            notifications.showError("Failed to upload avatar image: " + data);
        });
    }
    
    $scope.revalidate = function(pw, rpw) {
       $scope.pwcheck = PasswordValidator.check(pw, rpw);
    };
}]);

app.controller('UserCreateController', ['UserService', 'RolesService', 'ReplyErrorHandler', 'PasswordValidator', 'notifications', '$scope', '$state', function(UserService, RolesService, ReplyErrorHandler, PasswordValidator, notifications, $scope, $state){
    $scope.startpages = ['home','arbrowser','smellbrowser','taskbrowser', 'stay'];
    $scope.user = [];
    $scope.user.startpage = "stay";
    $scope.roles = [];
    $scope.pwcheck = [];
    RolesService.get({},function(data, status, headers, config) {
        $scope.roles = data;
        $scope.user.role = $scope.roles[2];
    }, ReplyErrorHandler);
    
    $scope.createUser = function() {
        UserService.noid.create($scope.user,function(data, status, headers, config) {
            notifications.showSuccess("User has been created.");
            $state.go('root.home');
        }, ReplyErrorHandler);
    };
    
    $scope.revalidate = function(pw, rpw) {
       $scope.pwcheck = PasswordValidator.check(pw, rpw);
    };
}]);

app.controller('MenuController', ['MenuService', 'ReplyErrorHandler', 'LastViewed', 'notifications', '$scope', function(MenuService, ReplyErrorHandler, LastViewed, notifications, $scope){
    $scope.menuItems = [];
    $scope.lastViewedItems = LastViewed.list;
    MenuService.get({},function(data, status, headers, config) {
        $scope.menuItems = data;
    }, ReplyErrorHandler); 
}]);

app.controller('StatsController', ['StatisticService', 'ReplyErrorHandler', 'notifications', '$scope', function(StatisticService, ReplyErrorHandler, notifications, $scope){
    $scope.stats = [];
    StatisticService.get({},function(data, status, headers, config) {
        $scope.stats = data;
    }, ReplyErrorHandler); 
}]);

app.controller('ArViewController', ['ArService', 'ReplyErrorHandler', '$stateParams', '$state', 'notifications', '$scope', '$filter', 'ConfirmModal','LastViewed', function(ArService, ReplyErrorHandler, $stateParams, $state, notifications, $scope, $filter, ConfirmModal, LastViewed) {
    var orderBy = $filter('orderBy');
    $scope.ar = {};
    $scope.discussion_id;

    $scope.currentar = [];
    $scope.discussion_id = null;
    //$scope.comments;
    $scope.setCurrentAr = function(id) {
        $scope.currentar = $scope.ar.versions[id];
        $scope.discussion_id = $scope.currentar.discussion.id;
        //$scope.comments = $scope.currentar.discussion.comments;
    }
    
    
    // Get Task Exeuction Type
    $scope.getType = function(propArray) {
        if(propArray) {
            for(var i = 0; i < propArray.length; i++) {
                if(propArray[i].property.name == 'Type') {
                    return propArray[i].value;
                }
            }
        }
        return "";
    }

    $scope.loadAr = function() {
        ArService.id.get({id: $stateParams.id},function(data, status, headers, config) {
            $scope.ar = data;
            $scope.ar.versions = orderBy($scope.ar.versions, 'created', true);
            $scope.setCurrentAr(0);
            var item = {'name': $scope.ar.versions[0].name, 'type': 'AR', 'id': $scope.ar.id};
            LastViewed.add(item);
        }, ReplyErrorHandler);
    }
    $scope.loadAr();
    
    $scope.deleteAr = function(id) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete the whole AR?'}).then(function (result) {
            ArService.id.delete({id: id},function(data, status, headers, config) {
                notifications.showSuccess("Ar " + id + " has been deleted.");
                $state.go('root.arbrowser');
            }, ReplyErrorHandler);
        }, function() {notifications.showInfo("Delete canceled.")});
    }
    
    $scope.deleteArVersion = function(id) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete this ArVersion?'}).then(function (result) {
            for(var i = 0, max = $scope.ar.versions.length; i < max; i++) {
                var a = $scope.ar.versions[i];

                if(a.id === id) {
                    $scope.ar.versions.splice(i, 1);
                    break;
                }
            }

            ArService.noid.update($scope.ar,function(data, status, headers, config) {
                notifications.showSuccess("ArVersion " + id + " has been removed.");
                $scope.loadAr();
            }, ReplyErrorHandler);
            /*ArVersionService.id.delete({id: id},function(data, status, headers, config) {
                notifications.showSuccess("ArVersion " + id + " has been deleted.");
                $scope.loadAr();
            }, ReplyErrorHandler);*/
        }, function() {notifications.showInfo("Delete canceled.")});
    }

}]);

app.controller('DiscussionController', ['DiscussionService', 'CommentService', 'ReplyErrorHandler', '$stateParams', 'notifications','$scope', function(DiscussionService, CommentService, ReplyErrorHandler, $stateParams, notifications, $scope) {
    $scope.newcomment;
    $scope.init = function () {
        $scope.newcomment = {};
        $scope.newcomment.comment = '';
    };
    $scope.init();
    
    //$scope.discussion_id = $scope.$parent.dicussion_id;
    $scope.discussion = {};
    
    $scope.$watch('discussion_id', function() {
        if($scope.discussion_id != null) {
            DiscussionService.id.get({id: $scope.discussion_id}, function(data, status, headers, config) {
                $scope.discussion = data;
            }, ReplyErrorHandler);
        }
    });
    
    $scope.updateComment = function (discussion_id, comment) {
        CommentService.noid.update(comment, function(data, status, headers, config) {
            notifications.showSuccess("Comment has been updated.");
        }, ReplyErrorHandler); 
    };

    $scope.addComment = function (discussion_id) {
        $scope.newcomment.discussion = { 'id': discussion_id };
        CommentService.noid.create($scope.newcomment, function(data, status, headers, config) {
            $scope.discussion.comments.unshift(data);
            $scope.init();
            notifications.showSuccess("Comment has been added.");
        }, ReplyErrorHandler);
    };

    $scope.like = function(comment) {
        CommentService.like.like({id: comment.id},function(data, status, headers, config) {
            notifications.showSuccess("Comment has been liked.");
            comment.likeCount++;
        }, ReplyErrorHandler);
    };
    
    /*$scope.discussion = [];
    DiscussionService.id.get({id: $stateParams.discussion_id},function(data, status, headers, config) {
        $scope.discussion = data;
    }, ReplyErrorHandler);*/
}]);

app.controller('ARController', ['ArService', 'ArVersionService', 'CloudSmells', 'ReplyErrorHandler', 'notifications','$scope','$filter', 'ConfirmModal', function(ArService, ArVersionService, CloudSmells, ReplyErrorHandler, notifications, $scope, $filter, ConfirmModal) {
    var orderBy = $filter('orderBy');
    $scope.arlist = []; //ars;
    this.formvisible = true;
    $scope.words = [];
    //$scope.words = words;
    $scope.cloudcallstatus = '&nbsp;<i class="glyphicon glyphicon-refresh glyphicon-refresh-animate"/> Loading...';
    
    $scope.loadArs = function () {
        ArVersionService.noid.get({},function(data, status, headers, config) {
            $scope.arlist = data;
        }, ReplyErrorHandler);  
    };
    $scope.loadArs();

    this.loadCloud = function () {
        CloudSmells.get().success(function(data,status,headers,config){
            $scope.words = eval(data);
            $scope.cloudcallstatus = "";
        }).error(function(data,status,headers,config){
            $scope.cloudcallstatus = "NOK";
            notifications.showError("Failed to load SmellCloud")
        });
    }
    this.loadCloud();

    this.showForm = function(visible) {
        if(visible == true) {
            this.formvisible = true;
        } else {
            this.formvisible = false;
        }
    };

    $scope.order = function(predicate, reverse) {
        $scope.arlist = orderBy($scope.arlist, predicate, reverse);
    };
    
    $scope.order('name', false);

    $scope.setSmellFilter = function(smell) {
        //alert('Hell0');
        $scope.search.smells.name = smell;
        $scope.order();
    };

    this.ar = {};
    /*this.addAr = function() {
            this.ar.createdOn = Date.now();
            this.arlist.push(this.ar);
            this.ar = {};
        };*/
    $scope.deleteAr = function(id) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete the whole AR?'}).then(function (result) {
            ArService.id.delete({id: id}, function(data, status, headers, config) {
                notifications.showSuccess("Delete of AR with id " + id + " and his versions succsessful.");
                $scope.loadArs();
            }, ReplyErrorHandler);  
        }, function() {notifications.showInfo("Delete canceled.")});
    };
    
    $scope.getPDF = function(id) {
        ArVersionService.id.pdf({id: id}, function(data, status, headers, config) {
        }, ReplyErrorHandler);
    };
}]);

app.controller('AREditController', ['ArService', 'ArVersionService', 'SmellService', 'TaskService', 'StatusService', 'ModelElementService', 'StatusService', 'ReplyErrorHandler', 'notifications', '$scope', '$stateParams', '$filter', 'PropModal', 'SmellModal', 'TaskModal', function(ArService, ArVersionService, SmellService, TaskService, StatusService, ModelElementService, StatusService, ReplyErrorHandler, notifications, $scope, $stateParams, $filter, PropModal, SmellModal, TaskModal) {
    $scope.ar = {'versions': []}; //ars;
    //$scope.ar.versions = [];
    $scope.arversion = {};
    $scope.arversion.properties = [];
    $scope.arversion.smells = [];
    $scope.arversion.tasks = [];
    $scope.smells = [];
    $scope.tasks = [];
    $scope.ar.versions.push($scope.arversion);
    $scope.modelelements = [];
    $scope.modelelementtypes = [];
    $scope.status = [];
    
    $scope.modelelementsvalues = [];
    
    $scope.modelelementsvalues.qas = [];
    $scope.modelelementsvalues.context = [];
    $scope.modelelementsvalues.components = [];
    $scope.modelelementsvalues.decisions = [];
    $scope.modelelementsvalues.references = [];
    
    // Get Task Exeuction Type
    $scope.getType = function(propArray) {
        if(propArray) {
            for(var i = 0; i < propArray.length; i++) {
                if(propArray[i].property.name == 'Type') {
                    return propArray[i].value;
                }
            }
        }
        return "";
    }
    
    $scope.loadArVersion = function() {
        ArVersionService.id.get({id: $stateParams.id}, function(data, status, headers, config) {
            $scope.arversion = data;
            $scope.modelelementsvalues.qas = $filter('arPropFilter')($scope.arversion.properties, 'QASElementLink');
            $scope.modelelementsvalues.context = $filter('arPropFilter')($scope.arversion.properties, 'ContextElementLink');
            $scope.modelelementsvalues.components = $filter('arPropFilter')($scope.arversion.properties, 'ComponentElementLink');
            $scope.modelelementsvalues.decisions = $filter('arPropFilter')($scope.arversion.properties, 'DecisionElementLink');
            $scope.modelelementsvalues.references = $filter('arPropFilter')($scope.arversion.properties, 'ReferenceElementLink');
            $scope.arversion.properties = [];
        }, ReplyErrorHandler);
    }
    $scope.loadArVersion();
    
    $scope.addcreatedProp = function(typeAndnewProp) {
        $scope.loadProps(typeAndnewProp.type);
        switch(typeAndnewProp.type) {
            case 'QASElementLink':
                $scope.modelelementsvalues.qas.push(typeAndnewProp.newProp);
                break;
            case 'ContextElementLink':
                $scope.modelelementsvalues.context.push(typeAndnewProp.newProp);
                break;
            case 'ComponentElementLink':
                $scope.modelelementsvalues.components.push(typeAndnewProp.newProp);
                break;
            case 'DecisionElementLink':
                $scope.modelelementsvalues.decisions.push(typeAndnewProp.newProp);
                break;
            case 'ReferenceElementLink':
                $scope.modelelementsvalues.references.push(typeAndnewProp.newProp);
                break;
            default:
                break;
        }
    }
    
    $scope.openPropModal = function(type) {
        PropModal.open(type, $scope.addcreatedProp, function() {});
        //PropModal.open(type, function() {$scope.loadValues()}, function() {});
    }
    
    $scope.addcreatedSmell = function(newSmell) {
        $scope.loadSmells();
        $scope.arversion.smells.push(newSmell);
    }

    $scope.openSmellModal = function(type) {
        SmellModal.open(type, $scope.addcreatedSmell, function() {});
    }
    
    $scope.addcreatedTask = function(newTask) {
        $scope.loadTasks();
        $scope.arversion.tasks.push(newTask);
    }
    
    $scope.openTaskModal = function(type) {
        TaskModal.open(type, $scope.addcreatedTask, function() {});
    }
    
    $scope.loadSmells = function () {
        SmellService.noid.get({},function(data, status, headers, config) {
            $scope.smells = data;
        }, ReplyErrorHandler);     
    };

    $scope.loadTasks = function () {
		TaskService.noid.get({},function(data, status, headers, config) {
		    $scope.tasks = data;
		}, ReplyErrorHandler);   
    };
    
    $scope.loadValues = function () {
        StatusService.get({},function(data, status, headers, config) {
            $scope.status = data;
        }, ReplyErrorHandler);        
        $scope.loadSmells();
        $scope.loadTasks();
        ModelElementService.type.get({},function(data, status, headers, config) {
            $scope.modelelementtypes = data;
            $scope.loadAllProps();
        }, ReplyErrorHandler);  
    };
    $scope.loadValues();
    
    $scope.loadProps = function(type) {
        switch(type) {
            case 'QASElementLink':
                ModelElementService.qas.get({},function(data, status, headers, config) {
                    $scope.modelelements.qas = data;
                }, ReplyErrorHandler);  
                break;
            case 'ContextElementLink':
                ModelElementService.context.get({},function(data, status, headers, config) {
                    $scope.modelelements.context = data;
                }, ReplyErrorHandler); 
                break;
            case 'ComponentElementLink':
                ModelElementService.components.get({},function(data, status, headers, config) {
                    $scope.modelelements.components = data;
                }, ReplyErrorHandler);  
                break;
            case 'DecisionElementLink':
                ModelElementService.decisions.get({},function(data, status, headers, config) {
                    $scope.modelelements.decisions = data;
                }, ReplyErrorHandler);  
                break;
            case 'ReferenceElementLink':
                ModelElementService.references.get({},function(data, status, headers, config) {
                    $scope.modelelements.references = data;
                }, ReplyErrorHandler);  
                break;
            default:
                break;
        }       
    }
    
    $scope.loadAllProps = function() {
        for(var i = 0;i < $scope.modelelementtypes.length;i++) {
            $scope.loadProps($scope.modelelementtypes[i]);
        }
    }

    $scope.mergeProperties = function() {
        $scope.arversion.properties = [].concat(
            $scope.modelelementsvalues.qas,
            $scope.modelelementsvalues.context,
            $scope.modelelementsvalues.components,
            $scope.modelelementsvalues.decisions,
            $scope.modelelementsvalues.references
            );
    }
    
    $scope.saveAr = function() {
        $scope.mergeProperties();
        ArVersionService.noid.update($scope.arversion, function(data, status, headers, config) {
            notifications.showSuccess("ArVersion has been updated successfully.");
        }, ReplyErrorHandler);
    }

    /*       
    this.progMax = 200;

    this.setProgValue = function() {

        this.progStacked = [];
        var types = ['success', 'info', 'warning', 'danger'];

        for (var i = 0, n = Math.floor((Math.random() * 4) + 1); i < n; i++) {
            var index = Math.floor((Math.random() * 4));
            this.progStacked.push({
                value: Math.floor((Math.random() * 30) + 1),
                type: types[index]
            });
        }
            var value = Math.floor((Math.random() * 100) + 1);
            var type;

            if (value < 25) {
                type = 'success';
            } else if (value < 50) {
                type = 'info';
            } else if (value < 75) {
                type = 'warning';
            } else {
                type = 'danger';
            }

            this.showProgWarning = (type === 'danger' || type === 'warning');

            this.progDynamic = value;
            this.progType = type;
            
    };
    this.setProgValue();*/
}]);

app.controller('ARAddController', ['ArService', 'ArVersionService', 'SmellService', 'TaskService', 'ModelElementService', 'StatusService', 'ReplyErrorHandler', 'notifications', '$scope', '$stateParams', '$filter', '$state', 'PropModal', 'TaskModal', 'SmellModal', function(ArService, ArVersionService, SmellService, TaskService, ModelElementService, StatusService, ReplyErrorHandler, notifications, $scope, $stateParams, $filter, $state, PropModal, TaskModal, SmellModal) {
    $scope.ar = {'versions': []}; //ars;
    //$scope.ar.versions = [];
    $scope.arversion = {};
    $scope.arversion.properties = [];
    $scope.arversion.smells = [];
    $scope.arversion.tasks = [];
    $scope.smells = [];
    $scope.tasks = [];
    $scope.ar.versions.push($scope.arversion);
    $scope.modelelements = [];
    $scope.modelelementtypes = [];
    $scope.status = [];

    $scope.modelelementsvalues = [];
    
    $scope.modelelementsvalues.qas = [];
    $scope.modelelementsvalues.context = [];
    $scope.modelelementsvalues.components = [];
    $scope.modelelementsvalues.decisions = [];
    $scope.modelelementsvalues.references = [];
    
    if($stateParams.id && $stateParams.id != '') {
        ArVersionService.id.get({id: $stateParams.id}, function(data, status, headers, config) {
            $scope.arversion = data;
            $scope.ar.id = $scope.arversion.arhead.id;
            $scope.arversion.discussion = {};
            //$scope.arversion.commentary = {};
            $scope.modelelementsvalues.qas = $filter('arPropFilter')($scope.arversion.properties, 'QASElementLink');
            $scope.modelelementsvalues.context = $filter('arPropFilter')($scope.arversion.properties, 'ContextElementLink');
            $scope.modelelementsvalues.components = $filter('arPropFilter')($scope.arversion.properties, 'ComponentElementLink');
            $scope.modelelementsvalues.decisions = $filter('arPropFilter')($scope.arversion.properties, 'DecisionElementLink');
            $scope.modelelementsvalues.references = $filter('arPropFilter')($scope.arversion.properties, 'ReferenceElementLink');
            $scope.arversion.properties = [];
            $scope.arversion.id = null;
        }, ReplyErrorHandler);
    }
    
    $scope.addcreatedProp = function(typeAndnewProp) {
        $scope.loadProps(typeAndnewProp.type);
        switch(typeAndnewProp.type) {
            case 'QASElementLink':
                $scope.modelelementsvalues.qas.push(typeAndnewProp.newProp);
                break;
            case 'ContextElementLink':
                $scope.modelelementsvalues.context.push(typeAndnewProp.newProp);
                break;
            case 'ComponentElementLink':
                $scope.modelelementsvalues.components.push(typeAndnewProp.newProp);
                break;
            case 'DecisionElementLink':
                $scope.modelelementsvalues.decisions.push(typeAndnewProp.newProp);
                break;
            case 'ReferenceElementLink':
                $scope.modelelementsvalues.references.push(typeAndnewProp.newProp);
                break;
            default:
                break;
        }
    }
    
    $scope.openPropModal = function(type) {
        PropModal.open(type, $scope.addcreatedProp, function() {});
    }
    
    $scope.loadSmells = function () {
        SmellService.noid.get({},function(data, status, headers, config) {
            $scope.smells = data;
        }, ReplyErrorHandler);     
    };
    
    $scope.addcreatedSmell = function(newSmell) {
        $scope.loadSmells();
        $scope.arversion.smells.push(newSmell);
    }

    $scope.openSmellModal = function(type) {
        SmellModal.open(type, $scope.addcreatedSmell, function() {});
    }
    
    $scope.loadTasks = function () {
		TaskService.noid.get({},function(data, status, headers, config) {
		    $scope.tasks = data;
		}, ReplyErrorHandler);   
    };
    
    $scope.addcreatedTask = function(newTask) {
        $scope.loadTasks();
        $scope.arversion.tasks.push(newTask);
    }
    
    $scope.openTaskModal = function(type) {
        TaskModal.open(type, $scope.addcreatedTask, function() {});
    }

    $scope.loadValues = function () {
        StatusService.get({},function(data, status, headers, config) {
            $scope.status = data;
            $scope.arversion.status = $scope.status[0];
        }, ReplyErrorHandler);        
    	$scope.loadSmells();
    	$scope.loadTasks();
        ModelElementService.type.get({},function(data, status, headers, config) {
            $scope.modelelementtypes = data;
            $scope.loadAllProps();
        }, ReplyErrorHandler);  
    };
    $scope.loadValues();
    
    $scope.loadProps = function(type) {
        switch(type) {
            case 'QASElementLink':
                ModelElementService.qas.get({},function(data, status, headers, config) {
                    $scope.modelelements.qas = data;
                }, ReplyErrorHandler);  
                break;
            case 'ContextElementLink':
                ModelElementService.context.get({},function(data, status, headers, config) {
                    $scope.modelelements.context = data;
                }, ReplyErrorHandler); 
                break;
            case 'ComponentElementLink':
                ModelElementService.components.get({},function(data, status, headers, config) {
                    $scope.modelelements.components = data;
                }, ReplyErrorHandler);  
                break;
            case 'DecisionElementLink':
                ModelElementService.decisions.get({},function(data, status, headers, config) {
                    $scope.modelelements.decisions = data;
                }, ReplyErrorHandler);  
                break;
            case 'ReferenceElementLink':
                ModelElementService.references.get({},function(data, status, headers, config) {
                    $scope.modelelements.references = data;
                }, ReplyErrorHandler);  
                break;
            default:
                break;
        }       
    }
    
    $scope.loadAllProps = function() {
        for(var i = 0;i < $scope.modelelementtypes.length;i++) {
            $scope.loadProps($scope.modelelementtypes[i]);
        }
    }

    $scope.mergeProperties = function() {
        //angular.extend(ar.versions, arversion);
        $scope.arversion.properties = [].concat(
            $scope.modelelementsvalues.qas,
            $scope.modelelementsvalues.context,
            $scope.modelelementsvalues.components,
            $scope.modelelementsvalues.decisions,
            $scope.modelelementsvalues.references
            );
    }
    
    $scope.saveAr = function() {
        $scope.mergeProperties();
        if($stateParams.id && $stateParams.id != '') {
            ArVersionService.noid.create($scope.arversion, function(data, status, headers, config) {
                notifications.showSuccess("ArVersion has been added successfully.");
                $state.go('root.singlear', {id: data.arhead.id});
            }, ReplyErrorHandler);
        } else {
            ArService.noid.create($scope.ar, function(data, status, headers, config) {
                notifications.showSuccess("Ar has been added successfully.");
                $state.go('root.singlear', {id: data.id});
            }, ReplyErrorHandler);
        }
    }

    this.progMax = 200;

    this.setProgValue = function() {

        this.progStacked = [];
        var types = ['success', 'info', 'warning', 'danger'];

        for (var i = 0, n = Math.floor((Math.random() * 4) + 1); i < n; i++) {
            var index = Math.floor((Math.random() * 4));
            this.progStacked.push({
                value: Math.floor((Math.random() * 30) + 1),
                type: types[index]
            });
        }
        /*       
            var value = Math.floor((Math.random() * 100) + 1);
            var type;

            if (value < 25) {
                type = 'success';
            } else if (value < 50) {
                type = 'info';
            } else if (value < 75) {
                type = 'warning';
            } else {
                type = 'danger';
            }

            this.showProgWarning = (type === 'danger' || type === 'warning');

            this.progDynamic = value;
            this.progType = type;
            */
    };
    this.setProgValue();
}]);

app.controller('ModelElementController', ['ModelElementService', 'ReplyErrorHandler', 'ConfirmModal', 'notifications', '$scope', '$stateParams', '$filter', function(ModelElementService, ReplyErrorHandler, ConfirmModal, notifications, $scope, $stateParams, $filter) {
    var orderBy = $filter('orderBy');
    $scope.modelelementlist = [];
    $scope.modelelementtypes = [];
    $scope.selectedtype = '';
    
    $scope.loadModelElementTypes = function() {
        ModelElementService.type.get({}, function(data, status, headers, config) {
            $scope.modelelementtypes = data;
        }, ReplyErrorHandler);
    }
    $scope.loadModelElementTypes();
    
    $scope.loadModelElements = function(form) {
        ModelElementService.noid.get({}, function(data, status, headers, config) {
            $scope.modelelementlist = data;
        }, ReplyErrorHandler);  
    }
    $scope.loadModelElements();
    
    $scope.deleteElement = function(elementid) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete this element?'}).then(function (result) {
            ModelElementService.id.delete({id: elementid},function(data, status, headers, config) {
                notifications.showSuccess("Model Element Link has been deleted.");
                $scope.loadModelElements();
            }, ReplyErrorHandler);  
        }, function() {notifications.showInfo("Delete canceled.")});
    }
    
    $scope.order = function(predicate, reverse) {
        $scope.modelelementlist = orderBy($scope.modelelementlist, predicate, reverse);
    };
    $scope.order('name', false);
}]);

app.controller('ModelElementAddController', ['ModelElementService', 'ReplyErrorHandler', 'notifications', '$modalInstance', '$scope', '$stateParams', 'modelelementtype', function(ModelElementService, ReplyErrorHandler, notifications, $modalInstance, $scope, $stateParams, modelelementtype) {
    $scope.modelelement = {};
    $scope.modelelement.type = modelelementtype;
    
    $scope.saveModelElement = function(form) {
        ModelElementService.noid.create($scope.modelelement, function(data, status, headers, config) {
            notifications.showSuccess("Model Element of type " + $scope.modelelement.type + " has been added.");
            $scope.modelelement = {};
            form.$setPristine();
            // close method accepts only one parameter, therefore the two necessary values are packed into an array.
            var propArray = [];
            propArray.type = modelelementtype;
            propArray.newProp = data;
            $modalInstance.close(propArray);
        }, ReplyErrorHandler);  
    }
    
    $scope.dismiss = function(form) {
        $modalInstance.dismiss('cancel');
    }
}]);

app.controller('ModelElementUpdateController', ['ModelElementService', 'ReplyErrorHandler', 'notifications', '$modalInstance', '$scope', '$stateParams', function(ModelElementService, ReplyErrorHandler, notifications, $modalInstance, $scope, $stateParams) {
    $scope.modelelement = {};
    $scope.loadModelElement = function() {
        ModelElementService.id.get({id: $stateParams.id}, function(data, status, headers, config) {
            $scope.modelelement = data;
        }, ReplyErrorHandler);  
    }
    $scope.loadModelElement();
    
    $scope.saveModelElement = function(form) {
        ModelElementService.noid.update($scope.modelelement, function(data, status, headers, config) {
            notifications.showSuccess("Model Element of type " + $scope.modelelement.type + " has been updated.");
            $scope.modelelement = {};
            form.$setPristine();
            $modalInstance.close();
        }, ReplyErrorHandler);  
    }
    
    $scope.dismiss = function(form) {
        $modalInstance.dismiss('cancel');
    }    
}]);

app.controller('SmellGroupController', ['SmellGroupService', 'ReplyErrorHandler', 'ConfirmModal', 'notifications', '$scope', '$stateParams', '$filter', function(SmellGroupService, ReplyErrorHandler, ConfirmModal, notifications, $scope, $stateParams, $filter) {
    var orderBy = $filter('orderBy');
    $scope.smellgrouplist = [];
    
    $scope.loadSmellGroups = function() {
        SmellGroupService.noid.get({}, function(data, status, headers, config) {
            $scope.smellgrouplist = data;
        }, ReplyErrorHandler);  
    }
    $scope.loadSmellGroups();
    
    $scope.deleteSmellGroup = function(id) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete this Smell Group?'}).then(function (result) {
            SmellGroupService.id.delete({id: id},function(data, status, headers, config) {
                notifications.showSuccess("Smell Group has been deleted.");
                $scope.loadSmellGroups();
            }, ReplyErrorHandler);  
        }, function() {notifications.showInfo("Delete canceled.")});
    }
    
    $scope.order = function(predicate, reverse) {
        $scope.smellgrouplist = orderBy($scope.smellgrouplist, predicate, reverse);
    };
    $scope.order('name', false);
}]);

app.controller('SmellGroupAddController', ['SmellGroupService', 'ReplyErrorHandler', 'notifications', '$modalInstance', '$scope', '$stateParams', 'modelelementtype', function(SmellGroupService, ReplyErrorHandler, notifications, $modalInstance, $scope, $stateParams, modelelementtype) {
    $scope.smellgroup = {};
    
    $scope.saveSmellGroup = function(form) {
        SmellGroupService.noid.create($scope.smellgroup, function(data, status, headers, config) {
            notifications.showSuccess("Smell Group has been added.");
            $scope.smellgroup = {};
            form.$setPristine();
            $modalInstance.close();
        }, ReplyErrorHandler);  
    }
    
    $scope.dismiss = function(form) {
        $modalInstance.dismiss('cancel');
    }
}]);

app.controller('SmellGroupUpdateController', ['SmellGroupService', 'ReplyErrorHandler', 'notifications', '$modalInstance', '$scope', '$stateParams', function(SmellGroupService, ReplyErrorHandler, notifications, $modalInstance, $scope, $stateParams) {
    $scope.smellgroup = {};
    $scope.loadSmellGroup = function() {
        SmellGroupService.id.get({id: $stateParams.id}, function(data, status, headers, config) {
            $scope.smellgroup = data;
        }, ReplyErrorHandler);  
    }
    $scope.loadSmellGroup();
    
    $scope.saveSmellGroup = function(form) {
        SmellGroupService.noid.update($scope.smellgroup, function(data, status, headers, config) {
            notifications.showSuccess("Smell Group has been updated.");
            $scope.smellgroup = {};
            form.$setPristine();
            $modalInstance.close();
        }, ReplyErrorHandler);  
    }
    
    $scope.dismiss = function(form) {
        $modalInstance.dismiss('cancel');
    }    
}]);

app.controller('ARSearchController', ['ArService', 'ArVersionService', 'UserSearchService', 'ReplyErrorHandler', 'ConfirmModal', 'notifications','$scope', '$stateParams', '$filter', '$state', function(ArService, ArVersionService, UserSearchService, ReplyErrorHandler, ConfirmModal, notifications, $scope, $stateParams, $filter, $state) {
    var orderBy = $filter('orderBy');
    $scope.arlist = []; //ars;
    $scope.arsearch = {};
    $scope.loadArs = function () {
        ArVersionService.search.get(JSON.parse($stateParams.smellids),function(data, status, headers, config) {
            $scope.arlist = data;
        }, ReplyErrorHandler);  
    };
    $scope.loadArs();

    $scope.order = function(predicate, reverse) {
        $scope.arlist = orderBy($scope.arlist, predicate, reverse);
    };
    
    $scope.order('name', false);
    
    $scope.saveSearch = function(form) {
        $scope.arsearch.search = $stateParams.smellids;
        UserSearchService.noid.create($scope.arsearch, function(data, status, headers, config) {
            notifications.showSuccess("Search has been added to your profile.");
            $scope.arsearch = {};
            form.$setPristine();
            $state.go('root.usersearches');
        }, ReplyErrorHandler);  
    }
    
    $scope.deleteAr = function(id) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete the whole AR?'}).then(function (result) {
            ArService.id.delete({id: id}, function(data, status, headers, config) {
                notifications.showSuccess("Delete of AR with id " + id + " and his versions succsessful.");
                $scope.loadArs();
            }, ReplyErrorHandler);  
        }, function() {notifications.showInfo("Delete canceled.")});
    };
}]);

app.controller('UserSearchController', ['UserSearchService', 'ReplyErrorHandler', 'ConfirmModal', 'notifications','$scope', function(UserSearchService, ReplyErrorHandler, ConfirmModal, notifications, $scope, $stateParams) {
    $scope.searchlist = []; //ars;
    
    $scope.loadSearches = function () {
        UserSearchService.noid.get({},function(data, status, headers, config) {
            $scope.searchlist = data;
        }, ReplyErrorHandler);  
    };
    $scope.loadSearches();
    
    $scope.deleteSearch = function(searchid) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete this search?'}).then(function (result) {
            UserSearchService.id.delete({id: searchid},function(data, status, headers, config) {
                notifications.showSuccess("User search has been deleted.");
                $scope.loadSearches();
            }, ReplyErrorHandler);
        }, function() {notifications.showInfo("Delete canceled.")});
    }
}]);

app.controller('SmellAssessController', ['ArVersionService', 'SmellGroupService', 'ReplyErrorHandler', 'notifications', '$scope', '$state', function(ArVersionService, SmellGroupService, ReplyErrorHandler, notifications, $scope, $state) {
    $scope.counter;
    $scope.groups = [];
    $scope.groupToggle = [];
    $scope.groupAllCheck = [];
    $scope.arlist = [];
    SmellGroupService.assess.get({},function(data, status, headers, config) {
            $scope.groups = data;
        }, ReplyErrorHandler);  
    $scope.selectedSmells = {"smellids": [] };
    
    $scope.groupAllshow = false;
    $scope.groupToggleAll = function() {
        $scope.groupAllshow = !$scope.groupAllshow;
        for(var i = 0;i < $scope.groupToggle.length;i++) {
            $scope.groupToggle[i] = $scope.groupAllshow;
        }
    }
    
    $scope.toggleGroupSelect = function(index) {
        $scope.groupAllCheck[index] = !$scope.groupAllCheck[index];
        for(var i=0; i<$scope.groups[index].smells.length ;i++) {
            var n=$scope.groups[index].smells[i];
            var idx = $scope.selectedSmells.smellids.indexOf(n.id);

            if($scope.groupAllCheck[index]) {
                if (idx == -1) {
                    $scope.selectedSmells.smellids.push(n.id);                	
                }
            } else {
                if (idx > -1) {
                    $scope.selectedSmells.smellids.splice(idx, 1);
                }            	
            }
        }
        $scope.getSmellCount();
    }
    
    $scope.loadArs = function () {
        ArVersionService.search.get($scope.selectedSmells,function(data, status, headers, config) {
            $scope.arlist = data;
        }, ReplyErrorHandler);  
    };
    
    $scope.getSmellCount = function () {
    	if($scope.selectedSmells.smellids.length != 0) {
	        ArVersionService.count($scope.selectedSmells).success(function(data,status,headers,config){
	            $scope.counter = data;
	        }).error(function(data,status,headers,config){
	            notifications.showError("Failed to get Ar count.");
	        });
            $scope.loadArs();
    	} else {
            $scope.counter = 0;
            $scope.arlist = [];
    	}
    };

    $scope.resetForm = function() {
        $scope.selectedSmells = {"smellids": [] };
        $scope.groupAllCheck = [];
        $scope.counter = 0;
    };
    
    $scope.resetForm();
    
    $scope.executeSearch = function() {
        $state.go('root.arsearch', {smellids: JSON.stringify($scope.selectedSmells)})
    }
    
    $scope.toggleSelection = function toggleSelection(smell_id) {
        var idx = $scope.selectedSmells.smellids.indexOf(smell_id);

        // is currently selected
        if (idx > -1) {
            $scope.selectedSmells.smellids.splice(idx, 1);
        }
        // is newly selected
        else {
            $scope.selectedSmells.smellids.push(smell_id);
        }
        $scope.getSmellCount();
    };
    
}]);

app.controller('SmellAddController', ['SmellService', 'SmellGroupService', 'StatusService', 'ReplyErrorHandler', 'notifications', '$scope', 'sharedSmell', function(SmellService, SmellGroupService, StatusService, ReplyErrorHandler, notifications, $scope, sharedSmell) {
    $scope.smell = sharedSmell.smell;
    $scope.questionToAdd;
    $scope.status = [];
    $scope.loadStatus = function () {
        StatusService.get({},function(data, status, headers, config) {
            $scope.status = data;
            $scope.smell.status = $scope.status[0];
        }, ReplyErrorHandler);
    };
    $scope.loadStatus();
    $scope.groups = [];
    $scope.loadGroups = function () {
        SmellGroupService.noid.get({},function(data, status, headers, config) {
            $scope.groups = data;
            $scope.smell.group = $scope.groups[0];
        }, ReplyErrorHandler);  
    };
    $scope.loadGroups();
    $scope.initSmell = function () {
        sharedSmell.clear();
        $scope.smell.questions = [];
        $scope.smell.tecdebtidx = 'mm';
        $scope.questionToAdd = '';
    }
    $scope.initSmell();
    $scope.saveSmell = function(form) {
        SmellService.noid.create($scope.smell,function(data, status, headers, config) {
            if($scope.loadSmells) {
                $scope.loadSmells();
            }
            notifications.showSuccess("Smell has been added.");
            $scope.initSmell();
            form.$setPristine();
        }, ReplyErrorHandler);  
    };
    
    $scope.cancel = function(form) {
        $scope.initSmell();
        $scope.smell.status = $scope.status[0];
        $scope.smell.group = $scope.groups[0];
        form.$setPristine();
    }
    
    $scope.addQuestion = function () {
        $scope.smell.questions.push({
            question: $scope.questionToAdd
        });
        $scope.questionToAdd = '';
    };
    
    $scope.removeQuestion = function (idx) {
        $scope.smell.questions.splice(idx, 1);
    };

}]);

/**
 * SmellModalAddController extends SmellAddController and overwrites the methods
 * saveSmell and cancel.
 */
app.controller('SmellModalAddController', ['$controller', '$scope', '$modalInstance', 'SmellService', 'ReplyErrorHandler', 'notifications', function($controller, $scope, $modalInstance, SmellService, ReplyErrorHandler, notifications) {
	$controller('SmellAddController', {$scope: $scope});
    $scope.saveSmell = function(form) {
        SmellService.noid.create($scope.smell,function(data, status, headers, config) {
            if($scope.loadSmells) {
                $scope.loadSmells();
            }
            notifications.showSuccess("Smell has been added.");
            $scope.initSmell();
            form.$setPristine();
            if($modalInstance) {
            	$modalInstance.close(data);
            }
        }, ReplyErrorHandler);  
    };
    
    $scope.cancel = function(form) {
        $scope.initSmell();
        $scope.smell.status = $scope.status[0];
        $scope.smell.group = $scope.groups[0];
        form.$setPristine();
        if($modalInstance) {
        	$modalInstance.dismiss('cancel');
        }
    }
}]);

app.controller('SmellController', ['SmellService', 'SmellGroupService', 'ReplyErrorHandler', 'StatusService', 'ConfirmModal', 'notifications','$scope','$filter', 'sharedSmell', function(SmellService, SmellGroupService, ReplyErrorHandler, StatusService, ConfirmModal, notifications, $scope, $filter, sharedSmell) {
    var orderBy = $filter('orderBy');
    $scope.smelllist = [];
    $scope.formvisible = false;
    $scope.smell = sharedSmell.smell;
    $scope.status = [];
    $scope.loadStatus = function () {
        StatusService.get({},function(data, status, headers, config) {
            $scope.status = data;
        }, ReplyErrorHandler);  
    };
    $scope.loadStatus();
    $scope.groups = [];
    $scope.loadGroups = function () {
        SmellGroupService.noid.get({},function(data, status, headers, config) {
            $scope.groups = data;
        }, ReplyErrorHandler);  
    };
    $scope.loadGroups();

    $scope.showForm = function(visible) {
        if(visible == true) {
            $scope.formvisible = true;
        } else {
            $scope.formvisible = false;
        }
    };

    $scope.loadSmells = function () {
        SmellService.noid.get({},function(data, status, headers, config) {
            $scope.smelllist = data;
        }, ReplyErrorHandler);  
    };
    $scope.loadSmells();
    
    $scope.reload = function() {
        $scope.loadSmells();        
    }
    
    $scope.deleteSmell = function (id) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete this Smell?'}).then(function (result) {
            SmellService.id.delete({id: id},function(data, status, headers, config) {
                $scope.loadSmells();
                notifications.showSuccess("Smell has been deleted.");
            }, ReplyErrorHandler);
        }, function() {notifications.showInfo("Delete canceled.")});
    }

    $scope.order = function(predicate, reverse) {
        $scope.smelllist = orderBy($scope.smelllist, predicate, reverse);
    };
    $scope.order('name', false);
}]);

app.controller('SmellViewController', ['SmellService', 'ArVersionService', 'ConfirmModal', 'ReplyErrorHandler', 'notifications', '$stateParams', '$state', '$scope','LastViewed', function (SmellService, ArVersionService, ConfirmModal, ReplyErrorHandler, notifications, $stateParams, $state, $scope, LastViewed) {
    $scope.smell = {};
    $scope.smellids = {"smellids": [] };
    
    $scope.getSmell = function (smellid) {
        SmellService.id.get({id: smellid},function(data, status, headers, config) {
            $scope.smell = data;
            var item = {'name': $scope.smell.name, 'type': 'Smell', 'id': $scope.smell.id};
            LastViewed.add(item);
        }, ReplyErrorHandler);
    };
    $scope.getSmell($stateParams.id);
    
    $scope.deleteSmell = function (id) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete this Smell?'}).then(function (result) {
            SmellService.id.delete({id: id},function(data, status, headers, config) {
                $state.go('root.smellbrowser');
                notifications.showSuccess("Smell has been deleted.");
            }, ReplyErrorHandler);
        }, function() {notifications.showInfo("Delete canceled.")});
    }

    $scope.loadArs = function () {
        $scope.smellids.smellids.push($stateParams.id);
        ArVersionService.search.get($scope.smellids,function(data, status, headers, config) {
            $scope.arlist = data;
        }, ReplyErrorHandler);  
    };
    $scope.loadArs();
}]);

app.controller('SmellUpdateController', ['SmellService','SmellGroupService', 'StatusService', 'ReplyErrorHandler', 'notifications', '$modalInstance', '$scope', '$stateParams', 'smellid', function (SmellService, SmellGroupService, StatusService, ReplyErrorHandler, notifications, $modalInstance, $scope, $stateParams, smellid) {
    $scope.status = [];
    $scope.loadStatus = function () {
        StatusService.get({},function(data, status, headers, config) {
            $scope.status = data;
        }, ReplyErrorHandler);  
    };
    $scope.loadStatus();
    $scope.smell;
    $scope.initSmell = function () {
        $scope.smell = {};
        $scope.smell.questions = [];
        $scope.questionToAdd = '';
    }
    $scope.initSmell();
    $scope.groups = [];
    $scope.loadGroups = function () {
        SmellGroupService.noid.get({},function(data, status, headers, config) {
            $scope.groups = data;
        }, ReplyErrorHandler);  
    };
    $scope.loadGroups();
    $scope.getSmell = function (smellid) {
        SmellService.id.get({id: smellid},function(data, status, headers, config) {
            $scope.smell = data;
        }, ReplyErrorHandler);  
    };
    $scope.getSmell($stateParams.id);

    $scope.saveSmell = function() {
        SmellService.noid.update($scope.smell,function(data, status, headers, config) {
            $modalInstance.close();
            notifications.showSuccess("Smell has been updated.");
            $scope.smell = {};
        }, ReplyErrorHandler);
    };
    
    $scope.reload = function() {
        $scope.loadSmells();        
    }
       
    $scope.cancel = function(form) {
        $scope.initSmell();
        form.$setPristine();
        $modalInstance.dismiss('cancel');
    }
    
    $scope.addQuestion = function () {
        $scope.smell.questions.push({
            question: $scope.questionToAdd
        });
        $scope.questionToAdd = '';
    };
    
    $scope.removeQuestion = function (idx) {
        $scope.smell.questions.splice(idx, 1);
    };
}]);

app.controller('TaskController', ['TaskService', 'ExecTaskTypeService', 'TaskPropertyService', 'ReplyErrorHandler', 'ConfirmModal', 'notifications','$scope','$filter', '$sce', 'sharedTask', function(TaskService, ExecTaskTypeService, TaskPropertyService, ReplyErrorHandler, ConfirmModal, notifications, $scope, $filter, $sce, sharedTask) {
    var orderBy = $filter('orderBy');
    $scope.tasklist = [];
    $scope.task = sharedTask.task;
    $scope.formvisible = false;

    $scope.showForm = function(visible) {
        if(visible == true) {
            $scope.formvisible = true;
        } else {
            $scope.formvisible = false;
        }
    };
    
    $scope.getType = function(propArray) {
        if(propArray) {
            for(var i = 0; i < propArray.length; i++) {
                if(propArray[i].property.name == 'Type') {
                    return propArray[i].value;
                }
            }
        }
        return "";
    }

    $scope.loadTasks = function () {
        TaskService.noid.get({},function(data, status, headers, config) {
            $scope.tasklist = data;
            //$scope.smellcallstatus = "OK";
        }, ReplyErrorHandler);  
    };
    $scope.loadTasks();

    $scope.deleteTask = function (id) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete this Task?'}).then(function (result) {
            TaskService.id.delete({id: id},function(data, status, headers, config) {
                $scope.loadTasks();
                notifications.showSuccess("Task has been deleted.");
            }, ReplyErrorHandler);
        }, function() {notifications.showInfo("Delete canceled.")});
    }

    $scope.order = function(predicate, reverse) {
        $scope.tasklist = orderBy($scope.tasklist, predicate, reverse);
    };
    $scope.order('name', false);
}]);

app.controller('TaskAddController', ['TaskService', 'ExecTaskTypeService', 'TaskPropertyService', 'ReplyErrorHandler', 'notifications','$scope','$filter', '$sce', 'sharedTask', function(TaskService, ExecTaskTypeService, TaskPropertyService, ReplyErrorHandler, notifications, $scope, $filter, $sce, sharedTask) {
    $scope.exectasktypes = '';
    $scope.taskproperties = [];
    $scope.task = sharedTask.task;
    $scope.propertyToAdd = {};
    
    var execTypeHTML = '';
    
    var recursiveExecType = function(exectype, level) {
        exectype.forEach(function(entry){
            var element = "<option value='" + entry.name + "'>" + level + entry.name + "</option>";
            execTypeHTML += element;
            recursiveExecType(entry.subTasks, level + '&#8212;');
        });
    };
    
    $scope.loadExecTaskTypes = function () {
        ExecTaskTypeService.noid.get({},function(data, status, headers, config) {
            execTypeHTML = "<select class='form-control' ng-model='propertyToAdd.value'>";
            var subtasks = data[0].subTasks;
            recursiveExecType(subtasks, '');
            execTypeHTML += "</select>";
            $scope.exectasktypes = $sce.trustAsHtml(execTypeHTML);
        }, ReplyErrorHandler);  
    };
    $scope.loadExecTaskTypes();
    
    $scope.loadTaskProperties = function () {
        TaskPropertyService.noid.get({},function(data, status, headers, config) {
            $scope.taskproperties = data;
            $scope.propertyToAdd.property = $scope.taskproperties[0];
        }, ReplyErrorHandler);  
    };
    $scope.loadTaskProperties();
    
    $scope.initTask = function () {
        sharedTask.clear();
        $scope.task.properties = [];
        $scope.propertyToAdd = {property: {} };
    }
    $scope.initTask();
    
    $scope.cancel = function(form) {
        $scope.initTask();
        form.$setPristine();
        $scope.propertyToAdd.property = $scope.taskproperties[0];
    }

    $scope.saveTask = function(form) {
        TaskService.noid.create($scope.task,function(data, status, headers, config) {
            $scope.loadTasks();
            notifications.showSuccess("Task has been added.");
            $scope.initTask();
            form.$setPristine();
        }, ReplyErrorHandler);  
    };
    
    $scope.addProperty = function () {
        $scope.task.properties.push($scope.propertyToAdd);
        $scope.propertyToAdd = { property: {} };
    };
    
    $scope.removeProperty = function (idx) {
        $scope.task.properties.splice(idx, 1);
    };
}]);

/**
 * TaskModalAddController extends TaskAddController and overwrites the methods
 * saveTask and cancel.
 */
app.controller('TaskModalAddController', ['$controller', '$scope', '$modalInstance', 'TaskService', 'ReplyErrorHandler', 'notifications', function($controller, $scope, $modalInstance, TaskService, ReplyErrorHandler, notifications) {
	$controller('TaskAddController', {$scope: $scope});
    $scope.saveTask = function(form) {
        TaskService.noid.create($scope.task,function(data, status, headers, config) {
            notifications.showSuccess("Task has been added.");
            $scope.initTask();
            form.$setPristine();
            $modalInstance.close(data);
        }, ReplyErrorHandler);  
    };
    $scope.cancel = function(form) {
        $scope.initTask();
        form.$setPristine();
        $scope.propertyToAdd.property = $scope.taskproperties[0];
    	$modalInstance.dismiss('cancel');
    }
}]);
    
app.controller('TaskViewController', ['TaskService', 'ReplyErrorHandler', 'ConfirmModal', 'notifications', '$scope', '$stateParams', '$state', 'LastViewed', function(TaskService, ReplyErrorHandler, ConfirmModal, notifications, $scope, $stateParams, $state, LastViewed) {
    $scope.task = {};
    
    $scope.loadTask =function() {
        TaskService.id.get({id: $stateParams.id}, function(data, status, headers, config) {
            $scope.task = data;
            var item = {'name': $scope.task.name, 'type': 'Task', 'id': $scope.task.id};
            LastViewed.add(item);
        }, ReplyErrorHandler);  
    }
    $scope.loadTask();
    
    $scope.deleteTask = function (id) {
        ConfirmModal.showModal({}, {headerText: 'Confirm', bodyText: 'Are you sure you want to delete this Task?'}).then(function (result) {
            TaskService.id.delete({id: id},function(data, status, headers, config) {
                $state.go('root.taskbrowser');
                notifications.showSuccess("Task has been deleted.");
            }, ReplyErrorHandler);
        }, function() {notifications.showInfo("Delete canceled.")});
    }
}]);

app.controller('TaskUpdateController', ['TaskService', 'ExecTaskTypeService', 'TaskPropertyService', 'ReplyErrorHandler', 'notifications', '$modalInstance', '$scope', '$stateParams', 'taskid', '$sce', function (TaskService, ExecTaskTypeService, TaskPropertyService, ReplyErrorHandler, notifications, $modalInstance, $scope, $stateParams, smellid, $sce) {
    $scope.status = [];
    $scope.exectasktypes = '';
    $scope.taskproperties = [];
    $scope.propertyToAdd = {};
    $scope.task = {};
    
    var execTypeHTML = '';
    
    var recursiveExecType = function(exectype, level) {
        exectype.forEach(function(entry){
            var element = "<option value='" + entry.name + "'>" + level + entry.name + "</option>";
            execTypeHTML += element;
            recursiveExecType(entry.subTasks, level + '&#8212;');
        });
    };

    $scope.loadExecTaskTypes = function () {
        ExecTaskTypeService.noid.get({},function(data, status, headers, config) {
            execTypeHTML = "<select class='form-control' ng-model='propertyToAdd.value'>";
            var subtasks = data[0].subTasks;
            recursiveExecType(subtasks, '');
            execTypeHTML += "</select>";
            $scope.exectasktypes = $sce.trustAsHtml(execTypeHTML);
        }, ReplyErrorHandler);  
    };
    $scope.loadExecTaskTypes();
    
    $scope.loadTaskProperties = function () {
        TaskPropertyService.noid.get({},function(data, status, headers, config) {
            $scope.taskproperties = data;
            $scope.propertyToAdd.property = $scope.taskproperties[0];
        }, ReplyErrorHandler);  
    };
    $scope.loadTaskProperties();

    $scope.getTask = function (taskid) {
        TaskService.id.get({id: taskid},function(data, status, headers, config) {
            $scope.task = data;
        }, ReplyErrorHandler);  
    };
    $scope.getTask($stateParams.id);
    
    $scope.initTask = function () {
        $scope.task = {};
        $scope.task.properties = [];
        $scope.propertyToAdd = {};
    }
    
    $scope.cancel = function(form) {
        $scope.initTask();
        form.$setPristine();
        $scope.propertyToAdd.property = $scope.taskproperties[0];
        $modalInstance.dismiss('cancel');
    }

    $scope.saveTask = function() {
        TaskService.noid.update($scope.task,function(data, status, headers, config) {
            $modalInstance.close();
            notifications.showSuccess("Task has been updated.");
            $scope.task = {};
        }, ReplyErrorHandler);  
    };
    
    $scope.addProperty = function () {
        $scope.task.properties.push($scope.propertyToAdd);
        $scope.propertyToAdd = {};
    };
    
    $scope.removeProperty = function (idx) {
        $scope.task.properties.splice(idx, 1);
    };
}]);

app.controller("ExecTaskTypeController", ['ExecTaskTypeService', 'ReplyErrorHandler', 'notifications', '$scope', function(ExecTaskTypeService, ReplyErrorHandler, notifications, $scope) {
    $scope.exectypes = [];
    this.emptyexectype = [];
    $scope.loadExecTaskTypes = function() {
        ExecTaskTypeService.noid.get({},function(data, status, headers, config) {
            $scope.exectypes = data;
        }, ReplyErrorHandler);
    };
    $scope.loadExecTaskTypes();

    ExecTaskTypeService.empty.get({},function(data, status, headers, config) {
        $scope.emptyexectype = data;
    }, ReplyErrorHandler); 

    $scope.delete = function(task) {
        task.subTasks = [];
    };

    $scope.hasChildren = function(task) {
        return task.subTasks.length > 0;
    }


    $scope.add = function(task) {
        var post = task.subTasks.length + 1;
        var newName = task.name + '-' + post;
        task.subTasks.push(angular.copy(this.emptyexectype));
    };

    $scope.save = function() {
        ExecTaskTypeService.noid.update($scope.exectypes, function(data, status, headers, config) {
            $scope.emptyexectype = data;
            notifications.showSuccess("Exec Task Types have been saved.");
        }, ReplyErrorHandler);  
    }
}]);

app.controller("FooterController", ['$scope', function($scope) {
	$scope.date = new Date();
}]);

app.controller("AboutController", ['$scope', function($scope) {
	$scope.date = new Date();
}]);